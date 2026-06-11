import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { GeminiService } from '../services/geminiService';
import Notification from '../models/Notification';
import Profile from '../models/Profile';
import LearningPath from '../models/LearningPath';
import TutorChat from '../models/TutorChat';

export const getChatHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const tutorChat = await TutorChat.findOne({ studentId: req.user._id });
    if (!tutorChat) {
      res.json({ success: true, history: [] });
      return;
    }

    res.json({ success: true, history: tutorChat.messages });
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
      const profile = await Profile.findOne({ studentId: req.user._id });
      const path = await LearningPath.findOne({ studentId: req.user._id, active: true });

      if (profile) {
        context = `
          You are tutoring a student named ${req.user.name}.
          You are a very friendly, enthusiastic, and approachable teacher. 
          CRITICAL INSTRUCTION: Teach in small, bite-sized chunks. Do NOT give long walls of text. 
          Make learning fun and occasionally use light humor or jokes.
          Provide answers that give a deep, "big picture" understanding of the concept, despite being short.
          Their learning style: ${profile.preferredLearningStyle}.
          Their goals: ${profile.learningGoals.join(', ')}.
          Their skill scores (out of 100): ${JSON.stringify(profile.skillScores)}.
          ${path && path.weeks ? `Their active learning path involves: ${path.weeks.map(w => w.title).join(', ')}` : ''}
          Keep your responses highly personalized, actionable, short, and encouraging based on this profile.
        `;
      }
    }
    
    // Call Gemini tutoring API
    const reply = await GeminiService.tutorChat(message, chatHistory, context);

    // Save to database using atomic $push to avoid Mongoose subdocument array issues
    if (req.user && message && message.trim() && reply && reply.trim()) {
      const newMessages = [
        { role: 'user' as const, text: message.trim(), createdAt: new Date() },
        { role: 'model' as const, text: reply.trim(), createdAt: new Date() },
      ];

      const existing = await TutorChat.findOne({ studentId: req.user._id });

      if (!existing) {
        // Create fresh record
        await TutorChat.create({ studentId: req.user._id, messages: newMessages });
      } else {
        // Atomically push only valid new messages (never rewrite the whole array)
        await TutorChat.updateOne(
          { studentId: req.user._id },
          { $push: { messages: { $each: newMessages } } }
        );
      }
    }

    // Create a notification record occasionally to encourage learning
    if (chatHistory.length === 0 && req.user) {
      await Notification.create({
        userId: req.user._id,
        title: 'AI Tutor Active',
        message: 'Your AI Tutor is ready to answer questions on any subject.',
        type: 'recommendation',
      });
    }

    res.json({ success: true, reply });
  } catch (error: any) {
    require('fs').appendFileSync('/Users/kaveen/Documents/Personalized Learning/backend/tutor_error.log', new Date().toISOString() + ': ' + error.message + '\\n' + error.stack + '\\n');
    res.status(500).json({ success: false, message: error.message });
  }
};
