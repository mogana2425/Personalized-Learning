import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { IProgress } from '../models/Progress';
import { IUser } from '../models/User';
import { ILearningPath } from '../models/LearningPath';

export class ReportService {
  /**
   * Generates a PDF Report for a student.
   */
  static async generateStudentPDFReport(
    student: IUser,
    progress: IProgress | null,
    learningPath: ILearningPath | null
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header Section
        doc
          .fillColor('#4f46e5')
          .fontSize(24)
          .text('Personalized Learning Intelligence System (PLIS)', { align: 'center' });
        doc.moveDown();
        
        doc
          .fillColor('#1f2937')
          .fontSize(16)
          .text('Student Performance Progress Report', { align: 'center' });
        
        doc
          .strokeColor('#e5e7eb')
          .lineWidth(1)
          .moveTo(50, doc.y + 10)
          .lineTo(550, doc.y + 10)
          .stroke();
        
        doc.moveDown(2);

        // Student Information
        doc.fontSize(12).fillColor('#4b5563');
        doc.text(`Student Name: `, { continued: true }).fillColor('#1f2937').text(student.name);
        doc.text(`Email Address: `, { continued: true }).fillColor('#1f2937').text(student.email);
        doc.text(`Role Account: `, { continued: true }).fillColor('#1f2937').text(student.role.toUpperCase());
        doc.text(`Report Date: `, { continued: true }).fillColor('#1f2937').text(new Date().toLocaleDateString());
        
        doc.moveDown();

        // Learning Stats Section
        if (progress) {
          doc
            .fillColor('#4f46e5')
            .fontSize(14)
            .text('Overall Learning Statistics');
          doc.moveDown(0.5);

          doc.fontSize(11).fillColor('#1f2937');
          doc.text(`• Overall Progress: ${progress.overallProgress}%`);
          doc.text(`• Current Streak: ${progress.streak} days`);
          doc.text(`• Total Study Time: ${Math.round(progress.timeSpentMinutes)} minutes`);
          doc.text(`• Completed Subtopics: ${progress.completedTopicsCount}`);
          
          doc.moveDown();

          // Quizzes Taken table
          doc
            .fillColor('#4f46e5')
            .fontSize(14)
            .text('Quiz Performance Log');
          doc.moveDown(0.5);

          if (progress.quizzesTaken && progress.quizzesTaken.length > 0) {
            progress.quizzesTaken.forEach((q, index) => {
              doc.fontSize(10).fillColor('#1f2937').text(
                `${index + 1}. ${q.title} - Score: ${q.score}/${q.totalQuestions} (${q.accuracy}% accuracy) on ${new Date(q.date).toLocaleDateString()}`
              );
            });
          } else {
            doc.fontSize(11).fillColor('#6b7280').text('No quizzes taken yet.');
          }
          doc.moveDown();
        }

        // Learning Path Section
        if (learningPath) {
          doc
            .fillColor('#4f46e5')
            .fontSize(14)
            .text('Learning Path Roadmap Summary');
          doc.moveDown(0.5);

          doc.fontSize(11).fillColor('#1f2937').text(`Subject: ${learningPath.subject}`);
          doc.text(`Current Week status: Week ${learningPath.currentWeek}`);
          
          learningPath.weeks.forEach((w) => {
            doc.moveDown(0.5);
            doc.fontSize(11).fillColor('#1f2937').text(`Week ${w.weekNumber}: ${w.title} [${w.status.toUpperCase()}]`);
            w.subtopics.forEach((s) => {
              doc.fontSize(10).fillColor('#4b5563').text(`   - ${s.name} [${s.status}]`);
            });
          });
        }

        // Footer Note
        const bottomY = doc.page.height - 80;
        doc
          .strokeColor('#e5e7eb')
          .lineWidth(1)
          .moveTo(50, bottomY)
          .lineTo(550, bottomY)
          .stroke();

        doc
          .fontSize(9)
          .fillColor('#9ca3af')
          .text('This is an AI-generated learning progress report by PLIS Engine.', 50, bottomY + 15, { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Generates an Excel Report for a student.
   */
  static async generateStudentExcelReport(
    student: IUser,
    progress: IProgress | null,
    learningPath: ILearningPath | null
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Overview
    const summarySheet = workbook.addWorksheet('Overview');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 35 },
    ];
    
    summarySheet.addRow({ metric: 'Student Name', value: student.name });
    summarySheet.addRow({ metric: 'Email Address', value: student.email });
    summarySheet.addRow({ metric: 'Account Status', value: 'Active' });
    summarySheet.addRow({ metric: 'Report Date', value: new Date().toLocaleDateString() });

    if (progress) {
      summarySheet.addRow({ metric: 'Overall Progress (%)', value: progress.overallProgress });
      summarySheet.addRow({ metric: 'Learning Streak (Days)', value: progress.streak });
      summarySheet.addRow({ metric: 'Total Study Minutes', value: progress.timeSpentMinutes });
      summarySheet.addRow({ metric: 'Completed Subtopics', value: progress.completedTopicsCount });
    }

    if (learningPath) {
      summarySheet.addRow({ metric: 'Main Subject', value: learningPath.subject });
      summarySheet.addRow({ metric: 'Current Roadmap Week', value: learningPath.currentWeek });
    }

    // Bold the header row
    summarySheet.getRow(1).font = { bold: true };

    // Sheet 2: Quiz Log
    const quizSheet = workbook.addWorksheet('Quiz Logs');
    quizSheet.columns = [
      { header: 'S.No', key: 'index', width: 10 },
      { header: 'Quiz Title', key: 'title', width: 30 },
      { header: 'Score Obtained', key: 'score', width: 15 },
      { header: 'Total Questions', key: 'total', width: 15 },
      { header: 'Accuracy (%)', key: 'accuracy', width: 15 },
      { header: 'Completed Date', key: 'date', width: 20 },
    ];
    
    quizSheet.getRow(1).font = { bold: true };

    if (progress && progress.quizzesTaken && progress.quizzesTaken.length > 0) {
      progress.quizzesTaken.forEach((q, idx) => {
        quizSheet.addRow({
          index: idx + 1,
          title: q.title,
          score: q.score,
          total: q.totalQuestions,
          accuracy: q.accuracy,
          date: new Date(q.date).toLocaleDateString(),
        });
      });
    } else {
      quizSheet.addRow({ index: 'No quiz records found.' });
    }

    // Write workbook buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer as ArrayBuffer);
  }
}
