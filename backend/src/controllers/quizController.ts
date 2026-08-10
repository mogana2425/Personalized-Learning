import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { supabase } from '../config/supabaseClient';
import { OllamaService as GeminiService } from '../services/ollamaService';

const mapQuiz = (q: any) => {
  if (!q) return null;
  return {
    _id: q.id,
    id: q.id,
    title: q.title,
    description: q.description,
    subject: q.subject,
    topic: q.topic,
    difficultyLevel: q.difficulty_level,
    isInitialAssessment: q.is_initial_assessment,
    timeLimitMinutes: q.time_limit_minutes,
    questions: q.questions,
    creatorId: q.creator_id,
    createdAt: q.created_at,
  };
};

export const getAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject } = req.query;
    
    // Find if assessment quiz already exists in database
    let { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('is_initial_assessment', true)
      .eq('subject', (subject as string) || 'Mathematics')
      .maybeSingle();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }
    
    if (!quiz) {
      // Create a default initial diagnostic test
      const questions = [
        {
          questionText: 'Solve for x: 2(x + 3) = 18',
          options: ['6', '8', '9', '4'],
          correctAnswerIndex: 0,
          explanation: 'Divide both sides by 2 to get x + 3 = 9. Then subtract 3 to get x = 6.',
          topic: 'Algebra',
          difficulty: 'easy',
        },
        {
          questionText: 'Which equation represents a straight line with slope 3 passing through point (0, 2)?',
          options: ['y = 3x + 2', 'y = 2x + 3', 'y = 3x - 2', 'y = -3x + 2'],
          correctAnswerIndex: 0,
          explanation: 'The slope-intercept form is y = mx + c. Slope m = 3, y-intercept c = 2. So y = 3x + 2.',
          topic: 'Algebra',
          difficulty: 'easy',
        },
        {
          questionText: 'Find the area of a circle with a radius of 7 cm (Take pi ≈ 22/7).',
          options: ['154 sq. cm', '44 sq. cm', '14 sq. cm', '98 sq. cm'],
          correctAnswerIndex: 0,
          explanation: 'Area = pi * r^2 = (22/7) * 7 * 7 = 154.',
          topic: 'Geometry',
          difficulty: 'medium',
        },
        {
          questionText: 'In a right-angled triangle, if base = 3 cm and height = 4 cm, what is the hypotenuse?',
          options: ['5 cm', '7 cm', '6 cm', '8 cm'],
          correctAnswerIndex: 0,
          explanation: 'By Pythagoras theorem: Hypotenuse^2 = base^2 + height^2 = 3^2 + 4^2 = 25. Hypotenuse = 5.',
          topic: 'Geometry',
          difficulty: 'easy',
        },
        {
          questionText: 'What is the derivative of f(x) = x^3 - 5x + 4?',
          options: ['3x^2 - 5', '3x^2 - 5x', 'x^2 - 5', '3x^3 - 5'],
          correctAnswerIndex: 0,
          explanation: 'Using power rule: d/dx(x^3) = 3x^2, d/dx(-5x) = -5, d/dx(4) = 0. Answer is 3x^2 - 5.',
          topic: 'Calculus',
          difficulty: 'hard',
        },
        {
          questionText: 'Evaluate the limit: lim(x -> 2) of (x^2 - 4)/(x - 2)',
          options: ['4', '2', '0', 'undefined'],
          correctAnswerIndex: 0,
          explanation: 'Factor x^2 - 4 to (x-2)(x+2). Divide by (x-2) to get x+2. Plug in x=2 => 2+2 = 4.',
          topic: 'Calculus',
          difficulty: 'hard',
        },
      ];

      const { data: newQuiz, error: createError } = await supabase
        .from('quizzes')
        .insert({
          title: 'Initial Diagnostic Skill Assessment',
          description: 'An adaptive test to gauge your skills in Algebra, Geometry, and Calculus.',
          subject: (subject as string) || 'Mathematics',
          difficulty_level: 'medium',
          is_initial_assessment: true,
          time_limit_minutes: 15,
          questions,
        })
        .select()
        .single();

      if (createError || !newQuiz) {
        res.status(400).json({ success: false, message: createError?.message || 'Failed to create assessment quiz' });
        return;
      }
      quiz = newQuiz;
    }

    res.json({ success: true, quiz: mapQuiz(quiz) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitAssessment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.id;
    const { quizId, answers } = req.body;

    if (!studentId || !quizId) {
      res.status(400).json({ success: false, message: 'Missing assessment parameters' });
      return;
    }

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .maybeSingle();

    if (error || !quiz) {
      res.status(404).json({ success: false, message: 'Assessment quiz not found' });
      return;
    }

    const quizQuestions = quiz.questions as any[];

    // Evaluate correct responses by topic
    const topicTotals: Record<string, number> = {};
    const topicCorrect: Record<string, number> = {};
    let grandCorrect = 0;

    quizQuestions.forEach((q, idx) => {
      const topic = q.topic;
      if (!topicTotals[topic]) {
        topicTotals[topic] = 0;
        topicCorrect[topic] = 0;
      }
      topicTotals[topic]++;

      const studentAns = answers[idx];
      if (studentAns !== undefined && Number(studentAns) === q.correctAnswerIndex) {
        topicCorrect[topic]++;
        grandCorrect++;
      }
    });

    // Compute scores percentages per topic
    const skillScores: Record<string, number> = {};
    Object.keys(topicTotals).forEach((topic) => {
      skillScores[topic] = Math.round((topicCorrect[topic] / topicTotals[topic]) * 100);
    });

    // Update Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (profile) {
      const mergedScores = { ...profile.skill_scores, ...skillScores };
      await supabase
        .from('profiles')
        .update({ skill_scores: mergedScores, updated_at: new Date().toISOString() })
        .eq('student_id', studentId);
    } else {
      await supabase
        .from('profiles')
        .insert({
          student_id: studentId,
          class: 'Grade 10',
          subjects: [quiz.subject],
          preferred_learning_style: 'visual',
          skill_scores: skillScores,
        });
    }

    // Update Progress
    const accuracy = Math.round((grandCorrect / quizQuestions.length) * 100);
    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (progress) {
      const quizzesTaken = Array.isArray(progress.quizzes_taken) ? progress.quizzes_taken : [];
      quizzesTaken.push({
        quizId: quiz.id,
        title: quiz.title,
        score: grandCorrect,
        totalQuestions: quizQuestions.length,
        accuracy,
        date: new Date().toISOString(),
      });

      await supabase
        .from('progress')
        .update({
          quizzes_taken: quizzesTaken,
          last_active_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('student_id', studentId);
    }

    // Send notifications
    await supabase.from('notifications').insert({
      user_id: studentId,
      title: 'Assessment Evaluated!',
      message: `Diagnostic complete. Scores - Algebra: ${skillScores['Algebra'] || 0}%, Calculus: ${skillScores['Calculus'] || 0}%`,
      type: 'quiz',
    });

    res.json({
      success: true,
      message: 'Assessment submitted and scores saved successfully',
      skillScores,
      grandScore: grandCorrect,
      totalQuestions: quizQuestions.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuizById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }
    res.json({ success: true, quiz: mapQuiz(quiz) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitQuiz = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.id;
    const { quizId, answers } = req.body;

    if (!studentId || !quizId) {
      res.status(400).json({ success: false, message: 'Missing parameters' });
      return;
    }

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .maybeSingle();

    if (error || !quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    const quizQuestions = quiz.questions as any[];

    let correctCount = 0;
    quizQuestions.forEach((q, idx) => {
      if (answers[idx] !== undefined && Number(answers[idx]) === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / quizQuestions.length) * 100);

    // Save quiz logs to progress
    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (progress) {
      const quizzesTaken = Array.isArray(progress.quizzes_taken) ? progress.quizzes_taken : [];
      quizzesTaken.push({
        quizId: quiz.id,
        title: quiz.title,
        score: correctCount,
        totalQuestions: quizQuestions.length,
        accuracy: scorePercentage,
        date: new Date().toISOString(),
      });

      // Update learning streak
      let newStreak = progress.streak || 0;
      const today = new Date().toDateString();
      const lastActive = progress.last_active_date ? new Date(progress.last_active_date).toDateString() : '';
      if (lastActive !== today) {
        newStreak += 1;
      }

      await supabase
        .from('progress')
        .update({
          quizzes_taken: quizzesTaken,
          streak: newStreak,
          last_active_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('student_id', studentId);
    }

    // Determine adapted difficulty level for the next quiz
    const nextDifficulty = GeminiService.adaptDifficulty(scorePercentage, quiz.difficulty_level || 'medium');

    res.json({
      success: true,
      score: correctCount,
      totalQuestions: quizQuestions.length,
      accuracy: scorePercentage,
      nextDifficulty,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createQuiz = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, subject, topic, difficultyLevel, questions, timeLimitMinutes } = req.body;

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        title,
        description,
        subject,
        topic,
        difficulty_level: difficultyLevel || 'medium',
        questions,
        time_limit_minutes: timeLimitMinutes || 15,
        creator_id: req.user?.id,
      })
      .select()
      .single();

    if (error || !quiz) {
      res.status(400).json({ success: false, message: error?.message || 'Failed to create quiz' });
      return;
    }

    res.status(201).json({ success: true, message: 'Quiz created successfully', quiz: mapQuiz(quiz) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
