import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import api from '../../services/api';
import { COLORS, STYLES } from '../../components/Theme';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      if (Platform.OS === 'web') {
        alert('Error: Please enter your email address.');
      } else {
        Alert.alert('Error', 'Please enter your email address.');
      }
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (Platform.OS === 'web') {
        alert(`Request Sent: ${response.data.message}`);
        navigation.navigate('Login');
      } else {
        Alert.alert('Request Sent', response.data.message, [
          { text: 'Back to Login', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to request reset.';
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
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={STYLES.card}>
          <Text style={[STYLES.title, { marginBottom: 10 }]}>Reset Password</Text>
          <Text style={[STYLES.subtitle, { marginBottom: 20 }]}>
            Enter your registered email address below, and we will send you instructions to reset your password.
          </Text>

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

          <TouchableOpacity style={STYLES.button} onPress={handleReset} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={STYLES.buttonText}>Send Reset Link</Text>}
          </TouchableOpacity>
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
});

export default ForgotPasswordScreen;
