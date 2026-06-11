import { Schema, model, Document, Types } from 'mongoose';

export interface IMessage {
  role: 'user' | 'model';
  text: string;
  createdAt: Date;
}

export interface ITutorChat extends Document {
  studentId: Types.ObjectId;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, enum: ['user', 'model'], required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const TutorChatSchema = new Schema<ITutorChat>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

export default model<ITutorChat>('TutorChat', TutorChatSchema);
