import { Schema, model, Document, Types } from 'mongoose';

export interface IQuizLog {
  quizId: Types.ObjectId;
  title: string;
  score: number;
  totalQuestions: number;
  accuracy: number; // percentage
  date: Date;
}

export interface IProgress extends Document {
  studentId: Types.ObjectId;
  overallProgress: number; // overall percentage (0 - 100)
  streak: number; // consecutive active learning days
  lastActiveDate?: Date;
  weeklyHours: number[]; // e.g. [2, 1.5, 3, 0.5, 4, 1, 2.5] for Monday - Sunday study hours
  completedTopicsCount: number;
  quizzesTaken: IQuizLog[];
  timeSpentMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuizLogSchema = new Schema<IQuizLog>({
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  title: { type: String, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const ProgressSchema = new Schema<IProgress>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    overallProgress: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date },
    weeklyHours: { type: [Number], default: [0, 0, 0, 0, 0, 0, 0] }, // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    completedTopicsCount: { type: Number, default: 0 },
    quizzesTaken: [QuizLogSchema],
    timeSpentMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default model<IProgress>('Progress', ProgressSchema);
