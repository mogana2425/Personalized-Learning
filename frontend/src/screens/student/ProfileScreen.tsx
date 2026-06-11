import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setProfile, logout } from '../../store/authSlice';
import api from '../../services/api';
import { COLORS, STYLES } from '../../components/Theme';
import { User, Mail, GraduationCap, School, Layers, LogOut } from 'lucide-react-native';

export const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const profileState = useSelector((state: RootState) => state.auth.profile);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(profileState?.age?.toString() || '');
  const [grade, setGrade] = useState(profileState?.class || 'Grade 10');
  const [schoolName, setSchoolName] = useState(profileState?.school || '');
  const [avatar, setAvatar] = useState(profileState?.avatar || '');
  const [parentEmail, setParentEmail] = useState(user?.parentEmail || '');

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      // Step 1: Update profile details in DB
      const profileResponse = await api.put('/profile', {
        age: age ? Number(age) : undefined,
        class: grade,
        school: schoolName,
        avatar,
      });

      if (profileResponse.data.success) {
        dispatch(setProfile(profileResponse.data.profile));
        Alert.alert('Profile Saved', 'Your academic details have been updated successfully.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of PLIS?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  return (
    <ScrollView style={STYLES.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* User Card Header */}
      <View style={[STYLES.card, styles.headerCard]}>
        <View style={styles.avatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: 70, height: 70, borderRadius: 35 }} />
          ) : (
            <Text style={styles.avatarText}>{name.slice(0, 2).toUpperCase()}</Text>
          )}
        </View>
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profileRole}>{user?.role.toUpperCase()} ACCOUNT</Text>
      </View>

      {/* Avatar Selection */}
      <View style={STYLES.card}>
        <Text style={[STYLES.title, { fontSize: 16, marginBottom: 15 }]}>Choose Avatar</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -5 }} contentContainerStyle={{ paddingHorizontal: 5 }}>
          {Array.from({ length: 15 }).map((_, i) => {
            const url = `https://api.dicebear.com/9.x/avataaars/png?seed=PLISStudent${i + 1}`;
            return (
              <TouchableOpacity 
                key={i} 
                onPress={() => setAvatar(url)} 
                style={[styles.avatarOption, avatar === url && styles.avatarOptionSelected]}
              >
                <Image source={{ uri: url }} style={styles.avatarOptionImage} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Editing Form */}
      <View style={STYLES.card}>
        <Text style={[STYLES.title, { fontSize: 16, marginBottom: 15 }]}>Academic Details</Text>

        <Text style={STYLES.inputLabel}>Grade / Class</Text>
        <TextInput
          placeholder="Grade 10"
          placeholderTextColor="#64748b"
          style={STYLES.input}
          value={grade}
          onChangeText={setGrade}
        />

        <Text style={STYLES.inputLabel}>School / Institution</Text>
        <TextInput
          placeholder="Helsinki Academy"
          placeholderTextColor="#64748b"
          style={STYLES.input}
          value={schoolName}
          onChangeText={setSchoolName}
        />

        <Text style={STYLES.inputLabel}>Age</Text>
        <TextInput
          placeholder="16"
          placeholderTextColor="#64748b"
          style={STYLES.input}
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
        />
      </View>

      <TouchableOpacity style={STYLES.button} onPress={handleUpdateProfile} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.text} /> : <Text style={STYLES.buttonText}>Save Profile</Text>}
      </TouchableOpacity>

      {/* Logout button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut color={COLORS.danger} size={18} />
        <Text style={styles.logoutText}>Sign Out Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 10,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileRole: {
    fontSize: 11,
    color: COLORS.primaryLight,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: COLORS.danger + '40',
    borderRadius: 12,
    backgroundColor: COLORS.danger + '08',
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  avatarOptionSelected: {
    borderColor: COLORS.primary,
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
  },
});

export default ProfileScreen;
