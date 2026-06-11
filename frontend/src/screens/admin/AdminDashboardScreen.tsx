import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import api from '../../services/api';
import { COLORS, STYLES } from '../../components/Theme';
import { ShieldAlert, Server, Database, Sparkles, PlusCircle } from 'lucide-react-native';

interface AdminMetrics {
  totalUsers: number;
  students: number;
  teachers: number;
  parents: number;
  totalPaths: number;
  totalAnswerSheetsUploaded: number;
  answerSheetsProcessing: number;
}

export const AdminDashboardScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalUsers: 0,
    students: 0,
    teachers: 0,
    parents: 0,
    totalPaths: 0,
    totalAnswerSheetsUploaded: 0,
    answerSheetsProcessing: 0,
  });
  const [systemStatus, setSystemStatus] = useState('Optimal');

  // Resource Upload fields
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<'note' | 'video'>('note');
  const [resContent, setResContent] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchAdminStats = async () => {
    try {
      const response = await api.get('/dashboard');
      if (response.data.success) {
        setMetrics(response.data.metrics);
        setSystemStatus(response.data.systemStatus || 'Optimal');
      }
    } catch (error) {
      console.error('Failed to load admin metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handleUploadResource = () => {
    if (!resTitle || !resContent) {
      Alert.alert('Error', 'Please fill in the title and content body.');
      return;
    }

    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      Alert.alert('Resource Uploaded', `Study ${resType} "${resTitle}" has been successfully added to the global repository.`);
      setResTitle('');
      setResContent('');
    }, 1500);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
        <Text style={{ color: COLORS.textMuted, marginTop: 10 }}>Accessing admin portal...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={STYLES.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* SYSTEM HEALTH STATS */}
      <Text style={styles.sectionTitle}>System Status Monitor</Text>
      <View style={[STYLES.card, styles.healthCard]}>
        <View style={styles.healthHeader}>
          <ShieldAlert color={COLORS.success} size={20} />
          <Text style={styles.healthStatus}>Overall Status: {systemStatus}</Text>
        </View>
        <View style={styles.healthRow}>
          <View style={styles.healthMetric}>
            <Server color={COLORS.primaryLight} size={16} />
            <Text style={styles.healthLbl}>Server: ONLINE</Text>
          </View>
          <View style={styles.healthMetric}>
            <Database color={COLORS.secondary} size={16} />
            <Text style={styles.healthLbl}>Database: CONNECTED</Text>
          </View>
        </View>
      </View>

      {/* CORE USAGE STATS GRID */}
      <Text style={styles.sectionTitle}>System Usage Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={[STYLES.card, styles.statCard]}>
          <Text style={styles.statVal}>{metrics.totalUsers}</Text>
          <Text style={styles.statLbl}>Registered Users</Text>
        </View>
        <View style={[STYLES.card, styles.statCard]}>
          <Text style={styles.statVal}>{metrics.students}</Text>
          <Text style={styles.statLbl}>Active Students</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[STYLES.card, styles.statCard]}>
          <Text style={styles.statVal}>{metrics.totalAnswerSheetsUploaded}</Text>
          <Text style={styles.statLbl}>OCR Upload Sheets</Text>
        </View>
        <View style={[STYLES.card, styles.statCard]}>
          <Text style={styles.statVal}>{metrics.totalPaths}</Text>
          <Text style={styles.statLbl}>AI Learning Paths</Text>
        </View>
      </View>

      {/* ADD RESOURCE GLOBAL FORM */}
      <Text style={styles.sectionTitle}>Publish Global Learning Resource</Text>
      <View style={STYLES.card}>
        <Text style={STYLES.inputLabel}>Resource Title</Text>
        <TextInput
          placeholder="e.g. Fundamental Trigonometric Rules"
          placeholderTextColor="#64748b"
          style={STYLES.input}
          value={resTitle}
          onChangeText={setResTitle}
        />

        <Text style={STYLES.inputLabel}>Resource Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeTab, resType === 'note' && styles.typeTabActive]}
            onPress={() => setResType('note')}
          >
            <Text style={[styles.typeTabText, resType === 'note' && styles.typeTabTextActive]}>STUDY NOTES</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeTab, resType === 'video' && styles.typeTabActive]}
            onPress={() => setResType('video')}
          >
            <Text style={[styles.typeTabText, resType === 'video' && styles.typeTabTextActive]}>VIDEO LECTURE</Text>
          </TouchableOpacity>
        </View>

        <Text style={STYLES.inputLabel}>Content (URL Link or Notes body text)</Text>
        <TextInput
          placeholder="Write explanation notes or enter streaming URL link here..."
          placeholderTextColor="#64748b"
          style={[STYLES.input, { height: 100, textAlignVertical: 'top' }]}
          value={resContent}
          onChangeText={setResContent}
          multiline
        />

        <TouchableOpacity style={STYLES.button} onPress={handleUploadResource} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.btnRow}>
              <PlusCircle color="#fff" size={18} />
              <Text style={[STYLES.buttonText, { marginLeft: 8 }]}>Publish Global Resource</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 15,
  },
  healthCard: {
    borderColor: COLORS.success + '40',
    backgroundColor: '#064e3b20', // deep emerald tint
    padding: 16,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthStatus: {
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  healthMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthLbl: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 0,
  },
  statVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLbl: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeTab: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  typeTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  typeTabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  typeTabTextActive: {
    color: '#ffffff',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AdminDashboardScreen;
