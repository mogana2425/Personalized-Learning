import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import LearningPath from '../models/LearningPath';
import Profile from '../models/Profile';
import Progress from '../models/Progress';
import { GeminiService } from '../services/geminiService';

export const getPath = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const { subject } = req.query;

    if (!studentId || !subject) {
      res.status(400).json({ success: false, message: 'Student ID and subject are required' });
      return;
    }

    let learningPath = await LearningPath.findOne({ studentId, subject: subject as string, active: true });

    if (!learningPath) {
      // Automatically generate a new learning path
      const profile = await Profile.findOne({ studentId });
      const currentScores = profile ? (profile.skillScores as Record<string, number>) : {};
      
      const pathData = await GeminiService.generateLearningPath(
        subject as string,
        {
          class: profile?.class || 'Grade 10',
          preferredLearningStyle: profile?.preferredLearningStyle || 'visual',
          learningInterests: profile?.learningInterests || [],
          learningGoals: profile?.learningGoals || [],
        },
        currentScores
      );

      learningPath = await LearningPath.create({
        studentId,
        subject: subject as string,
        weeks: pathData.weeks,
        currentWeek: 1,
        active: true,
      });
    }

    res.json({ success: true, learningPath });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generatePath = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const { subject } = req.body;

    if (!studentId || !subject) {
      res.status(400).json({ success: false, message: 'Student ID and subject are required' });
      return;
    }

    // Deactivate previous active paths for this subject
    await LearningPath.updateMany({ studentId, subject, active: true }, { active: false });

    const profile = await Profile.findOne({ studentId });
    const currentScores = profile ? (profile.skillScores as Record<string, number>) : {};

    const pathData = await GeminiService.generateLearningPath(
      subject,
      {
        class: profile?.class || 'Grade 10',
        preferredLearningStyle: profile?.preferredLearningStyle || 'visual',
        learningInterests: profile?.learningInterests || [],
        learningGoals: profile?.learningGoals || [],
      },
      currentScores
    );

    const learningPath = await LearningPath.create({
      studentId,
      subject,
      weeks: pathData.weeks,
      currentWeek: 1,
      active: true,
    });

    res.status(201).json({ success: true, message: 'New learning path generated', learningPath });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubTopicStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const { pathId, weekNumber, subtopicName, status } = req.body;

    if (!studentId || !pathId || !weekNumber || !subtopicName || !status) {
      res.status(400).json({ success: false, message: 'Missing parameters' });
      return;
    }

    const learningPath = await LearningPath.findOne({ _id: pathId, studentId });
    if (!learningPath) {
      res.status(404).json({ success: false, message: 'Learning path not found' });
      return;
    }

    // Find subtopic and update linearly to handle unlocking the next topic
    let updated = false;
    let totalSubtopics = 0;
    let completedSubtopics = 0;
    let unlockNext = false;

    for (let wIndex = 0; wIndex < learningPath.weeks.length; wIndex++) {
      const w = learningPath.weeks[wIndex];
      
      for (let sIndex = 0; sIndex < w.subtopics.length; sIndex++) {
        const s = w.subtopics[sIndex];
        totalSubtopics++;

        // If the previous subtopic was just completed, unlock this one
        if (unlockNext && s.status === 'locked') {
          s.status = 'active';
          unlockNext = false;
        }

        if (w.weekNumber === Number(weekNumber) && s.name === subtopicName) {
          s.status = status;
          updated = true;
          if (status === 'completed') {
            unlockNext = true;
          }
        }

        if (s.status === 'completed') {
          completedSubtopics++;
        }
      }

      // Update week status based on subtopics
      const allDone = w.subtopics.every((s) => s.status === 'completed');
      if (allDone) {
        w.status = 'completed';
      } else if (w.subtopics.some((s) => s.status === 'active' || s.status === 'completed')) {
        w.status = 'active';
      }
    }

    if (!updated) {
      res.status(404).json({ success: false, message: 'Subtopic not found' });
      return;
    }

    // Explicitly mark 'weeks' array as modified to ensure Mongoose saves the nested status changes
    learningPath.markModified('weeks');
    // Save path
    await learningPath.save();

    // Calculate progress percentage
    const progressPercent = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;

    // Update overall Progress document
    const progress = await Progress.findOne({ studentId });
    if (progress) {
      progress.overallProgress = progressPercent;
      progress.completedTopicsCount = completedSubtopics;
      // Add mock study time increment
      progress.timeSpentMinutes += 15; 
      await progress.save();
    }

    res.json({
      success: true,
      message: 'Subtopic progress updated successfully',
      learningPath,
      progressPercent,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateLessonContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const { topic, subject, type } = req.body;

    if (!topic || !subject || !type) {
      res.status(400).json({ success: false, message: 'Topic, subject, and type are required' });
      return;
    }

    // Determine adaptive difficulty from Profile skill scores
    const profile = await Profile.findOne({ studentId });
    let score = 50;
    if (profile && profile.skillScores) {
      const scoresMap = profile.skillScores as any;
      score = scoresMap.get(topic) || scoresMap.get(subject) || 50;
    }
    const difficulty = score >= 80 ? 'Advanced' : score >= 60 ? 'Intermediate' : 'Beginner';

    let data;
    if (type === 'notes') {
      data = await GeminiService.generateLessonNotes(topic, subject, difficulty);
    } else if (type === 'flashcards') {
      data = await GeminiService.generateFlashcards(topic, subject, difficulty);
    } else if (type === 'quiz') {
      data = await GeminiService.generateQuiz(topic, subject, difficulty);
    } else if (type === 'comprehensive') {
      data = await GeminiService.generateComprehensiveLesson(topic, subject, difficulty);
    } else {
      res.status(400).json({ success: false, message: 'Invalid generation type' });
      return;
    }

    res.json({ success: true, data, difficulty });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
