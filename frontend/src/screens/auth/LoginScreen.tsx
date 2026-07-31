import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess, setProfile } from '../../store/authSlice';
import api from '../../services/api';
import { COLORS, STYLES } from '../../components/Theme';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      if (Platform.OS === 'web') {
        alert('Validation Error: Please enter your email and password.');
      } else {
        Alert.alert('Validation Error', 'Please enter your email and password.');
      }
      return;
    }

    if (!email.trim().toLowerCase().endsWith('@gmail.com')) {
      if (Platform.OS === 'web') {
        alert('Validation Error: Only @gmail.com email addresses are allowed.');
      } else {
        Alert.alert('Validation Error', 'Only @gmail.com email addresses are allowed.');
      }
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, ...user } = response.data;
      
      dispatch(loginSuccess({ token, user }));
      
      // Load user profile details
      try {
        const profileResponse = await api.get('/profile');
        dispatch(setProfile(profileResponse.data.profile));
      } catch (profErr) {
        console.warn('Failed to fetch profile after login:', profErr);
      }
    } catch (error: any) {
      console.error('[DEBUG FRONTEND LOGIN ERROR]:', error, 'Message:', error?.message, 'Response:', error?.response?.data);
      const msg = error.response?.data?.message || error.message || 'Login failed. Please verify credentials.';
      if (Platform.OS === 'web') {
        alert('Authentication Error: ' + msg);
      } else {
        Alert.alert('Authentication Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick demo login for student only
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      try {
        await api.post('/auth/register', {
          name: 'Demo STUDENT',
          email: 'student@plis.com',
          password: 'password123',
          role: 'student',
        });
      } catch (e) {
        // Ignored if user already exists
      }
      const response = await api.post('/auth/login', { email: 'student@plis.com', password: 'password123' });
      const { token, ...user } = response.data;
      dispatch(loginSuccess({ token, user }));
      try {
        const profileResponse = await api.get('/profile');
        dispatch(setProfile(profileResponse.data.profile));
      } catch (e) {}
    } catch (error: any) {
      if (Platform.OS === 'web') {
        alert('Demo Login Failed: ' + error.message);
      } else {
        Alert.alert('Demo Login Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <Text style={styles.logoText}>PLIS</Text>
          <Text style={styles.tagline}>Personalized Learning Intelligence System</Text>
        </View>

        <View style={STYLES.card}>
          <Text style={[STYLES.title, { marginBottom: 20 }]}>Sign In</Text>

          <Text style={STYLES.inputLabel}>Email Address</Text>
          <TextInput
            placeholder="yourname@domain.com"
            placeholderTextColor="#64748b"
            style={STYLES.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={STYLES.inputLabel}>Password</Text>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            style={STYLES.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={STYLES.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={STYLES.buttonText}>Login</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.secondaryBtnText}>New here? Create account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleDemoLogin}>
            <Text style={[styles.secondaryBtnText, { color: COLORS.primary }]}>Try Demo Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.primary, // Helsinki Indigo instead of light primary for better light mode visibility
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  optionsContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  secondaryBtn: {
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
});

export default LoginScreen;
