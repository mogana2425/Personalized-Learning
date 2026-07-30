import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { supabase } from '../config/supabaseClient';

// SECURITY FIX: `search` was interpolated directly into a raw PostgREST `.or()` filter
// expression with no escaping, letting a query param containing `,`, `(`, `)`, `%`, `*`
// break out of the intended title/body ilike clauses (malformed-filter 500s, or injected
// extra filter clauses). Strip PostgREST filter-syntax metacharacters before use — plain
// text search still works, structural injection does not.
const sanitizeSearchTerm = (raw: string): string => raw.replace(/[,()%*]/g, '').trim();

const mapCommunityPost = (p: any) => {
  if (!p) return null;
  return {
    _id: p.id,
    id: p.id,
    authorId: p.author_id,
    authorName: p.author_name,
    title: p.title,
    body: p.body,
    subject: p.subject,
    tags: p.tags || [],
    upvotes: p.upvotes || 0,
    upvotedBy: p.upvoted_by || [],
    replies: (p.replies || []).map((r: any) => ({
      authorId: r.authorId,
      authorName: r.authorName,
      body: r.body,
      upvotes: r.upvotes || 0,
      createdAt: r.createdAt,
    })),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
};

// GET /api/community - list all posts (newest first)
export const getPosts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { subject, search, page = 1 } = req.query;
    const limit = 20;
    const skip = (Number(page) - 1) * limit;

    let query = supabase
      .from('community_posts')
      .select('*', { count: 'exact' });

    if (subject && subject !== 'All') {
      query = query.eq('subject', subject as string);
    }
    if (search) {
      const safeSearch = sanitizeSearchTerm(String(search));
      if (safeSearch) {
        query = query.or(`title.ilike.%${safeSearch}%,body.ilike.%${safeSearch}%`);
      }
    }

    const { data: posts, count, error } = await query
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    const mappedPosts = (posts || []).map(mapCommunityPost);

    res.json({
      success: true,
      posts: mappedPosts,
      total: count || 0,
    });
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

    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({
        author_id: req.user!.id,
        author_name: req.user!.name,
        title: title.trim(),
        body: body.trim(),
        subject: subject || 'General',
        tags: tags || [],
        upvotes: 0,
        upvoted_by: [],
        replies: [],
      })
      .select()
      .single();

    if (error || !post) {
      res.status(400).json({ success: false, message: error?.message || 'Failed to create post.' });
      return;
    }

    res.status(201).json({ success: true, post: mapCommunityPost(post) });
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

    const { data: post, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !post) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }

    const replies = Array.isArray(post.replies) ? post.replies : [];
    replies.push({
      authorId: req.user!.id,
      authorName: req.user!.name,
      body: body.trim(),
      upvotes: 0,
      createdAt: new Date().toISOString(),
    });

    const { data: updatedPost, error: updateError } = await supabase
      .from('community_posts')
      .update({ replies, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError || !updatedPost) {
      res.status(400).json({ success: false, message: updateError?.message || 'Failed to add reply.' });
      return;
    }

    res.json({ success: true, post: mapCommunityPost(updatedPost) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/community/:id/upvote - toggle upvote on a post
export const upvotePost = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data: post, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !post) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }

    const userId = req.user!.id;
    const upvotedBy = Array.isArray(post.upvoted_by) ? post.upvoted_by : [];
    const alreadyVoted = upvotedBy.includes(userId);
    
    let newUpvotedBy;
    let newUpvotes;

    if (alreadyVoted) {
      newUpvotedBy = upvotedBy.filter((id: string) => id !== userId);
      newUpvotes = Math.max(0, (post.upvotes || 0) - 1);
    } else {
      newUpvotedBy = [...upvotedBy, userId];
      newUpvotes = (post.upvotes || 0) + 1;
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from('community_posts')
      .update({
        upvotes: newUpvotes,
        upvoted_by: newUpvotedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError || !updatedPost) {
      res.status(400).json({ success: false, message: updateError?.message || 'Failed to update upvote.' });
      return;
    }

    res.json({ success: true, upvotes: updatedPost.upvotes, upvoted: !alreadyVoted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
