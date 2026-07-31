import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import api from '../../services/api';
import { COLORS, STYLES } from '../../components/Theme';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email || !password || !confirmPassword) {
      if (Platform.OS === 'web') {
        alert('Validation Error: Please fill in all fields.');
      } else {
        Alert.alert('Validation Error', 'Please fill in all fields.');
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

    if (password.length < 6) {
      if (Platform.OS === 'web') {
        alert('Validation Error: Password must be at least 6 characters long.');
      } else {
        Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      }
      return;
    }

    if (password !== confirmPassword) {
      if (Platform.OS === 'web') {
        alert('Validation Error: Passwords do not match.');
      } else {
        Alert.alert('Validation Error', 'Passwords do not match.');
      }
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email, password });
      const successMsg = response.data.message || 'Password updated successfully!';
      if (Platform.OS === 'web') {
        alert(successMsg);
        navigation.navigate('Login');
      } else {
        Alert.alert('Success', successMsg, [
          { text: 'Back to Login', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update password.';
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
            Enter your registered @gmail.com address, new password, and confirm password to update your account.
          </Text>

          <Text style={STYLES.inputLabel}>Email Address</Text>
          <TextInput
            placeholder="yourname@gmail.com"
            placeholderTextColor="#64748b"
            style={STYLES.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={STYLES.inputLabel}>New Password</Text>
          <TextInput
            placeholder="Min 6 characters"
            placeholderTextColor="#64748b"
            style={STYLES.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={STYLES.inputLabel}>Confirm New Password</Text>
          <TextInput
            placeholder="Re-enter new password"
            placeholderTextColor="#64748b"
            style={STYLES.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity style={STYLES.button} onPress={handleReset} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={STYLES.buttonText}>Update Password</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>← Back to Login</Text>
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

export default ForgotPasswordScreen;
