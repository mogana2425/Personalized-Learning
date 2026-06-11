import { Schema, model, Document } from 'mongoose';

export interface IProfile extends Document {
  studentId: Schema.Types.ObjectId;
  avatar?: string;
  age?: number;
  class: string; // e.g. "Grade 10", "Year 12"
  school?: string;
  subjects: string[]; // e.g. ["Maths", "Science"]
  learningInterests: string[]; // e.g. ["Coding", "Robotics", "Astronomy"]
  learningGoals: string[]; // e.g. ["Clear Calculus Exam", "Build App"]
  preferredLearningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  skillScores: Record<string, number>; // e.g. { "Algebra": 85, "Geometry": 60, "Calculus": 35 }
  aiRecommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    avatar: { type: String },
    age: { type: Number },
    class: { type: String, required: true },
    school: { type: String },
    subjects: [{ type: String }],
    learningInterests: [{ type: String }],
    learningGoals: [{ type: String }],
    preferredLearningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'reading', 'kinesthetic'],
      default: 'visual',
    },
    skillScores: {
      type: Map,
      of: Number,
      default: {},
    },
    aiRecommendations: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default model<IProfile>('Profile', ProfileSchema);
