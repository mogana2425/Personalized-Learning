import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess, setProfile } from '../../store/authSlice';
import api from '../../services/api';
import { COLORS, STYLES } from '../../components/Theme';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      if (Platform.OS === 'web') {
        alert('Validation Error: Name, email, and password are required fields.');
      } else {
        Alert.alert('Validation Error', 'Name, email, and password are required fields.');
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
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        phone,
        role: 'student',
      });

      const { token, ...user } = response.data;
      dispatch(loginSuccess({ token, user }));

      if (user.role === 'student') {
        try {
          const profileResponse = await api.get('/profile');
          dispatch(setProfile(profileResponse.data.profile));
        } catch (e) {
          // ignore if profile setup deferred
        }
      }

      if (Platform.OS === 'web') {
        alert('Registration Successful! Welcome to PLIS.');
      } else {
        Alert.alert('Success', 'Registration Successful! Welcome to PLIS.');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      if (Platform.OS === 'web') {
        alert('Error: ' + msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.innerContainer}>
        <View style={STYLES.card}>
          <Text style={[STYLES.title, { marginBottom: 10 }]}>Create Account</Text>
          <Text style={[STYLES.subtitle, { marginBottom: 20 }]}>
            Enter your details below to create your PLIS account.
          </Text>

          <Text style={STYLES.inputLabel}>Full Name</Text>
          <TextInput
            placeholder="John Doe"
            placeholderTextColor="#64748b"
            style={STYLES.input}
            value={name}
            onChangeText={setName}
          />

          <Text style={STYLES.inputLabel}>Email Address</Text>
          <TextInput
            placeholder="john@example.com"
            placeholderTextColor="#64748b"
            style={STYLES.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={STYLES.inputLabel}>Password</Text>
          <TextInput
            placeholder="Min 6 characters"
            placeholderTextColor="#64748b"
            style={STYLES.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={STYLES.inputLabel}>Phone Number (Optional)</Text>
          <TextInput
            placeholder="+1234567890"
            placeholderTextColor="#64748b"
            style={STYLES.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TouchableOpacity style={STYLES.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={STYLES.buttonText}>Create Account</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLinkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 10,
  },
  loginLinkText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },
});

export default RegisterScreen;
