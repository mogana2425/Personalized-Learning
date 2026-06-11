import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: 'assignment' | 'quiz' | 'recommendation' | 'alert' | 'streak';
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['assignment', 'quiz', 'recommendation', 'alert', 'streak'],
      required: true,
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model<INotification>('Notification', NotificationSchema);
