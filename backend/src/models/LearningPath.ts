import { Schema, model, Document } from 'mongoose';

export interface IResource {
  title: string;
  type: 'note' | 'video' | 'pdf' | 'flashcard';
  contentUrl?: string; // cloud link or mock file path
  textContent?: string; // for inline study notes / text
  description?: string;
  estimatedTimeMinutes?: number;
}

export interface ISubTopic {
  name: string;
  description: string;
  status: 'locked' | 'active' | 'completed';
  resources: IResource[];
  quizId?: Schema.Types.ObjectId; // Adaptive quiz for this subtopic
}

export interface IWeek {
  weekNumber: number;
  title: string;
  status: 'locked' | 'active' | 'completed';
  subtopics: ISubTopic[];
}

export interface ILearningPath extends Document {
  studentId: Schema.Types.ObjectId;
  subject: string;
  currentWeek: number;
  active: boolean;
  weeks: IWeek[];
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>({
  title: { type: String, required: true },
  type: { type: String, enum: ['note', 'video', 'pdf', 'flashcard'], required: true },
  contentUrl: { type: String },
  textContent: { type: String },
  description: { type: String },
  estimatedTimeMinutes: { type: Number, default: 10 },
});

const SubTopicSchema = new Schema<ISubTopic>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['locked', 'active', 'completed'], default: 'locked' },
  resources: [ResourceSchema],
  quizId: { type: Schema.Types.ObjectId, ref: 'Quiz' },
});

const WeekSchema = new Schema<IWeek>({
  weekNumber: { type: Number, required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['locked', 'active', 'completed'], default: 'locked' },
  subtopics: [SubTopicSchema],
});

const LearningPathSchema = new Schema<ILearningPath>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    currentWeek: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
    weeks: [WeekSchema],
  },
  { timestamps: true }
);

export default model<ILearningPath>('LearningPath', LearningPathSchema);
