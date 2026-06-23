import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { supabase } from '../config/supabaseClient';
import { ReportService } from '../services/reportService';

export const downloadPDFReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { studentId } = req.query;
    let targetStudentId = requester.id;

    // Teachers/Parents can query a specific child/student
    if (studentId && (requester.role === 'teacher' || requester.role === 'parent' || requester.role === 'admin')) {
      targetStudentId = studentId as string;
    }

    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetStudentId)
      .maybeSingle();

    if (studentError || !student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', targetStudentId)
      .maybeSingle();

    const { data: learningPath } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('student_id', targetStudentId)
      .eq('active', true)
      .maybeSingle();

    // Map database snake_case properties to camelCase for ReportService
    const mappedStudent: any = {
      _id: student.id,
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
    };

    const mappedProgress: any = progress ? {
      _id: progress.id,
      id: progress.id,
      studentId: progress.student_id,
      overallProgress: progress.overall_progress || 0,
      streak: progress.streak || 0,
      timeSpentMinutes: progress.time_spent_minutes || 0,
      completedTopicsCount: progress.completed_topics_count || 0,
      quizzesTaken: (progress.quizzes_taken || []).map((q: any) => ({
        quizId: q.quizId,
        title: q.title,
        score: q.score,
        totalQuestions: q.totalQuestions,
        accuracy: q.accuracy,
        date: q.date,
      })),
    } : null;

    const mappedLearningPath: any = learningPath ? {
      _id: learningPath.id,
      id: learningPath.id,
      studentId: learningPath.student_id,
      subject: learningPath.subject,
      currentWeek: learningPath.current_week,
      active: learningPath.active,
      weeks: learningPath.weeks,
    } : null;

    const pdfBuffer = await ReportService.generateStudentPDFReport(mappedStudent, mappedProgress, mappedLearningPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=PLIS_Report_${student.name.replace(/\s+/g, '_')}.pdf`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const downloadExcelReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { studentId } = req.query;
    let targetStudentId = requester.id;

    if (studentId && (requester.role === 'teacher' || requester.role === 'parent' || requester.role === 'admin')) {
      targetStudentId = studentId as string;
    }

    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetStudentId)
      .maybeSingle();

    if (studentError || !student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const { data: progress } = await supabase
      .from('progress')
      .select('*')
      .eq('student_id', targetStudentId)
      .maybeSingle();

    const { data: learningPath } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('student_id', targetStudentId)
      .eq('active', true)
      .maybeSingle();

    // Map database snake_case properties to camelCase for ReportService
    const mappedStudent: any = {
      _id: student.id,
      id: student.id,
      name: student.name,
      email: student.email,
      role: student.role,
    };

    const mappedProgress: any = progress ? {
      _id: progress.id,
      id: progress.id,
      studentId: progress.student_id,
      overallProgress: progress.overall_progress || 0,
      streak: progress.streak || 0,
      timeSpentMinutes: progress.time_spent_minutes || 0,
      completedTopicsCount: progress.completed_topics_count || 0,
      quizzesTaken: (progress.quizzes_taken || []).map((q: any) => ({
        quizId: q.quizId,
        title: q.title,
        score: q.score,
        totalQuestions: q.totalQuestions,
        accuracy: q.accuracy,
        date: q.date,
      })),
    } : null;

    const mappedLearningPath: any = learningPath ? {
      _id: learningPath.id,
      id: learningPath.id,
      studentId: learningPath.student_id,
      subject: learningPath.subject,
      currentWeek: learningPath.current_week,
      active: learningPath.active,
      weeks: learningPath.weeks,
    } : null;

    const excelBuffer = await ReportService.generateStudentExcelReport(mappedStudent, mappedProgress, mappedLearningPath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=PLIS_Report_${student.name.replace(/\s+/g, '_')}.xlsx`);
    res.send(excelBuffer);
  } catch (error: any) {
    console.error('Excel generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
