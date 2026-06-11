import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  parentEmail?: string; // Links student to parent
  childEmails?: string[]; // Links parent to children
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // optional for Google Login
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['student', 'teacher', 'parent', 'admin'],
      default: 'student',
    },
    parentEmail: { type: String, lowercase: true, trim: true },
    childEmails: [{ type: String, lowercase: true, trim: true }],
  },
  { timestamps: true }
);

export default model<IUser>('User', UserSchema);
