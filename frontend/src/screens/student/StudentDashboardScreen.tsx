import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, Platform, Alert, useWindowDimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../services/api';
import { COLORS, SHADOWS } from '../../components/Theme';
import CircularProgress from '../../components/CircularProgress';
import {
  Flame, Bell, Sparkles, AlertTriangle, ArrowRight,
  CheckCircle, TrendingUp, Zap, Calendar, UploadCloud, CheckSquare, AlertCircle, BookOpen
} from 'lucide-react-native';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 32, 480);

interface DashboardMetrics {
  overallProgress: number;
  streak: number;
  quizzesTakenCount: number;
  pendingWorksheets: number;
  weeklyHours: number[];
  skillScores: Record<string, number>;
}

const getTimeGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Mini bar chart (no external dep) ────────────────────────────────────────
const CHART_H = 110; // fixed pixel height of bar area
const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#818cf8', '#6366f1', '#c4b5fd', '#e0e7ff'];

const WeeklyBarChart: React.FC<{ data: number[]; quizCount: number }> = ({ data, quizCount }) => {
  const hasAnyData = data.some((v) => v > 0);
  const maxVal = hasAnyData ? Math.max(...data) : 5;
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <View>
      {/* Stat row */}
      <View style={chart.statRow}>
        <View style={chart.statChip}>
          <Text style={chart.statNum}>{quizCount}</Text>
          <Text style={chart.statLabel}>Sheets Submitted</Text>
        </View>
        <View style={chart.statChip}>
          <Text style={chart.statNum}>{data.reduce((a, b) => a + b, 0)}</Text>
          <Text style={chart.statLabel}>Activities This Week</Text>
        </View>
        <View style={chart.statChip}>
          <Text style={chart.statNum}>{data[todayIdx] || 0}</Text>
          <Text style={chart.statLabel}>Today</Text>
        </View>
      </View>

      {/* Bar chart */}
      <View style={chart.wrap}>
        {data.map((val, i) => {
          const barH = hasAnyData ? Math.max((val / maxVal) * CHART_H, val > 0 ? 12 : 4) : 4;
          const isToday = i === todayIdx;
          return (
            <View key={i} style={chart.col}>
              {val > 0 && (
                <Text style={[chart.valLabel, isToday && { color: COLORS.primary, fontWeight: '800' }]}>
                  {val}
                </Text>
              )}
              <View style={[chart.barBg, { height: CHART_H }]}>
                <View
                  style={[
                    chart.bar,
                    { height: barH, backgroundColor: isToday ? '#4f46e5' : BAR_COLORS[i] },
                  ]}
                />
              </View>
              <Text style={[chart.label, isToday && { color: '#4f46e5', fontWeight: '700' }]}>
                {DAY_LABELS[i]}
              </Text>
            </View>
          );
        })}
      </View>

      {!hasAnyData && (
        <View style={chart.emptyWrap}>
          <Text style={chart.emptyText}>📊 No activity yet this week</Text>
          <Text style={chart.emptyHint}>Submit an answer sheet to track your progress!</Text>
        </View>
      )}
    </View>
  );
};

export const StudentDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { width: windowWidth } = useWindowDimensions();
  const isSmallScreen = windowWidth < 768;
  const user = useSelector((state: RootState) => state.auth.user);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    overallProgress: 0,
    streak: 0,
    quizzesTakenCount: 0,
    pendingWorksheets: 0,
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    skillScores: {},
  });
  const [todayPlan, setTodayPlan] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard');
      if (response.data.success) {
        setMetrics(response.data.metrics);
        setTodayPlan(response.data.todayPlan);
        setRecommendations(response.data.aiRecommendations);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const isDiagnosticPending =
    Object.keys(metrics.skillScores)
      .filter(k => !k.startsWith('$') && !k.startsWith('_') && k.length < 60)
      .length === 0 ||
    Object.values(metrics.skillScores).every((s) => s === 0);

  // Set browser tab title on web
  if (Platform.OS === 'web') {
    document.title = 'Dashboard – PLIS Portal';
  }

  const firstName = user?.name?.split(' ')[0] || 'Student';
  const progress = metrics.overallProgress;

  // Compute strengths and weaknesses from skillScores
  const skillEntries = Object.entries(metrics.skillScores)
    .filter(([k]) => !k.startsWith('$') && !k.startsWith('_') && k.length < 60)
    .sort((a, b) => b[1] - a[1]);
  
  const strengths = skillEntries.slice(0, 2);
  const weaknesses = skillEntries.slice(-2).reverse(); // lowest scores first


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getTimeGreeting()},</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.userName}>{firstName}</Text>
            <Text style={{ fontSize: 22 }}>👋</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.streakChip}>
            <Flame color="#ea580c" size={16} fill="#ea580c" />
            <Text style={styles.streakChipText}>{metrics.streak || 1}</Text>
          </View>
          <TouchableOpacity 
            style={styles.bellBtn} 
            onPress={() => {
              // Note: using alert from react-native
              Alert.alert('Notifications', 'You have 1 new notification:\\n\\nWelcome to PLIS! Complete your profile to get started.');
            }}
          >
            <Bell color={COLORS.text} size={20} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 2. UPLOAD ANSWER SHEET BUTTON ── */}
      <TouchableOpacity 
        style={styles.uploadMainBtn}
        onPress={() => navigation.navigate('Upload')}
        activeOpacity={0.8}
      >
        <UploadCloud color="#fff" size={24} />
        <Text style={styles.uploadMainBtnText}>Upload Answer Sheet</Text>
      </TouchableOpacity>

      {/* ── DIAGNOSTIC BANNER ── */}
      {isDiagnosticPending && (
        <TouchableOpacity
          style={styles.diagBanner}
          onPress={() => navigation.navigate('Assessment', { subject: 'Mathematics' })}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={styles.diagIcon}>
              <AlertTriangle color="#b45309" size={20} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.diagTitle}>Diagnostic Test Pending</Text>
              <Text style={styles.diagDesc}>Complete your skill assessment to unlock AI features</Text>
            </View>
          </View>
          <ArrowRight color="#b45309" size={18} />
        </TouchableOpacity>
      )}

      {/* ── 3. AI LEARNING SCORE (HERO) ── */}
      <View style={[styles.heroCard, isSmallScreen && { padding: 20 }]}>
        <View style={styles.blobTL} />
        <View style={styles.blobBR} />
        <View style={[styles.heroRow, isSmallScreen && { flexDirection: 'column', gap: 20 }]}>
          <View style={[styles.heroLeft, isSmallScreen && { marginRight: 0 }]}>
            <Text style={styles.heroPreTitle}>AI Learning Score</Text>
            <CircularProgress
              progress={progress}
              size={110}
              strokeWidth={10}
              fontSize={24}
              darkMode
            />
          </View>
          <View style={[styles.heroRight, isSmallScreen && { alignItems: 'center' }]}>
            <Text style={[styles.heroRightTitle, isSmallScreen && { textAlign: 'center', fontSize: 20 }]}>Great job, {firstName}!</Text>
            <Text style={[styles.heroRightDesc, isSmallScreen && { textAlign: 'center', fontSize: 13 }]}>
              You are mastering your subjects. Keep completing your learning path to reach 100%.
            </Text>
            <TouchableOpacity 
              style={[styles.heroBtn, isSmallScreen && { alignSelf: 'center' }]}
              onPress={() => navigation.navigate('MyLearning')}
            >
              <Text style={styles.heroBtnText}>Continue Learning</Text>
              <ArrowRight color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── 4. STRENGTHS & WEAKNESSES ── */}
      {skillEntries.length > 0 && (
        <View style={[styles.swGrid, isSmallScreen && { flexDirection: 'column' }]}>
          <View style={[styles.swCard, { borderColor: '#dcfce7', backgroundColor: '#f0fdf4' }]}>
            <Text style={styles.swTitle}>Strengths</Text>
            {strengths.map(([skill]) => (
              <View key={skill} style={styles.swItem}>
                <CheckSquare color="#16a34a" size={16} />
                <Text style={[styles.swItemText, { color: '#166534' }]} numberOfLines={1}>{skill}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.swCard, { borderColor: '#fee2e2', backgroundColor: '#fef2f2' }]}>
            <Text style={styles.swTitle}>Weak Areas</Text>
            {weaknesses.map(([skill]) => (
              <View key={skill} style={styles.swItem}>
                <AlertCircle color="#dc2626" size={16} />
                <Text style={[styles.swItemText, { color: '#991b1b' }]} numberOfLines={1}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── 5. AI RECOMMENDATIONS ── */}
      {recommendations.length > 0 && (
        <View style={styles.aiCard}>
          <View style={styles.aiCardHeader}>
            <View style={styles.aiIconWrap}>
              <Sparkles color="#fff" size={16} fill="#fff" />
            </View>
            <Text style={styles.aiCardTitle}>AI Recommendations</Text>
            <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>Live</Text></View>
          </View>
          {recommendations.slice(0, 3).map((rec, i) => (
            <View key={i} style={styles.aiRecRow}>
              <View style={styles.aiRecDot} />
              <Text style={styles.aiRecText}>{rec}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── 6. PERFORMANCE OVERVIEW ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <Text style={{ fontSize: 12, color: COLORS.textMuted }}>This Week</Text>
      </View>
      <View style={styles.chartCard}>
        <WeeklyBarChart data={metrics.weeklyHours} quizCount={metrics.quizzesTakenCount} />
      </View>

      {/* ── 7. TODAY'S LEARNING PLAN ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Learning Plan</Text>
      </View>

      {todayPlan.length > 0 ? (
        todayPlan.map((item, idx) => {
          const statusColors = ['#eef2ff', '#f0fdf4', '#fdf4ff'];
          const statusText = idx === 0 ? 'In Progress' : 'Upcoming';
          const statusColor = idx === 0 ? COLORS.primary : COLORS.secondary;
          return (
            <TouchableOpacity 
              key={idx} 
              style={styles.planCard}
              onPress={() => navigation.navigate('MyLearning', { subject: item.subject || 'Mathematics' })}
              activeOpacity={0.8}
            >
              <View style={[styles.planAccent, { backgroundColor: statusColors[idx % 3] }]}>
                <BookOpen color={statusColor} size={18} />
              </View>
              <View style={styles.planInfo}>
                <View style={styles.planTopRow}>
                  <Text style={styles.planSubtopic} numberOfLines={1}>{item.subtopic}</Text>
                  <View style={[styles.planBadge, { backgroundColor: idx === 0 ? '#eef2ff' : '#f0fdf4' }]}>
                    <Text style={[styles.planBadgeText, { color: statusColor }]}>{statusText}</Text>
                  </View>
                </View>
                <Text style={styles.planDesc} numberOfLines={1}>{item.description}</Text>
                <Text style={styles.planMeta}>Week {item.weekNumber} • {item.resourcesCount} resources</Text>
              </View>
              <ArrowRight color={COLORS.textMuted} size={20} />
            </TouchableOpacity>
          );
        })
      ) : (
        <View style={styles.emptyPlan}>
          <CheckCircle color={COLORS.textMuted} size={28} />
          <Text style={styles.emptyPlanText}>No tasks active today</Text>
        </View>
      )}
      
      {/* Footer spacer */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2ff' },
  content: {
    paddingHorizontal: Platform.OS === 'web' ? 32 : 16,
    paddingTop: Platform.OS === 'web' ? 28 : 50,
    paddingBottom: 40,
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'center',
    maxWidth: Platform.OS === 'web' ? 1200 : undefined,
    alignSelf: 'center',
    width: '100%',
  },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: 20 },
  greeting: { fontSize: 14, color: COLORS.textMuted, fontWeight: '500' },
  userName: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  tagline: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: '#fed7aa', gap: 4 },
  streakChipText: { color: '#ea580c', fontWeight: '700', fontSize: 13 },
  bellBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  bellDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1.5, borderColor: '#fff' },

  // Hero card
  heroCard: { width: '100%', backgroundColor: '#4f46e5', borderRadius: 24, padding: 30, marginBottom: 16, overflow: 'hidden', ...SHADOWS.glow, alignItems: 'center' },
  blobTL: { position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' },
  blobBR: { position: 'absolute', bottom: -40, right: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.06)' },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  heroLeft: { alignItems: 'center', marginRight: 40 },
  heroPreTitle: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 16, marginBottom: 16 },
  heroRight: { flex: 1, alignItems: 'flex-start' },
  heroRightTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  heroRightDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
  heroBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Upload button
  uploadMainBtn: { width: '100%', backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 20, ...SHADOWS.glow },
  uploadMainBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Strengths / Weaknesses
  swGrid: { flexDirection: 'row', width: '100%', gap: 16, marginBottom: 20 },
  swCard: { flex: 1, borderRadius: 16, padding: 16, borderWidth: 1, ...SHADOWS.default },
  swTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  swItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  swItemText: { fontSize: 13, fontWeight: '600', flex: 1 },

  // Diagnostic banner
  diagBanner: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fffbeb', padding: 14, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#fde68a' },
  diagIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center' },
  diagTitle: { color: '#92400e', fontWeight: '700', fontSize: 14 },
  diagDesc: { color: '#b45309', fontSize: 12, marginTop: 2 },

  // AI card
  aiCard: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e9d5ff', ...SHADOWS.default },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  aiIconWrap: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center' },
  aiCardTitle: { fontSize: 15, fontWeight: '700', color: '#5b21b6', flex: 1 },
  aiBadge: { backgroundColor: '#d1fae5', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
  aiBadgeText: { color: '#065f46', fontSize: 10, fontWeight: '700' },
  aiRecRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  aiRecDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#a855f7', marginTop: 5 },
  aiRecText: { color: '#5b21b6', fontSize: 13, lineHeight: 19, flex: 1 },

  // Section headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },

  // Plan cards
  planCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 10, width: '100%', borderWidth: 1, borderColor: '#e2e8f0', gap: 12, ...SHADOWS.default },
  planAccent: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  planInfo: { flex: 1 },
  planTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  planSubtopic: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1 },
  planBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 20 },
  planBadgeText: { fontSize: 10, fontWeight: '700' },
  planDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  planMeta: { fontSize: 11, color: COLORS.primary, marginTop: 3, fontWeight: '500' },

  // Empty plan
  emptyPlan: { width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  emptyPlanText: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted, marginTop: 10 },

  // Chart
  chartCard: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0', ...SHADOWS.default },
});

// ─── Bar chart sub-styles ────────────────────────────────────────────────────
const chart = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 130, gap: 4, marginTop: 8 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  barBg: { flex: 1, width: '100%', backgroundColor: '#f1f5f9', borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', backgroundColor: '#c7d2fe', borderRadius: 8 },
  label: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  valLabel: { fontSize: 10, color: '#6366f1', fontWeight: '700', marginBottom: 2 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statChip: { flex: 1, backgroundColor: '#f5f3ff', borderRadius: 12, padding: 10, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#4f46e5' },
  statLabel: { fontSize: 10, color: '#7c3aed', fontWeight: '500', textAlign: 'center', marginTop: 2 },
  emptyWrap: { alignItems: 'center', paddingVertical: 8 },
  emptyText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  emptyHint: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, textAlign: 'center' },
});

export default StudentDashboardScreen;
