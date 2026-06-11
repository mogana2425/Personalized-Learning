import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import Quiz, { IQuiz } from '../models/Quiz';
import Profile from '../models/Profile';
import Progress from '../models/Progress';
import Notification from '../models/Notification';
import { GeminiService } from '../services/geminiService';

/**
 * Returns a static initial assessment test if none is in the DB.
 */
export const getAssessment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject } = req.query;
    
    // Find if assessment quiz already exists in database
    let quiz = await Quiz.findOne({ isInitialAssessment: true, subject: subject as string });
    
    if (!quiz) {
      // Create a default initial diagnostic test for Calculus, Algebra, and Geometry
      quiz = await Quiz.create({
        title: 'Initial Diagnostic Skill Assessment',
        description: 'An adaptive test to gauge your skills in Algebra, Geometry, and Calculus.',
        subject: (subject as string) || 'Mathematics',
        difficultyLevel: 'medium',
        isInitialAssessment: true,
        timeLimitMinutes: 15,
        questions: [
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
        ],
      });
    }

    res.json({ success: true, quiz });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Evaluates the diagnostic assessment, generates subject scores, and updates Profile
 */
export const submitAssessment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const { quizId, answers } = req.body; // answers: Record<questionIndex, selectedOptionIndex>

    if (!studentId || !quizId) {
      res.status(400).json({ success: false, message: 'Missing assessment parameters' });
      return;
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Assessment quiz not found' });
      return;
    }

    // Evaluate correct responses by topic
    const topicTotals: Record<string, number> = {};
    const topicCorrect: Record<string, number> = {};
    let grandCorrect = 0;

    quiz.questions.forEach((q, idx) => {
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
    let profile = await Profile.findOne({ studentId });
    if (profile) {
      profile.skillScores = { ...profile.skillScores, ...skillScores };
      await profile.save();
    } else {
      profile = await Profile.create({
        studentId,
        class: 'Grade 10',
        subjects: [quiz.subject],
        preferredLearningStyle: 'visual',
        skillScores,
      });
    }

    // Update Progress
    const accuracy = Math.round((grandCorrect / quiz.questions.length) * 100);
    const progress = await Progress.findOne({ studentId });
    if (progress) {
      progress.quizzesTaken.push({
        quizId: quiz._id as any,
        title: quiz.title,
        score: grandCorrect,
        totalQuestions: quiz.questions.length,
        accuracy,
        date: new Date(),
      });
      progress.lastActiveDate = new Date();
      await progress.save();
    }

    // Send notifications
    await Notification.create({
      userId: studentId,
      title: 'Assessment Evaluated!',
      message: `Diagnostic complete. Scores - Algebra: ${skillScores['Algebra'] || 0}%, Calculus: ${skillScores['Calculus'] || 0}%`,
      type: 'quiz',
    });

    res.json({
      success: true,
      message: 'Assessment submitted and scores saved successfully',
      skillScores,
      grandScore: grandCorrect,
      totalQuestions: quiz.questions.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuizById = async (req: Request, res: Response): Promise<void> => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }
    res.json({ success: true, quiz });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Handles regular subtopic practice quiz submission and scales difficulty
 */
export const submitQuiz = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    const { quizId, answers } = req.body;

    if (!studentId || !quizId) {
      res.status(400).json({ success: false, message: 'Missing parameters' });
      return;
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      res.status(404).json({ success: false, message: 'Quiz not found' });
      return;
    }

    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] !== undefined && Number(answers[idx]) === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);

    // Save quiz logs to progress
    const progress = await Progress.findOne({ studentId });
    if (progress) {
      progress.quizzesTaken.push({
        quizId: quiz._id as any,
        title: quiz.title,
        score: correctCount,
        totalQuestions: quiz.questions.length,
        accuracy: scorePercentage,
        date: new Date(),
      });

      // Update learning streak
      const today = new Date().toDateString();
      const lastActive = progress.lastActiveDate ? progress.lastActiveDate.toDateString() : '';
      if (lastActive !== today) {
        progress.streak += 1;
      }
      progress.lastActiveDate = new Date();
      await progress.save();
    }

    // Determine adapted difficulty level for the next quiz
    const nextDifficulty = GeminiService.adaptDifficulty(scorePercentage, quiz.difficultyLevel);

    res.json({
      success: true,
      score: correctCount,
      totalQuestions: quiz.questions.length,
      accuracy: scorePercentage,
      nextDifficulty,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Creates custom quizzes for Teachers
 */
export const createQuiz = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, subject, topic, difficultyLevel, questions, timeLimitMinutes } = req.body;

    const quiz = await Quiz.create({
      title,
      description,
      subject,
      topic,
      difficultyLevel: difficultyLevel || 'medium',
      questions,
      timeLimitMinutes: timeLimitMinutes || 15,
      creatorId: req.user?._id,
    });

    res.status(201).json({ success: true, message: 'Quiz created successfully', quiz });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
