import { Schema, model, Document, Types } from 'mongoose';

export interface IEvaluation {
  score: number;
  totalMarks: number;
  conceptUnderstanding: string;
  mistakes: string[];
  suggestions: string[];
  feedback: string;
}

export interface IAnswerSheet extends Document {
  studentId: Types.ObjectId;
  subject: string;
  topic?: string;
  fileUrl: string; // Cloudinary or local upload path
  fileName: string;
  extractedText?: string; // OCR reading
  evaluation?: IEvaluation; // AI Grading response
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationSchema = new Schema<IEvaluation>({
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  conceptUnderstanding: { type: String, required: true },
  mistakes: [{ type: String }],
  suggestions: [{ type: String }],
  feedback: { type: String, required: true },
});

const AnswerSheetSchema = new Schema<IAnswerSheet>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    topic: { type: String },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    extractedText: { type: String },
    evaluation: EvaluationSchema,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

export default model<IAnswerSheet>('AnswerSheet', AnswerSheetSchema);
