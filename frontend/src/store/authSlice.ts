import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  phone?: string;
  parentEmail?: string;
}

export interface ProfileState {
  avatar?: string;
  age?: number;
  class: string;
  school?: string;
  subjects: string[];
  learningInterests: string[];
  learningGoals: string[];
  preferredLearningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  skillScores: Record<string, number>;
}

interface AuthState {
  token: string | null;
  user: UserState | null;
  profile: ProfileState | null;
  isAuthenticated: boolean;
}

// Load persisted auth state from localStorage
const loadAuthState = (): AuthState => {
  try {
    const token = localStorage.getItem('plis_token');
    const user = localStorage.getItem('plis_user');
    const profile = localStorage.getItem('plis_profile');
    if (token && user) {
      return {
        token,
        user: JSON.parse(user),
        profile: profile ? JSON.parse(profile) : null,
        isAuthenticated: true,
      };
    }
  } catch (_) {}
  return { token: null, user: null, profile: null, isAuthenticated: false };
};

const initialState: AuthState = loadAuthState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ token: string; user: UserState }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      // Persist to localStorage
      localStorage.setItem('plis_token', action.payload.token);
      localStorage.setItem('plis_user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.profile = null;
      state.isAuthenticated = false;
      // Clear localStorage
      localStorage.removeItem('plis_token');
      localStorage.removeItem('plis_user');
      localStorage.removeItem('plis_profile');
    },
    setProfile: (state, action: PayloadAction<ProfileState>) => {
      state.profile = action.payload;
      // Persist profile to localStorage
      localStorage.setItem('plis_profile', JSON.stringify(action.payload));
    },
    updateSkillScores: (state, action: PayloadAction<Record<string, number>>) => {
      if (state.profile) {
        state.profile.skillScores = {
          ...state.profile.skillScores,
          ...action.payload,
        };
      }
    },
  },
});

export const { loginSuccess, logout, setProfile, updateSkillScores } = authSlice.actions;
export default authSlice.reducer;
