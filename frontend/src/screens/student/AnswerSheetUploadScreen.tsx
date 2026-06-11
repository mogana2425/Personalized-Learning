import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Modal, TextInput, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../services/api';
import { COLORS, STYLES, SHADOWS } from '../../components/Theme';
import { Upload, Camera, FileText, CheckCircle2, ChevronRight, X, Sparkles, ChevronDown } from 'lucide-react-native';

const SUBJECTS_DATA: Record<string, string[]> = {
  "Mathematics": ["Algebra", "Geometry", "Trigonometry", "Calculus", "Probability"],
  "Physics": ["Motion", "Force", "Energy", "Electricity"],
  "Chemistry": ["Atoms", "Chemical Reactions", "Acids and Bases"],
  "Biology": ["Cells", "Genetics", "Evolution"],
  "English": ["Grammar", "Literature", "Writing"],
  "Computer Science": ["Programming", "Data Structures", "Algorithms"]
};
const SUBJECT_OPTIONS = Object.keys(SUBJECTS_DATA);

interface EvaluationReport {
  score: number;
  totalMarks: number;
  conceptUnderstanding: string;
  mistakes: string[];
  suggestions: string[];
  feedback: string;
}

export const AnswerSheetUploadScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('Algebra');

  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showTopicPicker, setShowTopicPicker] = useState(false);

  useEffect(() => {
    const loadSavedSelections = async () => {
      try {
        const savedSubject = await AsyncStorage.getItem('lastSelectedSubject');
        const savedTopic = await AsyncStorage.getItem('lastSelectedTopic');
        if (savedSubject && SUBJECT_OPTIONS.includes(savedSubject)) {
          setSubject(savedSubject);
          if (savedTopic && SUBJECTS_DATA[savedSubject].includes(savedTopic)) {
            setTopic(savedTopic);
          } else {
            setTopic(SUBJECTS_DATA[savedSubject][0] || '');
          }
        } else {
          setSubject('Mathematics');
          setTopic('Algebra');
        }
      } catch (err) {}
    };
    loadSavedSelections();
  }, []);

  const handleSubjectSelect = (sub: string) => {
    setSubject(sub);
    const newTopic = SUBJECTS_DATA[sub][0] || '';
    setTopic(newTopic);
    setShowSubjectPicker(false);
    AsyncStorage.setItem('lastSelectedSubject', sub);
    AsyncStorage.setItem('lastSelectedTopic', newTopic);
  };

  const handleTopicSelect = (top: string) => {
    setTopic(top);
    setShowTopicPicker(false);
    AsyncStorage.setItem('lastSelectedTopic', top);
  };
  
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [webFile, setWebFile] = useState<File | null>(null);

  // Processing state stages
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'uploading' | 'ocr' | 'ai' | 'path' | 'done' | 'error'>('uploading');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Timer refs for cleanup
  const timerRefs = React.useRef<NodeJS.Timeout[]>([]);

  // Evaluation modal and success state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    return () => {
      timerRefs.current.forEach(clearTimeout);
    };
  }, []);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFileUri(file.uri);
        setFileName(file.name);
        setFileType(file.mimeType || 'application/pdf');
        if (Platform.OS === 'web' && file.file) {
          setWebFile(file.file);
        }
      }
    } catch (err) {
      console.warn('Document picker error:', err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera permissions are required to take photos of answer sheets.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        setFileUri(image.uri);
        const nameSuffix = Date.now().toString().slice(-6);
        setFileName(`scan_sheet_${nameSuffix}.jpg`);
        setFileType('image/jpeg');
        if (Platform.OS === 'web') {
          // fetch blob from uri for web camera
          fetch(image.uri).then(r => r.blob()).then(blob => {
             const f = new File([blob], `scan_sheet_${nameSuffix}.jpg`, { type: 'image/jpeg' });
             setWebFile(f);
          });
        }
      }
    } catch (err) {
      console.warn('Camera capture error:', err);
    }
  };

  const handleProcessSheet = async () => {
    if (!fileUri) {
      Alert.alert('Validation Error', 'Please select or capture a sheet first.');
      return;
    }
    if (!subject || !topic) {
      Alert.alert('Validation Error', 'Please select a Subject and Chapter.');
      return;
    }

    setLoading(true);
    setStage('uploading');
    setErrorMessage('');
    
    // Clear old timers
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];

    try {
      const formData = new FormData();
      // Format file for multipart upload compatibility in react-native
      if (Platform.OS === 'web' && webFile) {
        formData.append('file', webFile);
      } else {
        formData.append('file', {
          uri: fileUri,
          name: fileName,
          type: fileType,
        } as any);
      }
      formData.append('subject', subject);
      formData.append('topic', topic);

      // Transition animation simulation for OCR, AI, and Path stages
      timerRefs.current.push(setTimeout(() => setStage('ocr'), 2500));
      timerRefs.current.push(setTimeout(() => setStage('ai'), 6000));
      timerRefs.current.push(setTimeout(() => setStage('path'), 9500));

      const response = await api.post('/upload/answer-sheet', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        setStage('done');
        setReportData(response.data);
        timerRefs.current.push(setTimeout(() => {
          setLoading(false);
          setShowSuccessModal(true);
        }, 1000));
      } else {
        throw new Error(response.data?.message || 'Upload succeeded but grading failed.');
      }
    } catch (error: any) {
      timerRefs.current.forEach(clearTimeout);
      setStage('error');
      setErrorMessage(error.response?.data?.message || error.message || 'Answer sheet grading failed. Try again.');
    }
  };

  return (
    <ScrollView style={STYLES.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Pick Card */}
      <View style={[STYLES.card, { marginTop: 15 }]}>
        <Text style={[STYLES.title, { fontSize: 16, marginBottom: 15 }]}>Upload Assessment Sheet</Text>
        
        {fileUri ? (
          <View style={styles.previewContainer}>
            {fileType.startsWith('image') ? (
              <Image source={{ uri: fileUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.pdfIconPlaceholder}>
                <FileText color={COLORS.primaryLight} size={48} />
              </View>
            )}
            <Text style={styles.previewName} numberOfLines={1}>{fileName}</Text>
            <TouchableOpacity style={styles.clearBtn} onPress={() => { setFileUri(null); setWebFile(null); }}>
              <X color={COLORS.danger} size={18} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadRow}>
            <TouchableOpacity style={styles.pickerSquare} onPress={handlePickDocument}>
              <Upload color={COLORS.primaryLight} size={28} />
              <Text style={styles.pickerLabel}>Browse PDF / Images</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.pickerSquare} onPress={handleTakePhoto}>
              <Camera color={COLORS.secondary} size={28} />
              <Text style={styles.pickerLabel}>Take Photo Scanner</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center' }]}>
            <View style={styles.successIconContainer}>
              <CheckCircle2 color={COLORS.success} size={48} />
            </View>
            <Text style={styles.modalTitle}>Analysis Completed Successfully!</Text>
            <Text style={styles.modalSubtitle}>Your assessment has been evaluated and a personalized learning path has been generated.</Text>

            {reportData?.answerSheet?.evaluation && (
              <View style={styles.scorePill}>
                <Text style={styles.scorePillText}>
                  Score: {reportData.answerSheet.evaluation.score} / {reportData.answerSheet.evaluation.totalMarks}
                </Text>
              </View>
            )}

            <View style={{ width: '100%', marginTop: 20 }}>
              <TouchableOpacity 
                style={[STYLES.button, { marginBottom: 12 }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.navigate('AnalysisReport', { reportData });
                }}
              >
                <Text style={STYLES.buttonText}>View Full Report</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[STYLES.button, { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  setFileUri(null);
                  setFileName('');
                  setReportData(null);
                }}
              >
                <Text style={[STYLES.buttonText, { color: COLORS.text }]}>Upload Another Sheet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Processing Pipeline Modal */}
      <View style={STYLES.card}>
        <Text style={STYLES.inputLabel}>Subject</Text>
        <TouchableOpacity 
          style={[STYLES.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
          onPress={() => setShowSubjectPicker(true)}
        >
          <Text style={{ color: subject ? COLORS.text : COLORS.textMuted }}>{subject || 'Select Subject'}</Text>
          <ChevronDown color={COLORS.textMuted} size={20} />
        </TouchableOpacity>

        <Text style={STYLES.inputLabel}>Assignment Topic / Chapter</Text>
        <TouchableOpacity 
          style={[STYLES.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
          onPress={() => setShowTopicPicker(true)}
        >
          <Text style={{ color: topic ? COLORS.text : COLORS.textMuted }}>{topic || 'Select Chapter'}</Text>
          <ChevronDown color={COLORS.textMuted} size={20} />
        </TouchableOpacity>
      </View>

      {/* Subject Picker Modal */}
      <Modal visible={showSubjectPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setShowSubjectPicker(false)}>
          <View style={styles.dropdownContent}>
            <Text style={styles.dropdownTitle}>Select Subject</Text>
            <ScrollView>
              {SUBJECT_OPTIONS.map((sub, idx) => (
                <TouchableOpacity key={idx} style={styles.dropdownOption} onPress={() => handleSubjectSelect(sub)}>
                  <Text style={[styles.dropdownOptionText, subject === sub && { color: COLORS.primary, fontWeight: 'bold' }]}>{sub}</Text>
                  {subject === sub && <CheckCircle2 color={COLORS.primary} size={18} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Topic Picker Modal */}
      <Modal visible={showTopicPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setShowTopicPicker(false)}>
          <View style={styles.dropdownContent}>
            <Text style={styles.dropdownTitle}>Select Chapter</Text>
            <ScrollView>
              {SUBJECTS_DATA[subject]?.map((top, idx) => (
                <TouchableOpacity key={idx} style={styles.dropdownOption} onPress={() => handleTopicSelect(top)}>
                  <Text style={[styles.dropdownOptionText, topic === top && { color: COLORS.primary, fontWeight: 'bold' }]}>{top}</Text>
                  {topic === top && <CheckCircle2 color={COLORS.primary} size={18} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <TouchableOpacity
        style={[STYLES.button, !fileUri && { opacity: 0.5 }]}
        onPress={handleProcessSheet}
        disabled={!fileUri || loading}
      >
        <Text style={STYLES.buttonText}>Submit for Grading</Text>
      </TouchableOpacity>

      {/* GRADIENT PIPELINE PROCESS OVERLAY */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.pipelineBg}>
          <View style={[STYLES.card, styles.pipelineCard]}>
            {stage === 'error' ? (
              <X color={COLORS.danger} size={48} />
            ) : (
              <ActivityIndicator size="large" color={COLORS.primaryLight} />
            )}
            
            <Text style={styles.pipelineHeader}>
              {stage === 'error' ? 'Analysis Failed' : 'Analyzing Answer Sheet'}
            </Text>

            {stage === 'error' ? (
              <View style={{ width: '100%', alignItems: 'center' }}>
                <Text style={{ color: COLORS.danger, textAlign: 'center', marginVertical: 15, paddingHorizontal: 10 }}>
                  {errorMessage}
                </Text>
                <TouchableOpacity style={[STYLES.button, { width: '100%' }]} onPress={() => setLoading(false)}>
                  <Text style={STYLES.buttonText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.stagesBox}>
                <View style={styles.stageRow}>
                  <CheckCircle2 color={stage !== 'uploading' ? COLORS.success : COLORS.textMuted} size={18} />
                  <Text style={[styles.stageText, stage === 'uploading' && styles.stageTextActive]}>
                    Uploading worksheet files
                  </Text>
                </View>
                <View style={styles.stageRow}>
                  <CheckCircle2 color={stage === 'ai' || stage === 'path' || stage === 'done' ? COLORS.success : COLORS.textMuted} size={18} />
                  <Text style={[styles.stageText, stage === 'ocr' && styles.stageTextActive]}>
                    OCR reading handwritten text
                  </Text>
                </View>
                <View style={styles.stageRow}>
                  <CheckCircle2 color={stage === 'path' || stage === 'done' ? COLORS.success : COLORS.textMuted} size={18} />
                  <Text style={[styles.stageText, stage === 'ai' && styles.stageTextActive]}>
                    Gemini grading steps and concepts
                  </Text>
                </View>
                <View style={styles.stageRow}>
                  <CheckCircle2 color={stage === 'done' ? COLORS.success : COLORS.textMuted} size={18} />
                  <Text style={[styles.stageText, stage === 'path' && styles.stageTextActive]}>
                    Generating personalized learning path
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>


  );
};

const styles = StyleSheet.create({
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  pickerSquare: {
    width: '48%',
    height: 110,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  pickerLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  previewContainer: {
    position: 'relative',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  pdfIconPlaceholder: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewName: {
    color: COLORS.text,
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  clearBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipelineBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pipelineCard: {
    width: '90%',
    padding: 24,
    alignItems: 'center',
  },
  pipelineHeader: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  stagesBox: {
    width: '100%',
    marginTop: 10,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stageText: {
    color: COLORS.textMuted,
    marginLeft: 12,
    fontSize: 14,
  },
  stageTextActive: {
    color: COLORS.primaryLight,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '95%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: 'System',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontFamily: 'System',
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 22,
    marginBottom: 20,
  },
  scorePill: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  scorePillText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dropdownContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.text,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: COLORS.text,
  },
});

export default AnswerSheetUploadScreen;
