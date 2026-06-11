import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useDispatch } from 'react-redux';
import { updateSkillScores } from '../../store/authSlice';
import api from '../../services/api';
import { COLORS, STYLES } from '../../components/Theme';
import { ChevronRight, Clock, AlertTriangle, CheckCircle } from 'lucide-react-native';

interface Question {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  topic: string;
}

interface Quiz {
  _id: string;
  title: string;
  subject: string;
  questions: Question[];
  timeLimitMinutes: number;
}

export const AssessmentScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const subject = route.params?.subject || 'Mathematics';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes default

  const timerRef = useRef<any>(null);

  const fetchAssessment = async () => {
    try {
      const response = await api.get(`/quiz/assessment?subject=${subject}`);
      if (response.data.success) {
        setQuiz(response.data.quiz);
        setTimeLeft((response.data.quiz.timeLimitMinutes || 15) * 60);
      }
    } catch (error) {
      console.error('Failed to load assessment test:', error);
      Alert.alert('Network Error', 'Failed to retrieve assessment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (quiz) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            Alert.alert('Time Expired', 'Your quiz has been submitted automatically.', [
              { text: 'OK', onPress: () => forceSubmit() },
            ]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quiz]);

  const forceSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const response = await api.post('/quiz/assessment/submit', {
        quizId: quiz._id,
        answers,
      });

      if (response.data.success) {
        // Save skill scores back into Redux state
        dispatch(updateSkillScores(response.data.skillScores));
        Alert.alert('Test Completed!', 'Your diagnostic profile has been populated.', [
          { text: 'Show My Path', onPress: () => navigation.navigate('Student', { screen: 'MyLearning' }) },
        ]);
      }
    } catch (error) {
      console.error('Submit failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectOption = (optIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentIdx]: optIdx,
    }));
  };

  const handleNext = () => {
    if (quiz && currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = () => {
    if (!quiz) return;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < quiz.questions.length) {
      Alert.alert(
        'Incomplete quiz',
        `You have only answered ${answeredCount}/${quiz.questions.length} questions. Submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: forceSubmit },
        ]
      );
    } else {
      Alert.alert('Ready to submit', 'Submit your assessment to compile results?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', style: 'default', onPress: forceSubmit },
      ]);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
        <Text style={styles.centerText}>Compiling diagnostic sheet...</Text>
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={styles.center}>
        <AlertTriangle color={COLORS.danger} size={36} />
        <Text style={styles.centerText}>No assessment diagnostic test found.</Text>
      </View>
    );
  }

  const activeQuestion = quiz.questions[currentIdx];
  const selectedOpt = answers[currentIdx];

  return (
    <View style={STYLES.container}>
      {/* TIMED HEADLINE BAR */}
      <View style={styles.timerRow}>
        <View style={styles.badge}>
          <Clock color="#cbd5e1" size={16} />
          <Text style={styles.badgeText}>{formatTime(timeLeft)} Min Left</Text>
        </View>
        <Text style={styles.qIndicator}>Q: {currentIdx + 1}/{quiz.questions.length}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Question Topic Card */}
        <View style={styles.topicHeader}>
          <Text style={styles.topicTitle}>{activeQuestion.topic.toUpperCase()}</Text>
        </View>

        {/* Question Text */}
        <Text style={styles.qText}>{activeQuestion.questionText}</Text>

        {/* Option choices */}
        <View style={styles.optionsList}>
          {activeQuestion.options.map((opt, oIdx) => {
            const isSelected = selectedOpt === oIdx;
            return (
              <TouchableOpacity
                key={oIdx}
                style={[styles.optCard, isSelected && styles.optCardSelected]}
                onPress={() => handleSelectOption(oIdx)}
              >
                <View style={[styles.radioDot, isSelected && styles.radioDotSelected]} />
                <Text style={[styles.optText, isSelected && styles.optTextSelected]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Control Buttons */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={[styles.ctrlBtn, currentIdx === 0 && styles.ctrlBtnDisabled]}
          onPress={handlePrev}
          disabled={currentIdx === 0}
        >
          <Text style={styles.ctrlBtnText}>Previous</Text>
        </TouchableOpacity>

        {currentIdx < quiz.questions.length - 1 ? (
          <TouchableOpacity style={styles.ctrlBtn} onPress={handleNext}>
            <Text style={styles.ctrlBtnText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ctrlBtn, { backgroundColor: COLORS.success }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={[styles.ctrlBtnText, { color: '#fff' }]}>Submit Quiz</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    color: COLORS.textMuted,
    marginTop: 12,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  qIndicator: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  topicHeader: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: COLORS.primaryLight,
    marginBottom: 16,
  },
  topicTitle: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  qText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    lineHeight: 26,
    marginBottom: 24,
  },
  optionsList: {
    marginBottom: 30,
  },
  optCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optCardSelected: {
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.primary + '08',
  },
  radioDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    marginRight: 14,
  },
  radioDotSelected: {
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.primaryLight,
  },
  optText: {
    color: COLORS.text,
    fontSize: 15,
  },
  optTextSelected: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ctrlBtn: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    width: '46%',
    alignItems: 'center',
  },
  ctrlBtnDisabled: {
    opacity: 0.2,
  },
  ctrlBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
});

export default AssessmentScreen;
