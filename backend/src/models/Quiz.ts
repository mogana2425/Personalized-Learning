import { Schema, model, Document, Types } from 'mongoose';

export interface IQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface IQuiz extends Document {
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  questions: IQuestion[];
  isInitialAssessment: boolean;
  timeLimitMinutes: number; // For timed tests
  creatorId?: Types.ObjectId; // If created by a teacher
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
  explanation: { type: String },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
});

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String, required: true },
    topic: { type: String },
    difficultyLevel: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    questions: [QuestionSchema],
    isInitialAssessment: { type: Boolean, default: false },
    timeLimitMinutes: { type: Number, default: 15 },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default model<IQuiz>('Quiz', QuizSchema);
