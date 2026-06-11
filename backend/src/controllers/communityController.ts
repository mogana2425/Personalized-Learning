import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import CommunityPost from '../models/CommunityPost';

// GET /api/community - list all posts (newest first)
export const getPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { subject, search, page = 1 } = req.query;
    const limit = 20;
    const skip = (Number(page) - 1) * limit;

    const filter: any = {};
    if (subject && subject !== 'All') filter.subject = subject;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
      ];
    }

    const posts = await CommunityPost.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await CommunityPost.countDocuments(filter);

    res.json({ success: true, posts, total });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/community - create a post
export const createPost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, body, subject, tags } = req.body;
    if (!title || !body) {
      res.status(400).json({ success: false, message: 'Title and body are required.' });
      return;
    }

    const post = await CommunityPost.create({
      authorId: req.user!._id,
      authorName: req.user!.name,
      title: title.trim(),
      body: body.trim(),
      subject: subject || 'General',
      tags: tags || [],
    });

    res.status(201).json({ success: true, post });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/community/:id/reply - add a reply
export const addReply = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { body } = req.body;
    if (!body) {
      res.status(400).json({ success: false, message: 'Reply body is required.' });
      return;
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }

    post.replies.push({
      authorId: req.user!._id as any,
      authorName: req.user!.name,
      body: body.trim(),
      upvotes: 0,
      createdAt: new Date(),
    });
    await post.save();

    res.json({ success: true, post });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/community/:id/upvote - toggle upvote on a post
export const upvotePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }

    const userId = req.user!._id.toString();
    const alreadyVoted = post.upvotedBy.map((id) => id.toString()).includes(userId);

    if (alreadyVoted) {
      post.upvotedBy = post.upvotedBy.filter((id) => id.toString() !== userId) as any;
      post.upvotes = Math.max(0, post.upvotes - 1);
    } else {
      post.upvotedBy.push(req.user!._id as any);
      post.upvotes += 1;
    }

    await post.save();
    res.json({ success: true, upvotes: post.upvotes, upvoted: !alreadyVoted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
