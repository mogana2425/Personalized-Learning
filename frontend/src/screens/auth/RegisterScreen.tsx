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
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [loading, setLoading] = useState(false);

  const handleSendOtpForRegistration = async () => {
    if (!name || !email || !password) {
      if (Platform.OS === 'web') {
        alert('Validation Error: Name, email, and password are required fields.');
      } else {
        Alert.alert('Validation Error', 'Name, email, and password are required fields.');
      }
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/send-otp', { email, phone });
      setStep('otp');
      const msg = `Verification OTP code sent to ${email}. Please check your email inbox.`;

      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('OTP Sent', msg);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to send OTP code.';
      if (Platform.OS === 'web') {
        alert('Error: ' + msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otp) {
      if (Platform.OS === 'web') {
        alert('Error: Please enter the 6-digit verification code.');
      } else {
        Alert.alert('Error', 'Please enter the 6-digit verification code.');
      }
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-register', {
        name,
        email,
        password,
        phone,
        role: 'student',
        otp,
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
        alert('Registration Verified Successfully! Welcome to PLIS.');
      } else {
        Alert.alert('Success', 'Registration Verified Successfully! Welcome to PLIS.');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Verification failed. Invalid OTP code.';
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
          <Text style={[STYLES.title, { marginBottom: 10 }]}>
            {step === 'details' ? 'Create Account' : 'Verify OTP Code'}
          </Text>
          <Text style={[STYLES.subtitle, { marginBottom: 20 }]}>
            {step === 'details'
              ? 'Enter your details below to receive a verification OTP PIN.'
              : `Enter the 6-digit code sent to ${email}`}
          </Text>

          {step === 'details' ? (
            <>
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

              <TouchableOpacity style={STYLES.button} onPress={handleSendOtpForRegistration} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={STYLES.buttonText}>Register & Send OTP</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={STYLES.inputLabel}>6-Digit Verification Code</Text>
              <TextInput
                placeholder="e.g. 123456"
                placeholderTextColor="#64748b"
                style={STYLES.input}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />

              <TouchableOpacity style={STYLES.button} onPress={handleVerifyAndRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={STYLES.buttonText}>Verify & Complete Account</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginLink} onPress={() => setStep('details')}>
                <Text style={styles.loginLinkText}>← Edit Registration Details</Text>
              </TouchableOpacity>
            </>
          )}
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
