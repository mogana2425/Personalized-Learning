import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import Profile from '../models/Profile';

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      res.status(400).json({ success: false, message: 'Invalid student ID' });
      return;
    }

    let profile = await Profile.findOne({ studentId });
    if (!profile) {
      // Create a default initial profile
      profile = await Profile.create({
        studentId,
        class: 'Grade 10',
        subjects: ['Mathematics'],
        learningInterests: [],
        learningGoals: [],
        preferredLearningStyle: 'visual',
        skillScores: { Algebra: 0, Geometry: 0, Calculus: 0 },
      });
    }

    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      res.status(400).json({ success: false, message: 'Invalid student ID' });
      return;
    }

    const { avatar, age, class: grade, school, subjects, learningInterests, learningGoals, preferredLearningStyle, skillScores } = req.body;

    let profile = await Profile.findOne({ studentId });

    if (profile) {
      profile.avatar = avatar ?? profile.avatar;
      profile.age = age ?? profile.age;
      profile.class = grade ?? profile.class;
      profile.school = school ?? profile.school;
      profile.subjects = subjects ?? profile.subjects;
      profile.learningInterests = learningInterests ?? profile.learningInterests;
      profile.learningGoals = learningGoals ?? profile.learningGoals;
      profile.preferredLearningStyle = preferredLearningStyle ?? profile.preferredLearningStyle;
      if (skillScores) {
        profile.skillScores = { ...profile.skillScores, ...skillScores };
      }
      await profile.save();
    } else {
      profile = await Profile.create({
        studentId,
        avatar,
        age,
        class: grade || 'Grade 10',
        school,
        subjects: subjects || [],
        learningInterests: learningInterests || [],
        learningGoals: learningGoals || [],
        preferredLearningStyle: preferredLearningStyle || 'visual',
        skillScores: skillScores || {},
      });
    }

    res.json({ success: true, message: 'Profile updated successfully', profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
