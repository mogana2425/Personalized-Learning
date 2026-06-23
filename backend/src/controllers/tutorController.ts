import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { supabase } from '../config/supabaseClient';
import { GeminiService } from '../services/geminiService';
import fs from 'fs';
import path from 'path';

export const getChatHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { data: tutorChat, error } = await supabase
      .from('tutor_chats')
      .select('*')
      .eq('student_id', req.user.id)
      .maybeSingle();

    if (error || !tutorChat) {
      res.json({ success: true, history: [] });
      return;
    }

    res.json({ success: true, history: tutorChat.messages || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { message, history } = req.body;

    if (!message) {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    const chatHistory = history || [];
    let context = '';

    if (req.user) {
      const studentId = req.user.id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      const { data: pathData } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('student_id', studentId)
        .eq('active', true)
        .maybeSingle();

      if (profile) {
        const goals = Array.isArray(profile.learning_goals) ? profile.learning_goals : [];
        const preferredStyle = profile.preferred_learning_style || 'visual';
        const skillScores = profile.skill_scores || {};
        const weeks = pathData && Array.isArray(pathData.weeks) ? pathData.weeks : [];

        context = `
          You are tutoring a student named ${req.user.name}.
          You are a very friendly, enthusiastic, and approachable teacher. 
          CRITICAL INSTRUCTION: Teach in small, bite-sized chunks. Do NOT give long walls of text. 
          Make learning fun and occasionally use light humor or jokes.
          Provide answers that give a deep, "big picture" understanding of the concept, despite being short.
          Their learning style: ${preferredStyle}.
          Their goals: ${goals.join(', ')}.
          Their skill scores (out of 100): ${JSON.stringify(skillScores)}.
          ${weeks.length > 0 ? `Their active learning path involves: ${weeks.map((w: any) => w.title).join(', ')}` : ''}
          Keep your responses highly personalized, actionable, short, and encouraging based on this profile.
        `;
      }
    }
    
    // Call Gemini tutoring API
    const reply = await GeminiService.tutorChat(message, chatHistory, context);

    // Save to database
    if (req.user && message && message.trim() && reply && reply.trim()) {
      const studentId = req.user.id;
      const newMessages = [
        { role: 'user', text: message.trim(), createdAt: new Date().toISOString() },
        { role: 'model', text: reply.trim(), createdAt: new Date().toISOString() },
      ];

      const { data: existingChat } = await supabase
        .from('tutor_chats')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (!existingChat) {
        // Create fresh record
        await supabase
          .from('tutor_chats')
          .insert({ student_id: studentId, messages: newMessages });
      } else {
        const updatedMessages = [...(existingChat.messages || []), ...newMessages];
        await supabase
          .from('tutor_chats')
          .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
          .eq('student_id', studentId);
      }
    }

    // Create a notification record occasionally to encourage learning
    if (chatHistory.length === 0 && req.user) {
      await supabase.from('notifications').insert({
        user_id: req.user.id,
        title: 'AI Tutor Active',
        message: 'Your AI Tutor is ready to answer questions on any subject.',
        type: 'recommendation',
      });
    }

    res.json({ success: true, reply });
  } catch (error: any) {
    try {
      fs.appendFileSync(
        path.join(__dirname, '../../tutor_error.log'),
        new Date().toISOString() + ': ' + error.message + '\n' + error.stack + '\n'
      );
    } catch (logErr) {
      console.error('Failed to log error to file:', logErr);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
