import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { OCRService } from '../services/ocrService';
import { GeminiService } from '../services/geminiService';
import { supabase } from '../config/supabaseClient';

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

const mapAnswerSheet = (s: any) => {
  if (!s) return null;
  return {
    _id: s.id,
    id: s.id,
    studentId: s.student_id,
    subject: s.subject,
    topic: s.topic,
    fileUrl: s.image_url,
    fileName: s.file_name,
    status: s.status,
    extractedText: s.ocr_text,
    evaluation: s.ai_feedback,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
};

/**
 * Handles uploading an answer sheet, running OCR extraction, calling Gemini AI grading, and creating logs.
 */
export const processAnswerSheet = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.id;
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
    let fileUrl = `/uploads/${req.file.filename}`;

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
    const { data: dbAnswerSheet, error: createError } = await supabase
      .from('answer_sheets')
      .insert({
        student_id: studentId,
        subject,
        topic: topic || 'General Practice',
        image_url: fileUrl,
        file_name: req.file.originalname,
        status: 'processing',
      })
      .select()
      .single();

    if (createError || !dbAnswerSheet) {
      res.status(400).json({ success: false, message: createError?.message || 'Failed to create answer sheet record.' });
      return;
    }

    console.log('Step 2: Triggering OCR Text Extraction...');
    const extractedText = await OCRService.extractText(localFilePath);

    console.log('Step 3: Triggering Gemini AI Assessment Evaluation...');
    const evaluation = await GeminiService.evaluateAnswerSheet(extractedText, subject, topic);

    // Step 4: Update the AnswerSheet with evaluated scores
    const { data: updatedSheet, error: updateError } = await supabase
      .from('answer_sheets')
      .update({
        ocr_text: extractedText,
        ai_feedback: evaluation,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', dbAnswerSheet.id)
      .select()
      .single();

    if (updateError || !updatedSheet) {
      res.status(500).json({ success: false, message: updateError?.message || 'Failed to update answer sheet evaluation.' });
      return;
    }

    // Step 5: Log quiz metrics in Progress history and update Profile skills
    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    let roadmapData: any = null;
    let recommendationsData: string[] = [];

    if (progress) {
      try {
        const accuracy = Math.round((evaluation.score / evaluation.totalMarks) * 100);
        const quizzesTaken = Array.isArray(progress.quizzes_taken) ? progress.quizzes_taken : [];

        quizzesTaken.push({
          quizId: updatedSheet.id,
          title: `Sheet: ${topic || 'Workbook'}`,
          score: evaluation.score,
          totalQuestions: evaluation.totalMarks,
          accuracy,
          date: new Date().toISOString(),
        });
        
        // Update overall progress slightly (just as an example heuristic)
        const currentOverall = progress.overall_progress || 0;
        const newOverallProgress = Math.min(100, Math.round(currentOverall + (accuracy * 0.1)));

        // Update weeklyHours: increment today's slot (Mon=0, Sun=6)
        const todayIdx = (new Date().getDay() + 6) % 7; // JS Sunday=0 → map to Mon=0
        const weeklyHours = Array.isArray(progress.weekly_hours) ? [...progress.weekly_hours] : [0, 0, 0, 0, 0, 0, 0];
        weeklyHours[todayIdx] = Math.round((weeklyHours[todayIdx] || 0) + 1);

        const cleanedQuizzes = quizzesTaken.filter((q: any) => q.title && q.accuracy !== undefined);

        await supabase
          .from('progress')
          .update({
            quizzes_taken: cleanedQuizzes,
            overall_progress: newOverallProgress,
            last_active_date: new Date().toISOString(),
            weekly_hours: weeklyHours,
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId);

        // Update skill scores in profile
        if (profile) {
          const scoresMap = profile.skill_scores ? { ...profile.skill_scores } : {};
          const currentScore = scoresMap[topic] || 0;
          // Weighted average: old score * 0.6 + new score * 0.4
          const newScore = currentScore === 0 ? accuracy : Math.round((currentScore * 0.6) + (accuracy * 0.4));
          
          scoresMap[topic] = newScore;
          
          // Generate new dynamic recommendations based on updated scores
          recommendationsData = await GeminiService.generateRecommendations(scoresMap);
          
          await supabase
            .from('profiles')
            .update({
              skill_scores: scoresMap,
              ai_recommendations: recommendationsData,
              updated_at: new Date().toISOString(),
            })
            .eq('student_id', studentId);

          // Generate a dynamic learning path based on new profile state
          console.log('Step 6: Triggering Gemini Learning Path Generation...');
          roadmapData = await GeminiService.generateLearningPath(
            subject,
            {
              class: profile.class || 'Unknown',
              preferredLearningStyle: profile.preferred_learning_style || 'visual',
              learningInterests: profile.learning_interests || [],
              learningGoals: profile.learning_goals || [],
            },
            scoresMap
          );

          if (roadmapData && roadmapData.weeks) {
            // Check if one exists and update it, or create a new one
            const { data: lp } = await supabase
              .from('learning_paths')
              .select('*')
              .eq('student_id', studentId)
              .eq('subject', subject)
              .maybeSingle();

            if (!lp) {
              await supabase
                .from('learning_paths')
                .insert({
                  student_id: studentId,
                  subject,
                  active: true,
                  weeks: roadmapData.weeks,
                });
            } else {
              await supabase
                .from('learning_paths')
                .update({
                  weeks: roadmapData.weeks,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', lp.id);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to update progress metrics:', err);
      }
    }

    res.json({
      success: true,
      message: 'File uploaded and graded successfully',
      answerSheet: mapAnswerSheet(updatedSheet),
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
    const studentId = req.user?.id;
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Unauthorized access' });
      return;
    }

    const { data: sheets, error } = await supabase
      .from('answer_sheets')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.json({ success: true, sheets: (sheets || []).map(mapAnswerSheet) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
