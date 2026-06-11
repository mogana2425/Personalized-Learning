import { Schema, model, Document, Types } from 'mongoose';

export interface IReply {
  authorId: Types.ObjectId;
  authorName: string;
  body: string;
  upvotes: number;
  createdAt: Date;
}

export interface ICommunityPost extends Document {
  authorId: Types.ObjectId;
  authorName: string;
  title: string;
  body: string;
  subject: string;
  tags: string[];
  upvotes: number;
  upvotedBy: Types.ObjectId[];
  replies: IReply[];
  createdAt: Date;
  updatedAt: Date;
}

const ReplySchema = new Schema<IReply>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    body: { type: String, required: true },
    upvotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true },
    subject: { type: String, default: 'General' },
    tags: [{ type: String }],
    upvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: [ReplySchema],
  },
  { timestamps: true }
);

export default model<ICommunityPost>('CommunityPost', CommunityPostSchema);
