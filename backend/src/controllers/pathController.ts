import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { supabase } from '../config/supabaseClient';
import { GeminiService } from '../services/geminiService';

const mapLearningPath = (lp: any) => ({
  _id: lp.id,
  id: lp.id,
  studentId: lp.student_id,
  subject: lp.subject,
  currentWeek: lp.current_week,
  active: lp.active,
  weeks: lp.weeks,
  createdAt: lp.created_at,
  updatedAt: lp.updated_at,
});

export const getPath = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.id;
    const { subject } = req.query;

    if (!studentId || !subject) {
      res.status(400).json({ success: false, message: 'Student ID and subject are required' });
      return;
    }

    const { data: dbPath, error } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('student_id', studentId)
      .eq('subject', subject as string)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    let learningPath = dbPath;

    if (!learningPath) {
      // Automatically generate a new learning path
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      const currentScores = profile ? (profile.skill_scores as Record<string, number>) : {};
      
      const pathData = await GeminiService.generateLearningPath(
        subject as string,
        {
          class: profile?.class || 'Grade 10',
          preferredLearningStyle: profile?.preferred_learning_style || 'visual',
          learningInterests: profile?.learning_interests || [],
          learningGoals: profile?.learning_goals || [],
        },
        currentScores
      );

      const { data: newPath, error: createError } = await supabase
        .from('learning_paths')
        .insert({
          student_id: studentId,
          subject: subject as string,
          weeks: pathData.weeks,
          current_week: 1,
          active: true,
        })
        .select()
        .single();

      if (createError || !newPath) {
        res.status(400).json({ success: false, message: createError?.message || 'Failed to create learning path' });
        return;
      }
      learningPath = newPath;
    }

    res.json({ success: true, learningPath: mapLearningPath(learningPath) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generatePath = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.id;
    const { subject } = req.body;

    if (!studentId || !subject) {
      res.status(400).json({ success: false, message: 'Student ID and subject are required' });
      return;
    }

    // Deactivate previous active paths for this subject
    await supabase
      .from('learning_paths')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('student_id', studentId)
      .eq('subject', subject)
      .eq('active', true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    const currentScores = profile ? (profile.skill_scores as Record<string, number>) : {};

    const pathData = await GeminiService.generateLearningPath(
      subject,
      {
        class: profile?.class || 'Grade 10',
        preferredLearningStyle: profile?.preferred_learning_style || 'visual',
        learningInterests: profile?.learning_interests || [],
        learningGoals: profile?.learning_goals || [],
      },
      currentScores
    );

    const { data: learningPath, error: createError } = await supabase
      .from('learning_paths')
      .insert({
        student_id: studentId,
        subject,
        weeks: pathData.weeks,
        current_week: 1,
        active: true,
      })
      .select()
      .single();

    if (createError || !learningPath) {
      res.status(400).json({ success: false, message: createError?.message || 'Failed to generate learning path' });
      return;
    }

    res.status(201).json({ success: true, message: 'New learning path generated', learningPath: mapLearningPath(learningPath) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubTopicStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.id;
    const { pathId, weekNumber, subtopicName, status } = req.body;

    if (!studentId || !pathId || !weekNumber || !subtopicName || !status) {
      res.status(400).json({ success: false, message: 'Missing parameters' });
      return;
    }

    const { data: learningPath, error } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('id', pathId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error || !learningPath) {
      res.status(404).json({ success: false, message: 'Learning path not found' });
      return;
    }

    // Find subtopic and update linearly to handle unlocking the next topic
    let updated = false;
    let totalSubtopics = 0;
    let completedSubtopics = 0;
    let unlockNext = false;

    const weeks = learningPath.weeks as any[];

    for (let wIndex = 0; wIndex < weeks.length; wIndex++) {
      const w = weeks[wIndex];
      
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
      const allDone = w.subtopics.every((s: any) => s.status === 'completed');
      if (allDone) {
        w.status = 'completed';
      } else if (w.subtopics.some((s: any) => s.status === 'active' || s.status === 'completed')) {
        w.status = 'active';
      }
    }

    if (!updated) {
      res.status(404).json({ success: false, message: 'Subtopic not found' });
      return;
    }

    // Save path
    const { data: updatedPath, error: updateError } = await supabase
      .from('learning_paths')
      .update({ weeks, updated_at: new Date().toISOString() })
      .eq('id', pathId)
      .select()
      .single();

    if (updateError || !updatedPath) {
      res.status(500).json({ success: false, message: updateError?.message || 'Error updating learning path weeks' });
      return;
    }

    // Calculate progress percentage
    const progressPercent = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;

    // Update overall Progress document
    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (progress) {
      await supabase
        .from('progress')
        .update({
          overall_progress: progressPercent,
          completed_topics_count: completedSubtopics,
          time_spent_minutes: (progress.time_spent_minutes || 0) + 15,
          updated_at: new Date().toISOString(),
        })
        .eq('student_id', studentId);
    }

    res.json({
      success: true,
      message: 'Subtopic progress updated successfully',
      learningPath: mapLearningPath(updatedPath),
      progressPercent,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateLessonContent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.id;
    const { topic, subject, type } = req.body;

    if (!topic || !subject || !type) {
      res.status(400).json({ success: false, message: 'Topic, subject, and type are required' });
      return;
    }

    // Determine adaptive difficulty from Profile skill scores
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    let score = 50;
    if (profile && profile.skill_scores) {
      const scoresMap = profile.skill_scores as Record<string, number>;
      score = scoresMap[topic] || scoresMap[subject] || 50;
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
