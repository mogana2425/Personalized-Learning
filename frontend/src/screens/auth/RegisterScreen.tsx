import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import api from '../../services/api';
import { COLORS, STYLES } from '../../components/Theme';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
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

    setLoading(true);
    try {
      await api.post('/auth/register', {
        name,
        email,
        password,
        phone,
        role: 'student',
      });

      if (Platform.OS === 'web') {
        alert('Registration Successful: Your account has been created. Please log in.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Registration Successful', 'Your account has been created. Please log in.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed. Try a different email.';
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
          <Text style={[STYLES.title, { marginBottom: 20 }]}>Create Account</Text>

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
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={STYLES.buttonText}>Register</Text>}
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
