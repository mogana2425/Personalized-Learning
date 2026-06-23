import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { supabase } from '../config/supabaseClient';

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

const getStudentDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const studentId = req.user?.id;
  if (!studentId) {
    res.status(400).json({ success: false, message: 'Student ID missing' });
    return;
  }

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

  const { data: path } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('student_id', studentId)
    .eq('active', true)
    .maybeSingle();

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', studentId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5);

  const { count: pendingAnswerSheets } = await supabase
    .from('answer_sheets')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('status', 'processing');

  const recommendations: string[] = [];
  let weakTopic = '';
  
  if (profile && profile.skill_scores) {
    let lowestScore = 100;
    const scores = profile.skill_scores as Record<string, number>;
    
    Object.entries(scores).forEach(([topic, score]) => {
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

    if (profile.ai_recommendations && profile.ai_recommendations.length > 0) {
      recommendations.push(...profile.ai_recommendations);
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

  const todayPlan: any[] = [];
  if (path && Array.isArray(path.weeks)) {
    const activeWeek = path.weeks.find((w: any) => w.status === 'active') || path.weeks[0];
    if (activeWeek && Array.isArray(activeWeek.subtopics)) {
      activeWeek.subtopics.forEach((s: any) => {
        if (s.status === 'active' || s.status === 'locked') {
          todayPlan.push({
            subtopic: s.name,
            weekNumber: activeWeek.weekNumber,
            description: s.description,
            status: s.status,
            resourcesCount: Array.isArray(s.resources) ? s.resources.length : 0,
          });
        }
      });
    }
  }

  res.json({
    success: true,
    role: 'student',
    metrics: {
      overallProgress: progress?.overall_progress || 0,
      streak: progress?.streak || 0,
      quizzesTakenCount: Array.isArray(progress?.quizzes_taken) ? progress.quizzes_taken.length : 0,
      pendingWorksheets: pendingAnswerSheets || 0,
      weeklyHours: progress?.weekly_hours || [0, 0, 0, 0, 0, 0, 0],
      skillScores: profile?.skill_scores || {},
    },
    todayPlan: todayPlan.slice(0, 3),
    aiRecommendations: recommendations,
    notifications: (notifications || []).map(n => ({
      _id: n.id,
      id: n.id,
      userId: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.created_at
    })),
  });
};

const getTeacherDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { data: students, error: studentsError } = await supabase
    .from('users')
    .select('id, name, email, phone')
    .eq('role', 'student');

  if (studentsError || !students) {
    res.status(500).json({ success: false, message: studentsError?.message || 'Failed to fetch students' });
    return;
  }

  const studentIds = students.map((s) => s.id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('student_id', studentIds);

  const { data: progresses } = await supabase
    .from('progress')
    .select('*')
    .in('student_id', studentIds);

  const dbProfiles = profiles || [];
  const dbProgresses = progresses || [];

  let totalProgress = 0;
  let totalTime = 0;
  const topicScoresTotal: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};

  dbProfiles.forEach((p) => {
    if (p.skill_scores) {
      const scores = p.skill_scores as Record<string, number>;
      Object.keys(scores).forEach((topic) => {
        topicScoresTotal[topic] = (topicScoresTotal[topic] || 0) + scores[topic];
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    }
  });

  dbProgresses.forEach((pr) => {
    totalProgress += pr.overall_progress || 0;
    totalTime += pr.time_spent_minutes || 0;
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

  const classAverageProgress = dbProgresses.length > 0 ? Math.round(totalProgress / dbProgresses.length) : 0;

  const atRiskStudents: any[] = [];
  dbProgresses.forEach((pr) => {
    const sProfile = dbProfiles.find((p) => p.student_id === pr.student_id);
    const sUser = students.find((u) => u.id === pr.student_id);
    
    let lowestScore = 100;
    if (sProfile && sProfile.skill_scores) {
      const scores = sProfile.skill_scores as Record<string, number>;
      Object.values(scores).forEach((sc) => {
        if (sc < lowestScore) lowestScore = sc;
      });
    }

    if ((pr.overall_progress || 0) < 40 || lowestScore < 50) {
      atRiskStudents.push({
        name: sUser?.name || 'Unknown Student',
        email: sUser?.email || '',
        progress: pr.overall_progress || 0,
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
    studentsList: dbProgresses.map((pr) => {
      const sUser = students.find((u) => u.id === pr.student_id);
      return {
        _id: pr.student_id,
        id: pr.student_id,
        name: sUser?.name || 'Unknown Student',
        email: sUser?.email,
        progress: pr.overall_progress || 0,
        streak: pr.streak || 0,
        quizzesTaken: Array.isArray(pr.quizzes_taken) ? pr.quizzes_taken.length : 0,
      };
    }),
  });
};

const getParentDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parentEmail = req.user?.email;
  if (!parentEmail) {
    res.status(400).json({ success: false, message: 'Parent email missing' });
    return;
  }

  const { data: children, error } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('parent_email', parentEmail);

  if (error || !children) {
    res.status(500).json({ success: false, message: error?.message || 'Failed to fetch linked children' });
    return;
  }

  if (children.length === 0) {
    res.json({
      success: true,
      role: 'parent',
      message: 'No children accounts linked. Ask your child to add your email in their profile.',
      childrenMetrics: [],
    });
    return;
  }

  const childrenIds = children.map((c) => c.id);

  const { data: progresses } = await supabase
    .from('progress')
    .select('*')
    .in('student_id', childrenIds);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('student_id', childrenIds);

  const dbProgresses = progresses || [];
  const dbProfiles = profiles || [];

  const childrenMetrics = children.map((child) => {
    const pr = dbProgresses.find((p) => p.student_id === child.id);
    const prof = dbProfiles.find((p) => p.student_id === child.id);

    return {
      studentId: child.id,
      name: child.name,
      email: child.email,
      progress: pr?.overall_progress || 0,
      streak: pr?.streak || 0,
      studyMinutes: pr?.time_spent_minutes || 0,
      skillScores: prof?.skill_scores || {},
      recentQuizzes: Array.isArray(pr?.quizzes_taken) ? pr.quizzes_taken.slice(-3) : [],
    };
  });

  res.json({
    success: true,
    role: 'parent',
    childrenMetrics,
  });
};

const getAdminDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { count: usersCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: studentCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  const { count: teacherCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'teacher');

  const { count: parentCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'parent');

  const { count: pathsCount } = await supabase
    .from('learning_paths')
    .select('*', { count: 'exact', head: true });

  const { count: sheetsCount } = await supabase
    .from('answer_sheets')
    .select('*', { count: 'exact', head: true });

  const { count: sheetsProcessing } = await supabase
    .from('answer_sheets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processing');

  res.json({
    success: true,
    role: 'admin',
    metrics: {
      totalUsers: usersCount || 0,
      students: studentCount || 0,
      teachers: teacherCount || 0,
      parents: parentCount || 0,
      totalPaths: pathsCount || 0,
      totalAnswerSheetsUploaded: sheetsCount || 0,
      answerSheetsProcessing: sheetsProcessing || 0,
    },
    systemStatus: 'Optimal',
  });
};
