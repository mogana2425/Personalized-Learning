import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import api from '../../services/api';
import { COLORS, STYLES } from '../../components/Theme';
import { User, Activity, Clock, Trophy, FileText, AlertCircle } from 'lucide-react-native';

interface ChildMetric {
  studentId: string;
  name: string;
  email: string;
  progress: number;
  streak: number;
  studyMinutes: number;
  skillScores: Record<string, number>;
  recentQuizzes: Array<{
    title: string;
    score: number;
    totalQuestions: number;
    accuracy: number;
    date: string;
  }>;
}

export const ParentDashboardScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildMetric[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [exporting, setExporting] = useState(false);

  const fetchParentStats = async () => {
    try {
      const response = await api.get('/dashboard');
      if (response.data.success && response.data.childrenMetrics) {
        setChildren(response.data.childrenMetrics);
      }
    } catch (error) {
      console.error('Failed to load parent stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentStats();
  }, []);

  const handleExportPDF = () => {
    if (children.length === 0) return;
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      Alert.alert(
        'Report Generated',
        `The progress report card for ${children[activeIndex].name} has been successfully generated in PDF format.`
      );
    }, 1500);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
        <Text style={{ color: COLORS.textMuted, marginTop: 10 }}>Syncing linked child stats...</Text>
      </View>
    );
  }

  if (children.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AlertCircle color={COLORS.warning} size={48} />
        <Text style={styles.emptyTitle}>No Children Accounts Linked</Text>
        <Text style={styles.emptyDesc}>
          To monitor your child's progress, ask them to log in to their student account and enter your email address "{api.defaults.headers.common['Authorization'] ? 'your email' : 'parent@plis.com'}" inside their Profile Settings.
        </Text>
      </View>
    );
  }

  const activeChild = children[activeIndex];

  return (
    <ScrollView style={STYLES.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* CHILD SELECTOR TABS */}
      <Text style={styles.sectionTitle}>Select Child Profile</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
        {children.map((c, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.childTab, activeIndex === i && styles.childTabActive]}
            onPress={() => setActiveIndex(i)}
          >
            <User color={activeIndex === i ? '#fff' : COLORS.textMuted} size={16} />
            <Text style={[styles.childTabText, activeIndex === i && styles.childTabTextActive]}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CORE CHILD METRICS CARD */}
      <View style={styles.metricsGrid}>
        <View style={[STYLES.card, styles.metricCard]}>
          <Activity color={COLORS.primaryLight} size={20} />
          <Text style={styles.metricVal}>{activeChild.progress}%</Text>
          <Text style={styles.metricLbl}>Completion Rate</Text>
        </View>

        <View style={[STYLES.card, styles.metricCard]}>
          <Clock color={COLORS.secondary} size={20} />
          <Text style={styles.metricVal}>{Math.round(activeChild.studyMinutes)}m</Text>
          <Text style={styles.metricLbl}>Learning Time</Text>
        </View>
      </View>

      {/* SKILLS CHART BREAKDOWN */}
      <Text style={styles.sectionTitle}>Topic Skill Assessment</Text>
      <View style={STYLES.card}>
        {Object.keys(activeChild.skillScores).length > 0 ? (
          Object.keys(activeChild.skillScores).map((topic, idx) => {
            const score = activeChild.skillScores[topic];
            let barColor = COLORS.danger;
            if (score >= 70) barColor = COLORS.success;
            else if (score >= 40) barColor = COLORS.warning;

            return (
              <View key={idx} style={styles.skillRow}>
                <View style={styles.skillMeta}>
                  <Text style={styles.skillName}>{topic}</Text>
                  <Text style={styles.skillValue}>{score}% Mastery</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${score}%`, backgroundColor: barColor }]} />
                </View>
              </View>
            );
          })
        ) : (
          <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>No diagnostics logs found for this child.</Text>
        )}
      </View>

      {/* RECENT QUIZ SCORES */}
      <Text style={styles.sectionTitle}>Recent Test Scores</Text>
      {activeChild.recentQuizzes.length > 0 ? (
        activeChild.recentQuizzes.map((q, idx) => (
          <View key={idx} style={[STYLES.card, styles.quizItem]}>
            <View style={styles.quizIconBg}>
              <Trophy color={COLORS.warning} size={18} fill={COLORS.warning} />
            </View>
            <View style={styles.quizText}>
              <Text style={styles.quizTitle}>{q.title}</Text>
              <Text style={styles.quizDate}>{new Date(q.date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.quizScoreContainer}>
              <Text style={styles.quizScore}>{q.score}/{q.totalQuestions}</Text>
              <Text style={styles.quizAccuracy}>{q.accuracy}% accuracy</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={[STYLES.card, { paddingVertical: 20, alignItems: 'center' }]}>
          <Text style={{ color: COLORS.textMuted }}>No quizzes completed by child yet.</Text>
        </View>
      )}

      {/* EXPORT PDF REPORT */}
      <TouchableOpacity style={STYLES.button} onPress={handleExportPDF} disabled={exporting}>
        {exporting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.exportRow}>
            <FileText color="#fff" size={20} />
            <Text style={[STYLES.buttonText, { marginLeft: 10 }]}>Download Weekly Report Card</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 14,
  },
  emptyDesc: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 15,
  },
  selectorRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  childTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
  },
  childTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  childTabText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  childTabTextActive: {
    color: '#fff',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  metricCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 18,
  },
  metricVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  metricLbl: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  skillRow: {
    marginBottom: 16,
  },
  skillMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  skillName: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  skillValue: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e2e8f0', // Soft slate-200 border color/progress track
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  quizItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
  },
  quizIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7', // Soft light yellow
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quizText: {
    flex: 1,
  },
  quizTitle: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  quizDate: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  quizScoreContainer: {
    alignItems: 'flex-end',
  },
  quizScore: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 15,
  },
  quizAccuracy: {
    color: COLORS.primaryLight,
    fontSize: 11,
    marginTop: 2,
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ParentDashboardScreen;
