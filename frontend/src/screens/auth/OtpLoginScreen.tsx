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

  const handleSendOtp = () => {
    if (!phone) {
      if (Platform.OS === 'web') {
        alert('Error: Please enter a valid phone number.');
      } else {
        Alert.alert('Error', 'Please enter a valid phone number.');
      }
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      if (Platform.OS === 'web') {
        alert('OTP Sent: Use code 123456 or 654321 for verification.');
      } else {
        Alert.alert('OTP Sent', 'Use code 123456 or 654321 for verification.');
      }
    }, 1000);
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
      const response = await api.post('/auth/mobile-otp', { phone, otp });
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
          <Text style={[STYLES.title, { marginBottom: 10 }]}>OTP Verification</Text>
          <Text style={[STYLES.subtitle, { marginBottom: 20 }]}>
            {!otpSent
              ? 'Enter your mobile number to receive a one-time login PIN.'
              : 'Enter the 6-digit code sent to your phone.'}
          </Text>

          {!otpSent ? (
            <>
              <Text style={STYLES.inputLabel}>Phone Number</Text>
              <TextInput
                placeholder="+1 (555) 019-2834"
                placeholderTextColor="#64748b"
                style={STYLES.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={STYLES.button} onPress={handleSendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={STYLES.buttonText}>Send OTP Code</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={STYLES.inputLabel}>Verification Code</Text>
              <TextInput
                placeholder="e.g. 123456"
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
                <Text style={styles.resendText}>Change Phone Number</Text>
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
