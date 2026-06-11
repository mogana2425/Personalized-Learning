import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal } from 'react-native';
import api from '../../services/api';
import { COLORS, STYLES, SHADOWS } from '../../components/Theme';
import { Users, BookOpen, AlertTriangle, Play, Sparkles, User, PlusCircle, X } from 'lucide-react-native';

interface StudentRow {
  _id: string;
  name: string;
  email: string;
  progress: number;
  streak: number;
  quizzesTaken: number;
}

interface AtRiskStudent {
  name: string;
  email: string;
  progress: number;
  lowestScore: number;
}

export const TeacherDashboardScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [classSize, setClassSize] = useState(0);
  const [avgProgress, setAvgProgress] = useState(0);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);

  // Create quiz modal
  const [modalVisible, setModalVisible] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  const fetchTeacherStats = async () => {
    try {
      const response = await api.get('/dashboard');
      if (response.data.success) {
        setClassSize(response.data.classSize);
        setAvgProgress(response.data.classAverageProgress);
        setWeakTopics(response.data.weakTopics);
        setAtRisk(response.data.atRiskStudents);
        setStudents(response.data.studentsList);
      }
    } catch (error) {
      console.error('Failed to load teacher stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherStats();
  }, []);

  const handleCreateQuiz = async () => {
    if (!quizTitle || !quizTopic) {
      Alert.alert('Error', 'Please fill in the quiz title and topic.');
      return;
    }

    setSubmittingQuiz(true);
    try {
      const response = await api.post('/quiz/create', {
        title: quizTitle,
        subject: 'Mathematics',
        topic: quizTopic,
        difficultyLevel: quizDifficulty,
        questions: [
          {
            questionText: `Solve the basic mock ${quizTopic} exercise problem.`,
            options: ['Option 1 (Correct)', 'Option 2', 'Option 3', 'Option 4'],
            correctAnswerIndex: 0,
            topic: quizTopic,
            difficulty: quizDifficulty,
          },
        ],
      });

      if (response.data.success) {
        Alert.alert('Quiz Published', `Quiz "${quizTitle}" has been dispatched to your class roadmap.`);
        setModalVisible(false);
        setQuizTitle('');
        setQuizTopic('');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to publish assignment.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
        <Text style={{ color: COLORS.textMuted, marginTop: 10 }}>Analyzing class statistics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={STYLES.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* KEY CLASS METRICS */}
      <View style={styles.metricsGrid}>
        <View style={[STYLES.card, styles.metricCard]}>
          <Users color={COLORS.primaryLight} size={20} />
          <Text style={styles.metricVal}>{classSize}</Text>
          <Text style={styles.metricLbl}>Students Enrolled</Text>
        </View>

        <View style={[STYLES.card, styles.metricCard]}>
          <BookOpen color={COLORS.success} size={20} />
          <Text style={styles.metricVal}>{avgProgress}%</Text>
          <Text style={styles.metricLbl}>Class Progress Avg</Text>
        </View>
      </View>

      {/* WEAK TOPICS CORNER */}
      <View style={[STYLES.card, styles.insightsCard]}>
        <View style={styles.insightsHeader}>
          <Sparkles color="#7c3aed" size={18} fill="#7c3aed" />
          <Text style={styles.insightsTitle}>AI Classroom Insights</Text>
        </View>
        <Text style={styles.insightsText}>
          {weakTopics.length > 0
            ? `Your class shows learning delays in: "${weakTopics.join(', ')}". We recommend assigning remedial notes.`
            : 'All subtopics are well understood. Student completion is scaling optimally.'}
        </Text>
      </View>

      {/* AT RISK STUDENTS LIST */}
      {atRisk.length > 0 && (
        <View style={[STYLES.card, styles.riskCard]}>
          <View style={styles.riskHeader}>
            <AlertTriangle color={COLORS.danger} size={18} />
            <Text style={styles.riskTitle}>Students At Risk ({atRisk.length})</Text>
          </View>
          {atRisk.map((s, i) => (
            <View key={i} style={styles.riskRow}>
              <Text style={styles.riskName}>{s.name}</Text>
              <Text style={styles.riskDetails}>
                Prog: {s.progress}% • Low Score: {s.lowestScore}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* CLASS ROSTER GRID TABLE */}
      <View style={styles.rosterHeader}>
        <Text style={styles.rosterTitle}>Class Roster</Text>
        <TouchableOpacity style={styles.quizBtn} onPress={() => setModalVisible(true)}>
          <PlusCircle color="#fff" size={16} />
          <Text style={styles.quizBtnText}>Push Quiz</Text>
        </TouchableOpacity>
      </View>

      {students.map((student, idx) => (
        <View key={idx} style={[STYLES.card, styles.studentItem]}>
          <View style={styles.avatar}>
            <User color="#fff" size={16} />
          </View>
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={styles.studentEmail}>{student.email}</Text>
            <Text style={styles.studentMeta}>
              Streak: {student.streak}d • Quizzes Taken: {student.quizzesTaken}
            </Text>
          </View>
          <View style={styles.studentProgress}>
            <Text style={styles.studentProgressVal}>{student.progress}%</Text>
            <Text style={styles.studentProgressLbl}>Progress</Text>
          </View>
        </View>
      ))}

      {/* ADD ASSIGNMENT MODAL FORM */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[STYLES.card, styles.modalContent]}>
            <View style={styles.modalHeader}>
              <Text style={STYLES.title}>Create Quiz</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={COLORS.text} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, marginVertical: 15 }}>
              <Text style={STYLES.inputLabel}>Quiz Title</Text>
              <TextInput
                placeholder="Calculus optimization practice"
                placeholderTextColor="#64748b"
                style={STYLES.input}
                value={quizTitle}
                onChangeText={setQuizTitle}
              />

              <Text style={STYLES.inputLabel}>Topic / Subtopic</Text>
              <TextInput
                placeholder="Calculus"
                placeholderTextColor="#64748b"
                style={STYLES.input}
                value={quizTopic}
                onChangeText={setQuizTopic}
              />

              {/* Difficulty Selection */}
              <Text style={STYLES.inputLabel}>Difficulty Level</Text>
              <View style={styles.diffRow}>
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.diffTab, quizDifficulty === d && styles.diffTabActive]}
                    onPress={() => setQuizDifficulty(d)}
                  >
                    <Text style={[styles.diffText, quizDifficulty === d && styles.diffTextActive]}>
                      {d.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={STYLES.button} onPress={handleCreateQuiz} disabled={submittingQuiz}>
              {submittingQuiz ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={STYLES.buttonText}>Publish to Class Roadmap</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  insightsCard: {
    backgroundColor: '#f3e8ff',
    borderColor: '#e9d5ff',
    borderWidth: 1,
    padding: 16,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightsTitle: {
    color: '#6d28d9',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  insightsText: {
    color: '#5b21b6',
    fontSize: 13,
    lineHeight: 18,
  },
  riskCard: {
    borderColor: '#fca5a5',
    borderWidth: 1,
    backgroundColor: '#fee2e2',
    padding: 16,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  riskTitle: {
    color: '#b91c1c',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#fca5a5',
  },
  riskName: {
    color: '#7f1d1d',
    fontWeight: 'bold',
    fontSize: 13,
  },
  riskDetails: {
    color: '#b91c1c',
    fontSize: 12,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
  },
  rosterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  quizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  quizBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 6,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  studentEmail: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  studentMeta: {
    color: COLORS.primaryLight,
    fontSize: 11,
    marginTop: 4,
  },
  studentProgress: {
    alignItems: 'flex-end',
  },
  studentProgressVal: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 15,
  },
  studentProgressLbl: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '60%',
    padding: 20,
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  diffTab: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  diffTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  diffText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  diffTextActive: {
    color: '#ffffff',
  },
});

export default TeacherDashboardScreen;
