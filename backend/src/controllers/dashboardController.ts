import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import Profile from '../models/Profile';
import Progress from '../models/Progress';
import LearningPath from '../models/LearningPath';
import Notification from '../models/Notification';
import AnswerSheet from '../models/AnswerSheet';

/**
 * Gets dashboard data depending on User's Role.
 */
export const getDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    if (user.role === 'student') {
      await getStudentDashboard(req, res);
    } else if (user.role === 'teacher') {
      await getTeacherDashboard(req, res);
    } else if (user.role === 'parent') {
      await getParentDashboard(req, res);
    } else if (user.role === 'admin') {
      await getAdminDashboard(req, res);
    } else {
      res.status(400).json({ success: false, message: 'Invalid role dashboard request' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Compile Student Dashboard Metrics
 */
const getStudentDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const studentId = req.user?._id;

  const progress = await Progress.findOne({ studentId });
  const profile = await Profile.findOne({ studentId });
  const path = await LearningPath.findOne({ studentId, active: true });
  const notifications = await Notification.find({ userId: studentId, read: false })
    .sort({ createdAt: -1 })
    .limit(5);

  // Fetch pending worksheets count
  const pendingAnswerSheets = await AnswerSheet.countDocuments({ studentId, status: 'processing' });

  // Generate dynamic AI Recommendations based on weak areas
  const recommendations: string[] = [];
  let weakTopic = '';
  
  if (profile && profile.skillScores) {
    let lowestScore = 100;
    
    // skillScores is a Mongoose Map
    const scoresMap = profile.skillScores as any;
    
    scoresMap.forEach((score: number, topic: string) => {
      if (
        topic.startsWith('$') ||
        topic.startsWith('_') ||
        topic.includes('/') ||
        topic.includes('\\') ||
        topic.length > 60
      ) return;

      if (score < lowestScore) {
        lowestScore = score;
        weakTopic = topic;
      }
    });

    if (profile.aiRecommendations && profile.aiRecommendations.length > 0) {
      recommendations.push(...profile.aiRecommendations);
    } else {
      if (weakTopic && lowestScore < 70) {
        recommendations.push(
          `Based on your diagnostic score of ${lowestScore}% in "${weakTopic}", we recommend reading the "${weakTopic} Revision notes" in Week 1.`
        );
        recommendations.push(`Try answering the adaptation practice quiz on "${weakTopic}" to boost your understanding.`);
      } else {
        recommendations.push("You're performing great overall! Challenge yourself with a Hard difficulty quiz.");
        recommendations.push("Review your weekly schedule to stay on top of upcoming Calculus exercises.");
      }
    }
  } else {
    recommendations.push("Complete your Initial Diagnostic Skill Assessment to unlock personalized recommendations!");
  }

  // Get Today's Learning Plan (extract first active subtopics)
  const todayPlan: any[] = [];
  if (path && path.weeks) {
    const activeWeek = path.weeks.find((w) => w.status === 'active') || path.weeks[0];
    if (activeWeek) {
      activeWeek.subtopics.forEach((s) => {
        if (s.status === 'active' || s.status === 'locked') {
          todayPlan.push({
            subtopic: s.name,
            weekNumber: activeWeek.weekNumber,
            description: s.description,
            status: s.status,
            resourcesCount: s.resources.length,
          });
        }
      });
    }
  }

  res.json({
    success: true,
    role: 'student',
    metrics: {
      overallProgress: progress?.overallProgress || 0,
      streak: progress?.streak || 0,
      quizzesTakenCount: progress?.quizzesTaken?.length || 0,
      pendingWorksheets: pendingAnswerSheets,
      weeklyHours: progress?.weeklyHours || [0, 0, 0, 0, 0, 0, 0],
      skillScores: profile?.skillScores || {},
    },
    todayPlan: todayPlan.slice(0, 3),
    aiRecommendations: recommendations,
    notifications,
  });
};

/**
 * Compile Teacher Dashboard Metrics
 */
const getTeacherDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Get all students
  const students = await User.find({ role: 'student' }).select('name email phone');
  const studentIds = students.map((s) => s._id);

  // Compile averages from profiles
  const profiles = await Profile.find({ studentId: { $in: studentIds } });
  const progresses = await Progress.find({ studentId: { $in: studentIds } });

  // Compute stats
  let totalProgress = 0;
  let totalTime = 0;
  const topicScoresTotal: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};

  profiles.forEach((p) => {
    if (p.skillScores) {
      const scores = p.skillScores as Record<string, number>;
      Object.keys(scores).forEach((topic) => {
        topicScoresTotal[topic] = (topicScoresTotal[topic] || 0) + scores[topic];
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    }
  });

  progresses.forEach((pr) => {
    totalProgress += pr.overallProgress;
    totalTime += pr.timeSpentMinutes;
  });

  const classAverages: Record<string, number> = {};
  const weakTopics: string[] = [];
  
  Object.keys(topicScoresTotal).forEach((topic) => {
    const avg = Math.round(topicScoresTotal[topic] / topicCounts[topic]);
    classAverages[topic] = avg;
    if (avg < 65) {
      weakTopics.push(topic);
    }
  });

  const classAverageProgress = progresses.length > 0 ? Math.round(totalProgress / progresses.length) : 0;

  // Compile list of students at risk (progress < 40 or diagnostic score < 50)
  const atRiskStudents: any[] = [];
  progresses.forEach((pr) => {
    const sProfile = profiles.find((p) => p.studentId.toString() === pr.studentId.toString());
    const sUser = students.find((u) => u._id.toString() === pr.studentId.toString());
    
    let lowestScore = 100;
    if (sProfile && sProfile.skillScores) {
      const scores = sProfile.skillScores as Record<string, number>;
      Object.values(scores).forEach((sc) => {
        if (sc < lowestScore) lowestScore = sc;
      });
    }

    if (pr.overallProgress < 40 || lowestScore < 50) {
      atRiskStudents.push({
        name: sUser?.name || 'Unknown Student',
        email: sUser?.email || '',
        progress: pr.overallProgress,
        lowestScore: lowestScore === 100 ? 0 : lowestScore,
      });
    }
  });

  res.json({
    success: true,
    role: 'teacher',
    classSize: students.length,
    classAverageProgress,
    classAverages,
    weakTopics,
    atRiskStudents,
    studentsList: progresses.map((pr) => {
      const sUser = students.find((u) => u._id.toString() === pr.studentId.toString());
      return {
        _id: pr.studentId,
        name: sUser?.name || 'Unknown Student',
        email: sUser?.email,
        progress: pr.overallProgress,
        streak: pr.streak,
        quizzesTaken: pr.quizzesTaken.length,
      };
    }),
  });
};

/**
 * Compile Parent Dashboard Metrics
 */
const getParentDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parentEmail = req.user?.email;

  // Find linked children
  const children = await User.find({ parentEmail }).select('name email role');
  const childrenIds = children.map((c) => c._id);

  if (children.length === 0) {
    res.json({
      success: true,
      role: 'parent',
      message: 'No children accounts linked. Ask your child to add your email in their profile.',
      childrenMetrics: [],
    });
    return;
  }

  // Fetch children progress data
  const progresses = await Progress.find({ studentId: { $in: childrenIds } });
  const profiles = await Profile.find({ studentId: { $in: childrenIds } });

  const childrenMetrics = children.map((child) => {
    const pr = progresses.find((p) => p.studentId.toString() === child._id.toString());
    const prof = profiles.find((p) => p.studentId.toString() === child._id.toString());

    return {
      studentId: child._id,
      name: child.name,
      email: child.email,
      progress: pr?.overallProgress || 0,
      streak: pr?.streak || 0,
      studyMinutes: pr?.timeSpentMinutes || 0,
      skillScores: prof?.skillScores || {},
      recentQuizzes: pr?.quizzesTaken.slice(-3) || [],
    };
  });

  res.json({
    success: true,
    role: 'parent',
    childrenMetrics,
  });
};

/**
 * Compile Admin Dashboard Metrics
 */
const getAdminDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const usersCount = await User.countDocuments();
  const studentCount = await User.countDocuments({ role: 'student' });
  const teacherCount = await User.countDocuments({ role: 'teacher' });
  const parentCount = await User.countDocuments({ role: 'parent' });

  const pathsCount = await LearningPath.countDocuments();
  const sheetsCount = await AnswerSheet.countDocuments();
  const sheetsProcessing = await AnswerSheet.countDocuments({ status: 'processing' });

  res.json({
    success: true,
    role: 'admin',
    metrics: {
      totalUsers: usersCount,
      students: studentCount,
      teachers: teacherCount,
      parents: parentCount,
      totalPaths: pathsCount,
      totalAnswerSheetsUploaded: sheetsCount,
      answerSheetsProcessing: sheetsProcessing,
    },
    systemStatus: 'Optimal',
  });
};
