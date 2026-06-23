import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { supabase } from '../config/supabaseClient';

const mapProfile = (p: any) => ({
  _id: p.id,
  id: p.id,
  studentId: p.student_id,
  avatar: p.avatar,
  age: p.age,
  class: p.class,
  school: p.school,
  subjects: p.subjects,
  learningInterests: p.learning_interests,
  learningGoals: p.learning_goals,
  preferredLearningStyle: p.preferred_learning_style,
  skillScores: p.skill_scores,
  aiRecommendations: p.ai_recommendations,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
});

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?._id;
    if (!studentId) {
      res.status(400).json({ success: false, message: 'Invalid student ID' });
      return;
    }

    const { data: dbProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    let profile = dbProfile;
    if (!profile) {
      // Create a default initial profile
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          student_id: studentId,
          class: 'Grade 10',
          subjects: ['Mathematics'],
          learning_interests: [],
          learning_goals: [],
          preferred_learning_style: 'visual',
          skill_scores: { Algebra: 0, Geometry: 0, Calculus: 0 },
        })
        .select()
        .single();

      if (insertError) {
        res.status(400).json({ success: false, message: insertError.message });
        return;
      }
      profile = newProfile;
    }

    res.json({ success: true, profile: mapProfile(profile) });
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

    const { data: dbProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    let profile;
    if (dbProfile) {
      const updatedData = {
        avatar: avatar ?? dbProfile.avatar,
        age: age ?? dbProfile.age,
        class: grade ?? dbProfile.class,
        school: school ?? dbProfile.school,
        subjects: subjects ?? dbProfile.subjects,
        learning_interests: learningInterests ?? dbProfile.learning_interests,
        learning_goals: learningGoals ?? dbProfile.learning_goals,
        preferred_learning_style: preferredLearningStyle ?? dbProfile.preferred_learning_style,
        skill_scores: skillScores ? { ...dbProfile.skill_scores, ...skillScores } : dbProfile.skill_scores,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('student_id', studentId)
        .select()
        .single();

      if (updateError) {
        res.status(400).json({ success: false, message: updateError.message });
        return;
      }
      profile = updatedProfile;
    } else {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          student_id: studentId,
          avatar,
          age,
          class: grade || 'Grade 10',
          school,
          subjects: subjects || [],
          learning_interests: learningInterests || [],
          learning_goals: learningGoals || [],
          preferred_learning_style: preferredLearningStyle || 'visual',
          skill_scores: skillScores || {},
        })
        .select()
        .single();

      if (createError) {
        res.status(400).json({ success: false, message: createError.message });
        return;
      }
      profile = newProfile;
    }

    res.json({ success: true, message: 'Profile updated successfully', profile: mapProfile(profile) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
