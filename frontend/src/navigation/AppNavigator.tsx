import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { COLORS } from '../components/Theme';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Image, useWindowDimensions } from 'react-native';

import { LayoutDashboard, BookOpen, MessageSquare, LineChart, UserCog, Zap, LogOut, Upload, Users, FileQuestion } from 'lucide-react-native';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Student Screens
import StudentDashboardScreen from '../screens/student/StudentDashboardScreen';
import LearningPathScreen from '../screens/student/LearningPathScreen';
import AITutorScreen from '../screens/student/AITutorScreen';
import ProgressTrackerScreen from '../screens/student/ProgressTrackerScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import AssessmentScreen from '../screens/student/AssessmentScreen';
import AnswerSheetUploadScreen from '../screens/student/AnswerSheetUploadScreen';
import AnalysisReportScreen from '../screens/student/AnalysisReportScreen';
import CommunityScreen from '../screens/student/CommunityScreen';
import QuizzesScreen from '../screens/student/QuizzesScreen';

// Other Role Dashboards
import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import ParentDashboardScreen from '../screens/parent/ParentDashboardScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

export type RootStackParamList = {
  Auth: undefined;
  Student: undefined;
  Teacher: undefined;
  Parent: undefined;
  Admin: undefined;
  Assessment: { subject: string };
  AnswerSheetUpload: undefined;
  AnalysisReport: { report?: any };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type StudentTabParamList = {
  Dashboard: undefined;
  MyLearning: undefined;
  Upload: undefined;
  AITutor: undefined;
  Community: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<StudentTabParamList>();

// ─── Auth Navigator ───────────────────────────────────────────────────────────
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.background, shadowColor: 'transparent' },
      headerTintColor: COLORS.text,
      headerTitleStyle: { fontWeight: 'bold' },
      cardStyle: { backgroundColor: COLORS.background },
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Reset Password' }} />
  </AuthStack.Navigator>
);

// ─── Web Sidebar Student Navigator ───────────────────────────────────────────
type WebRoute = 'Dashboard' | 'MyLearning' | 'Upload' | 'AITutor' | 'Quizzes' | 'Community' | 'Profile' | 'AnalysisReport' | 'Assessment';

const webNavItems: { key: WebRoute; label: string; icon: React.ReactNode; activeIcon: React.ReactNode }[] = [
  {
    key: 'Dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard color={COLORS.textMuted} size={20} />,
    activeIcon: <LayoutDashboard color={COLORS.primary} size={20} />,
  },
  {
    key: 'MyLearning',
    label: 'Learning Path',
    icon: <BookOpen color={COLORS.textMuted} size={20} />,
    activeIcon: <BookOpen color={COLORS.primary} size={20} />,
  },
  {
    key: 'Upload',
    label: 'Upload',
    icon: <Upload color={COLORS.textMuted} size={20} />,
    activeIcon: <Upload color={COLORS.primary} size={20} />,
  },
  {
    key: 'AITutor',
    label: 'AI Tutor',
    icon: <MessageSquare color={COLORS.textMuted} size={20} />,
    activeIcon: <MessageSquare color={COLORS.primary} size={20} />,
  },
  {
    key: 'Quizzes',
    label: 'Quizzes',
    icon: <FileQuestion color={COLORS.textMuted} size={20} />,
    activeIcon: <FileQuestion color={COLORS.primary} size={20} />,
  },
  {
    key: 'Community',
    label: 'Community',
    icon: <Users color={COLORS.textMuted} size={20} />,
    activeIcon: <Users color={COLORS.primary} size={20} />,
  },
  {
    key: 'Profile',
    label: 'My Profile',
    icon: <UserCog color={COLORS.textMuted} size={20} />,
    activeIcon: <UserCog color={COLORS.primary} size={20} />,
  },
];

const WebStudentNavigator: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState<WebRoute>('Dashboard');
  const [webParams, setWebParams] = useState<any>(null);
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.auth.profile);

  const fakeNavigation = {
    navigate: (screen: string, params?: any) => {
      if (screen === 'Assessment') {
        setActiveRoute('Assessment');
        setWebParams(params);
        return;
      }
      if (screen === 'AnalysisReport') {
        setActiveRoute('AnalysisReport');
        setWebParams(params);
        return;
      }
      // Pass subject param when navigating to LearningPath
      if (screen === 'LearningPath') {
        setActiveRoute('MyLearning');
        setWebParams(params);
        return;
      }
      setWebParams(undefined);
      setActiveRoute(screen as WebRoute);
    },
    goBack: () => {
      setActiveRoute('Dashboard');
    },
  };

  const renderScreen = () => {
    switch (activeRoute) {
      case 'Dashboard': return <StudentDashboardScreen navigation={fakeNavigation} />;
      case 'MyLearning': return <LearningPathScreen navigation={fakeNavigation} route={{ params: activeRoute === 'MyLearning' ? webParams : undefined }} />;
      case 'Upload': return <AnswerSheetUploadScreen navigation={fakeNavigation} />;
      case 'AnalysisReport': return <AnalysisReportScreen navigation={fakeNavigation} route={{ params: webParams }} />;
      case 'AITutor': return <AITutorScreen />;
      case 'Quizzes': return <QuizzesScreen navigation={fakeNavigation} />;
      case 'Community': return <CommunityScreen />;
      case 'Profile': return <ProfileScreen />;
      case 'Assessment': return <AssessmentScreen route={{ params: webParams }} navigation={fakeNavigation as any} />;
      default: return <StudentDashboardScreen navigation={fakeNavigation} />;
    }
  };

  return (
    <View style={webStyles.shell}>
      {/* ── Sidebar ── */}
      <View style={webStyles.sidebar} nativeID="sidebar">
        {/* Logo */}
        <View style={webStyles.logoWrap}>
          <View style={webStyles.logoIcon}>
            <Zap color="#fff" size={18} fill="#fff" />
          </View>
          <View>
            <Text style={webStyles.logoText}>PLIS</Text>
            <Text style={webStyles.logoSub}>Learning Portal</Text>
          </View>
        </View>

        {/* User chip */}
        <View style={webStyles.userChip}>
          <View style={webStyles.avatar}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            ) : (
              <Text style={webStyles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'S'}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={webStyles.userName} numberOfLines={1}>{user?.name || 'Student'}</Text>
            <Text style={webStyles.userRole}>{user?.role || 'student'}</Text>
          </View>
        </View>

        <View style={webStyles.divider} />

        {/* Nav items */}
        <Text style={webStyles.navGroupLabel}>MAIN MENU</Text>
        {webNavItems.map((item) => {
          const isActive = activeRoute === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[webStyles.navItem, isActive && webStyles.navItemActive]}
              onPress={() => setActiveRoute(item.key)}
              activeOpacity={0.7}
            >
              {isActive ? item.activeIcon : item.icon}
              <Text style={[webStyles.navLabel, isActive && webStyles.navLabelActive]}>
                {item.label}
              </Text>
              {isActive && <View style={webStyles.activePill} />}
            </TouchableOpacity>
          );
        })}

        <View style={{ flex: 1 }} />
        <View style={webStyles.divider} />

        {/* Logout */}
        <TouchableOpacity
          style={webStyles.logoutBtn}
          onPress={() => dispatch(logout())}
        >
          <LogOut color={COLORS.textMuted} size={18} />
          <Text style={webStyles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* ── Main Content ── */}
      <View style={webStyles.main}>
        {renderScreen()}
      </View>
    </View>
  );
};

// ─── Mobile Bottom Tab Navigator ─────────────────────────────────────────────
const StudentTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        const s = size - 2;
        if (route.name === 'Dashboard') return <LayoutDashboard color={color} size={s} />;
        if (route.name === 'MyLearning') return <BookOpen color={color} size={s} />;
        if (route.name === 'Upload') return <Upload color={color} size={s} />;
        if (route.name === 'AITutor') return <MessageSquare color={color} size={s} />;
        if (route.name === 'Community') return <Users color={color} size={s} />;
        return <UserCog color={color} size={s} />;
      },
      tabBarActiveTintColor: COLORS.primaryLight,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: {
        backgroundColor: COLORS.cardBg,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      headerStyle: { backgroundColor: COLORS.background, shadowColor: 'transparent', borderBottomWidth: 1, borderBottomColor: COLORS.border },
      headerTintColor: COLORS.text,
      headerTitleStyle: { fontWeight: 'bold' },
    })}
  >
    <Tab.Screen name="Dashboard" component={StudentDashboardScreen} options={{ title: 'PLIS Portal' }} />
    <Tab.Screen name="MyLearning" component={LearningPathScreen} options={{ title: 'Learning Path' }} />
    <Tab.Screen name="Upload" component={AnswerSheetUploadScreen} options={{ title: 'Upload' }} />
    <Tab.Screen name="AITutor" component={AITutorScreen} options={{ title: 'AI Tutor Chat' }} />
    <Tab.Screen name="Community" component={CommunityScreen} options={{ title: 'Community' }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Student Profile' }} />
  </Tab.Navigator>
);

// ─── Role-specific navigators ─────────────────────────────────────────────────
const TeacherStack = createStackNavigator();
const TeacherNavigator = () => (
  <TeacherStack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.background, shadowColor: 'transparent' }, headerTintColor: COLORS.text, cardStyle: { backgroundColor: COLORS.background } }}>
    <TeacherStack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} options={{ title: 'Teacher Dashboard' }} />
  </TeacherStack.Navigator>
);

const ParentStack = createStackNavigator();
const ParentNavigator = () => (
  <ParentStack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.background, shadowColor: 'transparent' }, headerTintColor: COLORS.text, cardStyle: { backgroundColor: COLORS.background } }}>
    <ParentStack.Screen name="ParentDashboard" component={ParentDashboardScreen} options={{ title: 'Parent Portal' }} />
  </ParentStack.Navigator>
);

const AdminStack = createStackNavigator();
const AdminNavigator = () => (
  <AdminStack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.background, shadowColor: 'transparent' }, headerTintColor: COLORS.text, cardStyle: { backgroundColor: COLORS.background } }}>
    <AdminStack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'System Analytics' }} />
  </AdminStack.Navigator>
);

// ─── Root Navigator ───────────────────────────────────────────────────────────
export const AppNavigator = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const isWeb = Platform.OS === 'web';
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // On web with authenticated student → show sidebar layout on desktop, or mobile tabs on small screens
  if (isWeb && isAuthenticated && user?.role === 'student' && isDesktop) {
    return <WebStudentNavigator />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: COLORS.background } }}>
      {!isAuthenticated || !user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          {user.role === 'student' && (
            <>
              <Stack.Screen name="Student" component={StudentTabNavigator} />
              <Stack.Screen name="Assessment" component={AssessmentScreen} options={{ headerShown: true, title: 'Initial Assessment Test', headerStyle: { backgroundColor: COLORS.background, shadowColor: 'transparent' }, headerTintColor: COLORS.text }} />
              <Stack.Screen name="AnswerSheetUpload" component={AnswerSheetUploadScreen} options={{ headerShown: true, title: 'Grade Answer Sheet', headerStyle: { backgroundColor: COLORS.background, shadowColor: 'transparent' }, headerTintColor: COLORS.text }} />
              <Stack.Screen name="AnalysisReport" component={AnalysisReportScreen} options={{ headerShown: true, title: 'Analysis Report', headerStyle: { backgroundColor: COLORS.background, shadowColor: 'transparent' }, headerTintColor: COLORS.text }} />
            </>
          )}
          {user.role === 'teacher' && <Stack.Screen name="Teacher" component={TeacherNavigator} />}
          {user.role === 'parent' && <Stack.Screen name="Parent" component={ParentNavigator} />}
          {user.role === 'admin' && <Stack.Screen name="Admin" component={AdminNavigator} />}
        </>
      )}
    </Stack.Navigator>
  );
};

// ─── Sidebar styles ───────────────────────────────────────────────────────────
const webStyles = StyleSheet.create({
  shell: { flex: 1, flexDirection: 'row', backgroundColor: '#f0f2ff' },
  sidebar: {
    width: 240,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    paddingVertical: 24,
    paddingHorizontal: 16,
    flexDirection: 'column',
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  logoIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  logoSub: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  userChip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  userName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  userRole: { fontSize: 11, color: COLORS.textMuted, textTransform: 'capitalize' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  navGroupLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 6, marginLeft: 4 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4, position: 'relative' },
  navItemActive: { backgroundColor: '#eef2ff' },
  navLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textMuted, flex: 1 },
  navLabelActive: { color: COLORS.primary, fontWeight: '700' },
  activePill: { width: 4, height: 20, borderRadius: 2, backgroundColor: COLORS.primary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  logoutText: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  main: { flex: 1, overflow: 'hidden' as any },
});

export default AppNavigator;
