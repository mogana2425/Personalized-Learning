import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert, Pressable, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { COLORS, STYLES, SHADOWS } from '../../components/Theme';
import { Lock, Play, CheckCircle2, ChevronRight, BookOpen, Video, HelpCircle, ArrowLeft, RefreshCw } from 'lucide-react-native';

interface Resource {
  title: string;
  type: 'note' | 'video' | 'pdf' | 'flashcard';
  contentUrl?: string;
  textContent?: string;
  description?: string;
  estimatedTimeMinutes?: number;
}

interface SubTopic {
  name: string;
  description: string;
  status: 'locked' | 'active' | 'completed';
  resources: Resource[];
  quizId?: string;
}

interface Week {
  weekNumber: number;
  title: string;
  status: 'locked' | 'active' | 'completed';
  subtopics: SubTopic[];
}

interface PathData {
  _id: string;
  subject: string;
  currentWeek: number;
  weeks: Week[];
}

const ALL_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'English', 'History', 'Geography', 'Computer Science',
  'Economics', 'Accounting',
];

export const LearningPathScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [pathData, setPathData] = useState<PathData | null>(null);
  // Subject from navigation params (set by AnalysisReportScreen) or default
  const [subject, setSubject] = useState<string>(
    route?.params?.subject || 'Mathematics'
  );
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState<SubTopic | null>(null);
  const [selectedWeekNum, setSelectedWeekNum] = useState<number | null>(null);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  // Dynamic Generation State
  const [loadingResource, setLoadingResource] = useState(false);
  const [dynamicContent, setDynamicContent] = useState<any>(null);
  const [showQuizView, setShowQuizView] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);

  const fetchPath = async (subjectName?: string) => {
    const s = subjectName || subject;
    setLoading(true);
    try {
      const response = await api.get(`/path?subject=${encodeURIComponent(s)}`);
      if (response.data.success) {
        setPathData(response.data.learningPath);
      }
    } catch (error) {
      console.error('Failed to load learning path:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = async (newSubject: string) => {
    setSubject(newSubject);
    setShowSubjectPicker(false);
    fetchPath(newSubject);
    try {
      await AsyncStorage.setItem('lastLearningSubject', newSubject);
    } catch (e) {}
  };

  const handleRegeneratePath = async () => {
    setRegenerating(true);
    try {
      const response = await api.post('/path/generate', { subject });
      if (response.data.success) {
        setPathData(response.data.learningPath);
        Alert.alert('AI Path Regenerated', `Your ${subject} roadmap has been updated to match your skill profile!`);
      }
    } catch (error) {
      Alert.alert('Generation Error', 'Failed to generate path using Ollama AI API.');
    } finally {
      setRegenerating(false);
    }
  };

  const markCompleted = async (weekNum: number, subtopicName: string) => {
    if (!pathData) return;
    try {
      const response = await api.put('/path/subtopic-status', {
        pathId: pathData._id,
        weekNumber: weekNum,
        subtopicName,
        status: 'completed',
      });
      if (response.data.success) {
        // Optimistically update timeline node locally or refetch
        fetchPath();
        setModalVisible(false);
        Alert.alert('Nice job!', `You completed "${subtopicName}" and earned progress.`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update topic status.');
    }
  };

  // Initial load
  useEffect(() => {
    const loadSubject = async () => {
      // Prioritize route param over saved subject
      if (route?.params?.subject) {
        setSubject(route.params.subject);
        fetchPath(route.params.subject);
        try {
          await AsyncStorage.setItem('lastLearningSubject', route.params.subject);
        } catch (e) {}
      } else {
        try {
          const savedSubject = await AsyncStorage.getItem('lastLearningSubject');
          if (savedSubject) {
            setSubject(savedSubject);
            fetchPath(savedSubject);
          } else {
            fetchPath('Mathematics');
          }
        } catch (e) {
          fetchPath('Mathematics');
        }
      }
    };
    loadSubject();
  }, []);

  // If navigated with a new subject param later, switch to it
  useEffect(() => {
    if (route?.params?.subject && route.params.subject !== subject) {
      setSubject(route.params.subject);
      fetchPath(route.params.subject);
      AsyncStorage.setItem('lastLearningSubject', route.params.subject).catch(() => {});
    }
  }, [route?.params?.subject]);

  const openSubtopic = async (weekNum: number, subtopic: SubTopic) => {
    if (subtopic.status === 'locked') {
      Alert.alert('Module Locked', 'Complete the previous active modules to unlock this week.');
      return;
    }
    setSelectedWeekNum(weekNum);
    setSelectedSubtopic(subtopic);
    setModalVisible(true);
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
    setDynamicContent(null);
    setShowQuizView(false);
    setQuizScore(null);
    setQuizAnswers([]);

    setLoadingResource(true);
    try {
      const response = await api.post('/path/lesson/generate', {
        topic: subtopic.name,
        subject: pathData?.subject || 'Mathematics',
        type: 'comprehensive'
      });

      if (response.data.success) {
         setDynamicContent(response.data.data);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to generate comprehensive lesson content.');
    } finally {
      setLoadingResource(false);
    }
  };

  const parseFlashcards = (text?: string): { q: string; a: string }[] => {
    if (!text) return [];
    // Parses mock Q&A format from string
    const blocks = text.split('\n\n');
    return blocks
      .map((block) => {
        const lines = block.split('\n');
        const qLine = lines.find((l) => l.startsWith('Q:'));
        const aLine = lines.find((l) => l.startsWith('A:'));
        if (qLine && aLine) {
          return {
            q: qLine.replace('Q:', '').trim(),
            a: aLine.replace('A:', '').trim(),
          };
        }
        return null;
      })
      .filter(Boolean) as { q: string; a: string }[];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
        <Text style={styles.loadingText}>Synthesizing personalized timeline...</Text>
      </View>
    );
  }

  return (
    <View style={STYLES.container}>
      {/* Subject Header & Regenerator */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Subject Selector — tap to change */}
          <TouchableOpacity onPress={() => setShowSubjectPicker(!showSubjectPicker)} style={styles.subjectSelector}>
            <Text style={styles.pathSubject}>{subject}</Text>
            <ChevronRight color={COLORS.primary} size={16} style={{ transform: [{ rotate: showSubjectPicker ? '-90deg' : '90deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.pathSubtitle}>Personalized AI Learning Roadmap</Text>
          {showSubjectPicker && (
            <View style={styles.subjectDropdown}>
              {ALL_SUBJECTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.subjectOption, s === subject && styles.subjectOptionActive]}
                  onPress={() => handleSubjectChange(s)}
                >
                  <Text style={[styles.subjectOptionText, s === subject && { color: COLORS.primary, fontWeight: '700' }]}>{s}</Text>
                  {s === subject && <CheckCircle2 color={COLORS.primary} size={14} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.regenBtn} onPress={handleRegeneratePath} disabled={regenerating}>
          {regenerating ? (
            <ActivityIndicator color={COLORS.text} size="small" />
          ) : (
            <RefreshCw color={COLORS.text} size={18} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.timelineScroll}>
        {pathData?.weeks?.map((week, wIdx) => (
          <View key={wIdx} style={styles.weekSection}>
            {/* Week title indicator */}
            <View style={styles.weekHeader}>
              <View style={[styles.weekDot, week.status === 'completed' && styles.weekDotDone]} />
              <Text style={styles.weekTitle}>Week {week.weekNumber}: {week.title}</Text>
            </View>

            {/* Subtopic nodes list */}
            <View style={styles.subtopicsContainer}>
              {/* Timeline draw line */}
              <View style={styles.timelineVerticalLine} />
              
              {week.subtopics.map((sub, sIdx) => {
                let NodeIcon = Lock;
                let nodeColor = COLORS.textMuted;
                if (sub.status === 'active') {
                  NodeIcon = Play;
                  nodeColor = COLORS.primaryLight;
                } else if (sub.status === 'completed') {
                  NodeIcon = CheckCircle2;
                  nodeColor = COLORS.success;
                }

                return (
                  <TouchableOpacity
                    key={sIdx}
                    style={[
                      styles.nodeCard,
                      sub.status === 'active' && styles.nodeCardActive,
                      sub.status === 'completed' && styles.nodeCardDone,
                    ]}
                    onPress={() => openSubtopic(week.weekNumber, sub)}
                  >
                    <View style={[styles.nodeIconBg, { backgroundColor: nodeColor + '20' }]}>
                      <NodeIcon color={nodeColor} size={22} fill={sub.status === 'completed' ? nodeColor : 'transparent'} />
                    </View>
                    <View style={styles.nodeTextContainer}>
                      <Text style={styles.nodeTitle}>{sub.name}</Text>
                      <Text style={styles.nodeDesc} numberOfLines={2}>{sub.description}</Text>
                    </View>
                    <ChevronRight color={COLORS.border} size={20} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* STUDY MATERIAL OVERLAY MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => showQuizView ? setShowQuizView(false) : setModalVisible(false)}>
                <ArrowLeft color={COLORS.text} size={22} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedSubtopic?.name || ''}
              </Text>
              <View style={{ width: 22 }} />
            </View>

            {/* Inner Content depending on selected resource */}
            {loadingResource ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ color: COLORS.textMuted, marginTop: 15 }}>AI is building your comprehensive lesson...</Text>
              </View>
            ) : showQuizView ? (
              // ADAPTIVE QUIZ VIEWER
              <ScrollView style={{ flex: 1, padding: 15 }}>
                {quizScore !== null ? (
                   <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                     <CheckCircle2 color={COLORS.success} size={64} style={{ marginBottom: 20 }} />
                     <Text style={{ fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 }}>Quiz Completed!</Text>
                     <Text style={{ fontSize: 20, color: COLORS.textMuted, marginBottom: 30 }}>Score: {quizScore} / {dynamicContent?.practiceQuestions?.length || 5}</Text>
                     <TouchableOpacity 
                       style={[STYLES.button, { width: '80%' }]} 
                       onPress={() => markCompleted(selectedWeekNum!, selectedSubtopic!.name)}
                     >
                       <Text style={STYLES.buttonText}>Finish & Unlock Next Topic</Text>
                     </TouchableOpacity>
                   </View>
                ) : (
                  <View>
                    <Text style={{ fontSize: 18, color: COLORS.primaryLight, fontWeight: 'bold', marginBottom: 20 }}>
                      Question {flashcardIndex + 1}
                    </Text>
                    <Text style={{ fontSize: 18, color: COLORS.text, fontWeight: '500', marginBottom: 30, lineHeight: 28 }}>
                      {dynamicContent?.practiceQuestions?.[flashcardIndex]?.question || 'Loading question...'}
                    </Text>
                    {dynamicContent?.practiceQuestions?.[flashcardIndex]?.options?.map((opt: string, i: number) => (
                       <TouchableOpacity 
                         key={i} 
                         style={[
                           styles.nodeCard, 
                           { paddingVertical: 18, paddingHorizontal: 20 },
                           quizAnswers[flashcardIndex] === i && { borderColor: COLORS.primary, borderWidth: 2 }
                         ]} 
                         onPress={() => {
                            const newAnswers = [...quizAnswers];
                            newAnswers[flashcardIndex] = i;
                            setQuizAnswers(newAnswers);
                            
                            // Adding a slight delay to allow the user to see their selection
                            setTimeout(() => {
                              if (flashcardIndex < (dynamicContent?.practiceQuestions?.length || 5) - 1) {
                                setFlashcardIndex(flashcardIndex + 1);
                              } else {
                                // Grade the quiz using the correct answers provided by Ollama AI
                                let score = 0;
                                newAnswers.forEach((ans, idx) => {
                                   if (ans === dynamicContent.practiceQuestions[idx].correctAnswerIndex) {
                                     score++;
                                   }
                                });
                                setQuizScore(score);
                              }
                            }, 300);
                         }}
                       >
                         <Text style={{ fontSize: 16, color: COLORS.text }}>{opt}</Text>
                       </TouchableOpacity>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : dynamicContent ? (
              <ScrollView 
                style={{ flex: 1, backgroundColor: COLORS.background }}
                contentContainerStyle={{ padding: 24, paddingBottom: 60, alignItems: 'center' }}
              >
                <View style={{ width: '100%', maxWidth: 800 }}>
                  {/* Header Block */}
                  <Text style={[styles.noteTitle, { fontSize: 22, marginBottom: 20 }]}>{dynamicContent.overview || ''}</Text>
                <View style={{ backgroundColor: COLORS.cardBg, padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border }}>
                  <Text style={{ color: COLORS.primaryLight, fontWeight: 'bold' }}>Why this topic?</Text>
                  <Text style={{ color: COLORS.text, marginTop: 5 }}>{dynamicContent.recommendationReason || ''}</Text>
                </View>

                {/* Objectives */}
                <Text style={styles.weekTitle}>Learning Objectives</Text>
                {dynamicContent.learningObjectives?.map((obj: string, i: number) => (
                  <Text key={i} style={{ color: COLORS.textMuted, marginBottom: 5 }}>• {obj}</Text>
                ))}
                <View style={{ height: 20 }} />

                {/* Concepts */}
                <Text style={styles.weekTitle}>Key Concepts</Text>
                {dynamicContent.keyConcepts?.map((concept: any, i: number) => (
                  <View key={i} style={{ marginBottom: 15 }}>
                    <Text style={{ color: COLORS.text, fontWeight: 'bold' }}>{concept.title || ''}</Text>
                    <Text style={{ color: COLORS.textMuted }}>{concept.explanation || ''}</Text>
                  </View>
                ))}
                
                {/* Notes */}
                <Text style={styles.weekTitle}>Study Notes</Text>
                <Text style={styles.noteBody}>{dynamicContent.studyNotes || ''}</Text>
                <View style={{ height: 20 }} />

                {/* Examples */}
                <Text style={styles.weekTitle}>Worked Examples</Text>
                {dynamicContent.workedExamples?.map((ex: any, i: number) => (
                  <View key={i} style={{ backgroundColor: COLORS.cardBg, padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border }}>
                    <Text style={{ color: COLORS.text, fontWeight: 'bold', marginBottom: 5 }}>Problem:</Text>
                    <Text style={{ color: COLORS.text, marginBottom: 10 }}>{ex.problem}</Text>
                    <Text style={{ color: COLORS.success, fontWeight: 'bold', marginBottom: 5 }}>Solution:</Text>
                    <Text style={{ color: COLORS.textMuted }}>{ex.solution}</Text>
                  </View>
                ))}

                {/* Flashcards */}
                <Text style={styles.weekTitle}>Interactive Flashcards</Text>
                <View style={styles.flashcardContainer}>
                  <Text style={styles.flashcardIndex}>Card {flashcardIndex + 1} of {dynamicContent.flashcards?.length || 1}</Text>
                  
                  <Pressable
                    style={[styles.flashcard, flashcardFlipped ? styles.flashcardBack : styles.flashcardFront]}
                    onPress={() => setFlashcardFlipped(!flashcardFlipped)}
                  >
                    {!flashcardFlipped ? (
                      <View style={styles.flashCardFace}>
                        <Text style={styles.flashcardLabel}>QUESTION</Text>
                        <Text style={styles.flashcardText}>
                          {dynamicContent.flashcards?.[flashcardIndex]?.q || 'No question'}
                        </Text>
                        <Text style={styles.flashcardHint}>Tap to flip</Text>
                      </View>
                    ) : (
                      <View style={styles.flashCardFace}>
                        <Text style={styles.flashcardLabelBack}>ANSWER</Text>
                        <Text style={styles.flashcardTextBack}>
                          {dynamicContent.flashcards?.[flashcardIndex]?.a || 'No answer'}
                        </Text>
                        <Text style={styles.flashcardHint}>Tap to flip back</Text>
                      </View>
                    )}
                  </Pressable>

                  {/* Pagination Buttons */}
                  <View style={styles.flashControls}>
                    <TouchableOpacity
                      style={[styles.flashBtn, flashcardIndex === 0 && styles.flashBtnDisabled]}
                      disabled={flashcardIndex === 0}
                      onPress={() => {
                        setFlashcardIndex(flashcardIndex - 1);
                        setFlashcardFlipped(false);
                      }}
                    >
                      <Text style={styles.flashBtnText}>Prev</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.flashBtn,
                        flashcardIndex === (dynamicContent.flashcards?.length || 1) - 1 && styles.flashBtnDisabled
                      ]}
                      disabled={flashcardIndex === (dynamicContent.flashcards?.length || 1) - 1}
                      onPress={() => {
                        setFlashcardIndex(flashcardIndex + 1);
                        setFlashcardFlipped(false);
                      }}
                    >
                      <Text style={styles.flashBtnText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={{ height: 30 }} />

                {/* External Video Button */}
                {dynamicContent.youtubeSearchQuery && (
                  <TouchableOpacity 
                    style={[STYLES.button, { backgroundColor: '#FF0000', marginBottom: 15 }]} 
                    onPress={() => Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(dynamicContent.youtubeSearchQuery)}`)}
                  >
                    <Video color="#fff" size={20} style={{ marginRight: 8 }} />
                    <Text style={STYLES.buttonText}>Watch Recommended Video</Text>
                  </TouchableOpacity>
                )}

                {/* Ask AI Tutor Integration */}
                <TouchableOpacity 
                  style={[STYLES.button, { backgroundColor: COLORS.primaryLight, marginBottom: 15 }]} 
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('AITutor', { topic: selectedSubtopic?.name });
                  }}
                >
                  <HelpCircle color="#fff" size={20} style={{ marginRight: 8 }} />
                  <Text style={STYLES.buttonText}>Ask AI Tutor about this topic</Text>
                </TouchableOpacity>

                {/* Adaptive Quiz Trigger */}
                <TouchableOpacity 
                  style={[STYLES.button, { backgroundColor: COLORS.primary, marginBottom: 40 }]} 
                  onPress={() => {
                    setFlashcardIndex(0);
                    setShowQuizView(true);
                  }}
                >
                  <CheckCircle2 color="#fff" size={20} style={{ marginRight: 8 }} />
                  <Text style={STYLES.buttonText}>Take Adaptive Quiz</Text>
                </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 15,
    zIndex: 100,
  },
  headerLeft: {
    flex: 1,
    position: 'relative',
  },
  subjectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pathSubject: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  pathSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  subjectDropdown: {
    position: 'absolute',
    top: 36,
    left: 0,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    minWidth: 200,
    zIndex: 999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  subjectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  subjectOptionActive: {
    backgroundColor: COLORS.primary + '15',
  },
  subjectOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  regenBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  timelineScroll: {
    paddingBottom: 40,
  },
  weekSection: {
    marginBottom: 25,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
    marginRight: 12,
  },
  weekDotDone: {
    backgroundColor: COLORS.success,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtopicsContainer: {
    paddingLeft: 5,
    marginLeft: 5,
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.border,
  },
  nodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginLeft: 20,
    marginBottom: 10,
    ...SHADOWS.default,
  },
  nodeCardActive: {
    borderColor: COLORS.primaryLight,
  },
  nodeCardDone: {
    borderColor: COLORS.success + '40',
  },
  nodeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeTextContainer: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 6,
  },
  nodeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  nodeDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderTitle: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  resourceList: {
    padding: 20,
  },
  resourceHelp: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 16,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resItemText: {
    flex: 1,
    marginLeft: 14,
  },
  resItemTitle: {
    color: COLORS.text,
    fontWeight: 'bold',
    fontSize: 15,
  },
  resItemDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  noteViewer: {
    padding: 10,
  },
  noteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  noteBody: {
    fontSize: 15,
    color: COLORS.textMuted,
    lineHeight: 24,
    paddingBottom: 40,
  },
  videoMockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 20,
  },
  videoMockText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  videoMockTitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  flashcardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashcardIndex: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 20,
  },
  flashcard: {
    width: '90%',
    height: 320,
    borderRadius: 20,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  flashcardFront: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  flashcardBack: {
    backgroundColor: '#e0f2fe', // Soft light blue
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  flashCardFace: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flashcardLabel: {
    color: COLORS.primaryLight,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 2,
  },
  flashcardLabelBack: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 2,
  },
  flashcardText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
  flashcardTextBack: {
    color: '#0369a1', // Deep blue for readability
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 26,
  },
  flashcardHint: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  flashControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 30,
  },
  flashBtn: {
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  flashBtnDisabled: {
    opacity: 0.3,
  },
  flashBtnText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
});

export default LearningPathScreen;
