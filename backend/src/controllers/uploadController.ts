import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { OCRService } from '../services/ocrService';
import { GeminiService } from '../services/geminiService';
import AnswerSheet from '../models/AnswerSheet';
import Progress from '../models/Progress';
import Profile from '../models/Profile';
import LearningPath from '../models/LearningPath';

// Ensure local uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Local Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are supported!'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single('file');

// Configure Cloudinary if credentials exist
const cloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name';

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Handles uploading an answer sheet, running OCR extraction, calling Gemini AI grading, and creating logs.
 */
export const processAnswerSheet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'Please upload a file' });
      return;
    }

    const { subject, topic } = req.body;
    if (!subject) {
      res.status(400).json({ success: false, message: 'Please specify the subject' });
      return;
    }

    const localFilePath = req.file.path;
    let fileUrl = `/uploads/${req.file.filename}`; // local path relative URL fallback

    // Attempt uploading to Cloudinary if configured
    if (cloudinaryConfigured) {
      try {
        console.log('Uploading answer sheet to Cloudinary...');
        const result = await cloudinary.uploader.upload(localFilePath, {
          folder: 'plis_answers',
        });
        fileUrl = result.secure_url;
        console.log(`Cloudinary Upload Success: ${fileUrl}`);
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, using local URL path instead:', cloudErr);
      }
    }

    // Step 1: Create a pending AnswerSheet entry
    const answerSheet = await AnswerSheet.create({
      studentId,
      subject,
      topic: topic || 'General Practice',
      fileUrl,
      fileName: req.file.originalname,
      status: 'processing',
    });

    // Run processing asynchronously so request returns fast or execute synchronously for simplicity
    // We execute it inside the request, but wrap it cleanly so any errors don't crash
    console.log('Step 2: Triggering OCR Text Extraction...');
    const extractedText = await OCRService.extractText(localFilePath);

    console.log('Step 3: Triggering Gemini AI Assessment Evaluation...');
    const evaluation = await GeminiService.evaluateAnswerSheet(extractedText, subject, topic);

    // Step 4: Update the AnswerSheet with evaluated scores
    answerSheet.extractedText = extractedText;
    answerSheet.evaluation = evaluation;
    answerSheet.status = 'completed';
    await answerSheet.save();

    // Step 5: Log quiz metrics in Progress history and update Profile skills
    const progress = await Progress.findOne({ studentId });
    const profile = await Profile.findOne({ studentId });

    let roadmapData: any = null;
    let recommendationsData: string[] = [];

    if (progress) {
      try {
        const accuracy = Math.round((evaluation.score / evaluation.totalMarks) * 100);

        progress.quizzesTaken.push({
          quizId: answerSheet._id || new mongoose.Types.ObjectId(),
          title: `Sheet: ${topic || 'Workbook'}`,
          score: evaluation.score,
          totalQuestions: evaluation.totalMarks,
          accuracy,
          date: new Date(),
        });
        
        // Update overall progress slightly (just as an example heuristic)
        progress.overallProgress = Math.min(100, Math.round(progress.overallProgress + (accuracy * 0.1)));
        progress.lastActiveDate = new Date();

        // Update weeklyHours: increment today's slot (Mon=0, Sun=6)
        const todayIdx = (new Date().getDay() + 6) % 7; // JS Sunday=0 → map to Mon=0
        if (!progress.weeklyHours || progress.weeklyHours.length < 7) {
          progress.weeklyHours = [0, 0, 0, 0, 0, 0, 0];
        }
        progress.weeklyHours[todayIdx] = Math.round((progress.weeklyHours[todayIdx] || 0) + 1);
        progress.markModified('weeklyHours');

        console.log('DEBUG: progress.quizzesTaken before save:', progress.quizzesTaken);
        
        // Clean up invalid quizzes that might exist from previous crashes
        progress.quizzesTaken = progress.quizzesTaken.filter((q: any) => q.title && q.accuracy !== undefined) as any;
        console.log('DEBUG: progress.quizzesTaken after cleanup:', progress.quizzesTaken);

        await progress.save();

        // Update skill scores in profile
        if (profile) {
          const scoresMap = profile.skillScores as any;
          const currentScore = scoresMap.get(topic) || 0;
          // Weighted average: old score * 0.6 + new score * 0.4
          const newScore = currentScore === 0 ? accuracy : Math.round((currentScore * 0.6) + (accuracy * 0.4));
          
          scoresMap.set(topic, newScore);
          
          // Generate new dynamic recommendations based on updated scores
          const plainScores = Object.fromEntries(scoresMap);
          recommendationsData = await GeminiService.generateRecommendations(plainScores);
          profile.aiRecommendations = recommendationsData;
          
          await profile.save();

          // Generate a dynamic learning path based on new profile state
          console.log('Step 6: Triggering Gemini Learning Path Generation...');
          roadmapData = await GeminiService.generateLearningPath(
            subject,
            {
              class: profile.class || 'Unknown',
              preferredLearningStyle: profile.preferredLearningStyle || 'visual',
              learningInterests: profile.learningInterests || [],
              learningGoals: profile.learningGoals || [],
            },
            plainScores
          );

          if (roadmapData && roadmapData.weeks) {
            // Check if one exists and update it, or create a new one
            let lp = await LearningPath.findOne({ studentId, subject });
            if (!lp) {
              lp = new LearningPath({ studentId, subject, active: true });
            }
            lp.weeks = roadmapData.weeks;
            await lp.save();
          }

        }

      } catch (err) {
        console.warn('Failed to update progress metrics:', err);
      }
    }

    res.json({
      success: true,
      message: 'File uploaded and graded successfully',
      answerSheet,
      learningPath: roadmapData,
      recommendations: recommendationsData,
    });
  } catch (error: any) {
    console.error('Answer sheet processing error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Retrieves list of uploaded sheets for the student
 */
export const getMyAnswerSheets = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const sheets = await AnswerSheet.find({ studentId }).sort({ createdAt: -1 });
    res.json({ success: true, sheets });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
