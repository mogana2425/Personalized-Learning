import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import Progress from '../models/Progress';
import LearningPath from '../models/LearningPath';
import { ReportService } from '../services/reportService';

/**
 * Downloads student PDF progress report.
 */
export const downloadPDFReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { studentId } = req.query;
    let targetStudentId = requester._id;

    // Teachers/Parents can query a specific child/student
    if (studentId && (requester.role === 'teacher' || requester.role === 'parent' || requester.role === 'admin')) {
      targetStudentId = studentId as any;
    }

    const student = await User.findById(targetStudentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const progress = await Progress.findOne({ studentId: targetStudentId });
    const learningPath = await LearningPath.findOne({ studentId: targetStudentId, active: true });

    const pdfBuffer = await ReportService.generateStudentPDFReport(student, progress, learningPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=PLIS_Report_${student.name.replace(/\s+/g, '_')}.pdf`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Downloads student Excel spreadsheet log.
 */
export const downloadExcelReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const requester = req.user;
    if (!requester) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { studentId } = req.query;
    let targetStudentId = requester._id;

    if (studentId && (requester.role === 'teacher' || requester.role === 'parent' || requester.role === 'admin')) {
      targetStudentId = studentId as any;
    }

    const student = await User.findById(targetStudentId);
    if (!student) {
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    const progress = await Progress.findOne({ studentId: targetStudentId });
    const learningPath = await LearningPath.findOne({ studentId: targetStudentId, active: true });

    const excelBuffer = await ReportService.generateStudentExcelReport(student, progress, learningPath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=PLIS_Report_${student.name.replace(/\s+/g, '_')}.xlsx`);
    res.send(excelBuffer);
  } catch (error: any) {
    console.error('Excel generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
