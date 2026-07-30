import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess, setProfile } from '../../store/authSlice';
import api from '../../services/api';
import { COLORS, STYLES } from '../../components/Theme';

interface OtpLoginScreenProps {
  navigation: any;
}

export const OtpLoginScreen: React.FC<OtpLoginScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phone) {
      if (Platform.OS === 'web') {
        alert('Error: Please enter a valid email or phone number.');
      } else {
        Alert.alert('Error', 'Please enter a valid email or phone number.');
      }
      return;
    }
    setLoading(true);
    try {
      const isEmail = phone.includes('@');
      const response = await api.post('/auth/send-otp', {
        email: isEmail ? phone : undefined,
        phone: !isEmail ? phone : undefined,
      });

      setOtpSent(true);
      const serverCode = response.data.otpCode || response.data.code;
      const codeMsg = serverCode ? ` (Verification Code: ${serverCode})` : '';
      const msg = `OTP Code sent to ${phone}${codeMsg}`;

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

  const handleVerifyOtp = async () => {
    if (!otp) {
      if (Platform.OS === 'web') {
        alert('Error: Please enter the verification code.');
      } else {
        Alert.alert('Error', 'Please enter the verification code.');
      }
      return;
    }
    setLoading(true);
    try {
      const isEmail = phone.includes('@');
      const response = await api.post('/auth/verify-otp', {
        email: isEmail ? phone : undefined,
        phone: !isEmail ? phone : undefined,
        otp,
      });
      const { token, ...user } = response.data;
      dispatch(loginSuccess({ token, user }));

      if (user.role === 'student') {
        const profileResponse = await api.get('/profile');
        dispatch(setProfile(profileResponse.data.profile));
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'OTP verification failed.';
      if (Platform.OS === 'web') {
        alert('Verification Error: ' + msg);
      } else {
        Alert.alert('Verification Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={STYLES.card}>
          <Text style={[STYLES.title, { marginBottom: 10 }]}>Free OTP Verification</Text>
          <Text style={[STYLES.subtitle, { marginBottom: 20 }]}>
            {!otpSent
              ? 'Enter your Email or Phone Number to receive a 6-digit verification code.'
              : 'Enter the 6-digit code sent to your account.'}
          </Text>

          {!otpSent ? (
            <>
              <Text style={STYLES.inputLabel}>Email or Phone Number</Text>
              <TextInput
                placeholder="student@example.com or +1 (555) 019-2834"
                placeholderTextColor="#64748b"
                style={STYLES.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={STYLES.button} onPress={handleSendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={STYLES.buttonText}>Send Free OTP Code</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={STYLES.inputLabel}>Verification Code</Text>
              <TextInput
                placeholder="e.g. 6-digit OTP code"
                placeholderTextColor="#64748b"
                style={STYLES.input}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity style={STYLES.button} onPress={handleVerifyOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={STYLES.buttonText}>Verify & Sign In</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendBtn} onPress={() => setOtpSent(false)}>
                <Text style={styles.resendText}>Change Email / Phone</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: 460,
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 20,
  },
  resendText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});

export default OtpLoginScreen;
