import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { COLORS, STYLES, SHADOWS, GRADIENTS } from '../../components/Theme';
import { Brain, CheckCircle2, AlertCircle, Sparkles, BookOpen, ChevronLeft, ArrowRight, Lightbulb } from 'lucide-react-native';

export const AnalysisReportScreen: React.FC<{ navigation: any, route: any }> = ({ navigation, route }) => {
  // Extract data passed from the upload success modal
  const { reportData } = route.params || {};

  if (!reportData) {
    return (
      <View style={[STYLES.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={STYLES.title}>Report Data Missing</Text>
        <TouchableOpacity style={STYLES.button} onPress={() => navigation.goBack()}>
          <Text style={STYLES.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Inject Print CSS for Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'print-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          @media print {
            /* Hide the sidebar */
            #sidebar { display: none !important; }
            
            /* Expand the main content to fill the screen */
            #main-content { 
              width: 100% !important; 
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
            }

            /* Hide interactive buttons */
            #print-hide { display: none !important; }

            /* Ensure all content is visible and nothing scrolls */
            body, html, #root {
              height: auto !important;
              overflow: visible !important;
              background-color: white !important;
            }

            /* Improve layout of the actual report */
            .css-view-1dbjc4n {
              overflow: visible !important;
            }
          }
        `;
        document.head.appendChild(style);
      }
      
      return () => {
        const style = document.getElementById(styleId);
        if (style) {
          document.head.removeChild(style);
        }
      };
    }
  }, []);

  const { answerSheet, learningPath, recommendations } = reportData;
  const evaluation = answerSheet?.evaluation || {};
  const accuracy = Math.round((evaluation.score / evaluation.totalMarks) * 100) || 0;

  // Determine score color
  const getScoreColor = () => {
    if (accuracy >= 80) return COLORS.success;
    if (accuracy >= 50) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Header Hero Section */}
        <View style={styles.heroSection}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.navigate('Dashboard')}
          >
            <ChevronLeft color={COLORS.primary} size={24} />
          </TouchableOpacity>
          <Brain color={COLORS.primary} size={48} style={{ alignSelf: 'center', marginBottom: 10 }} />
          <Text style={[STYLES.title, { textAlign: 'center', fontSize: 28 }]}>AI Analysis Complete</Text>
          <Text style={[STYLES.subtitle, { textAlign: 'center' }]}>{answerSheet?.subject} • {answerSheet?.topic}</Text>
          
          <View style={[styles.scoreCircle, { borderColor: getScoreColor() }]}>
            <Text style={[styles.scoreText, { color: getScoreColor() }]}>{accuracy}%</Text>
            <Text style={styles.scoreSubText}>{evaluation.score} / {evaluation.totalMarks} Marks</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          
          {/* AI Feedback */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Sparkles color={COLORS.secondary} size={20} />
              <Text style={styles.sectionTitle}>Examiner Feedback</Text>
            </View>
            <Text style={styles.feedbackText}>{evaluation.feedback}</Text>
            {evaluation.conceptUnderstanding && (
              <View style={styles.conceptBox}>
                <Text style={styles.conceptText}>{evaluation.conceptUnderstanding}</Text>
              </View>
            )}
          </View>

          {/* Performance Insights */}
          <View style={styles.insightsGrid}>
            {/* Strengths */}
            <View style={[styles.insightCard, { borderColor: COLORS.success + '40', backgroundColor: COLORS.success + '10' }]}>
              <View style={styles.insightHeader}>
                <CheckCircle2 color={COLORS.success} size={18} />
                <Text style={[styles.insightTitle, { color: COLORS.success }]}>Strengths</Text>
              </View>
              {evaluation.suggestions && evaluation.suggestions.length > 0 ? (
                evaluation.suggestions.slice(0, 2).map((item: string, idx: number) => (
                  <Text key={idx} style={styles.insightItem}>• {item}</Text>
                ))
              ) : (
                <Text style={styles.insightItem}>Good foundational grasp on the topics attempted.</Text>
              )}
            </View>

            {/* Weaknesses */}
            <View style={[styles.insightCard, { borderColor: COLORS.danger + '40', backgroundColor: COLORS.danger + '10' }]}>
              <View style={styles.insightHeader}>
                <AlertCircle color={COLORS.danger} size={18} />
                <Text style={[styles.insightTitle, { color: COLORS.danger }]}>Needs Work</Text>
              </View>
              {evaluation.mistakes && evaluation.mistakes.length > 0 ? (
                evaluation.mistakes.slice(0, 3).map((item: string, idx: number) => (
                  <Text key={idx} style={styles.insightItem}>• {item}</Text>
                ))
              ) : (
                <Text style={styles.insightItem}>Minor calculation errors to watch out for.</Text>
              )}
            </View>
          </View>

          {/* Recommended Topics */}
          {recommendations && recommendations.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Lightbulb color={COLORS.warning} size={20} />
                <Text style={styles.sectionTitle}>Smart Recommendations</Text>
              </View>
              {recommendations.map((rec: string, idx: number) => (
                <View key={idx} style={styles.recItem}>
                  <View style={styles.recBullet} />
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Generated Learning Path Preview */}
          {learningPath && learningPath.weeks && learningPath.weeks.length > 0 && (
            <View style={styles.pathCard}>
              <View style={styles.sectionHeader}>
                <BookOpen color={'#fff'} size={20} />
                <Text style={[styles.sectionTitle, { color: '#fff' }]}>Generated Learning Path</Text>
              </View>
              <Text style={{ color: '#fff', opacity: 0.9, marginBottom: 15, fontFamily: 'System' }}>
                Your customized dynamic roadmap has been updated based on these results.
              </Text>
              
              <View style={styles.weekPreview}>
                <Text style={styles.weekLabel}>UP NEXT: WEEK {learningPath.weeks[0].weekNumber}</Text>
                <Text style={styles.weekTitle}>{learningPath.weeks[0].title}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View nativeID="print-hide">
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={[STYLES.button, { flex: 1, marginRight: 10 }]}
                onPress={() => navigation.navigate('LearningPath', { subject: answerSheet?.subject })}
              >
                <Text style={STYLES.buttonText}>Start Learning Path</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[STYLES.button, { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.primary, flex: 1 }]}
                onPress={() => navigation.navigate('Upload')}
              >
                <Text style={[STYLES.buttonText, { color: COLORS.primary }]}>Upload Another</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[STYLES.button, { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.textMuted, marginTop: 10 }]}
              onPress={() => {
                if (typeof window !== 'undefined' && window.print) {
                  window.print();
                } else {
                  alert('Downloading report...');
                }
              }}
            >
              <Text style={[STYLES.buttonText, { color: COLORS.text }]}>Download PDF Report</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.dashboardLink}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Text style={styles.dashboardLinkText}>Return to Dashboard</Text>
              <ArrowRight color={COLORS.textMuted} size={16} />
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  heroSection: {
    padding: 30,
    paddingTop: 50,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.default,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
    backgroundColor: COLORS.background,
    borderRadius: 50,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: '#ffffff',
    ...SHADOWS.default,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  scoreSubText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontFamily: 'System',
    marginTop: 4,
  },
  sectionCard: {
    ...STYLES.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 8,
    fontFamily: 'System',
  },
  feedbackText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    fontFamily: 'System',
  },
  conceptBox: {
    marginTop: 15,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  conceptText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  insightsGrid: {
    flexDirection: 'column',
    gap: 15,
    marginBottom: 16,
  },
  insightCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: 'System',
  },
  insightItem: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 20,
    fontFamily: 'System',
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.warning,
    marginTop: 8,
    marginRight: 10,
  },
  recText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    flex: 1,
    fontFamily: 'System',
  },
  pathCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...SHADOWS.glow,
  },
  weekPreview: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 15,
    borderRadius: 10,
  },
  weekLabel: {
    color: '#rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  weekTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dashboardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 10,
  },
  dashboardLinkText: {
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  }
});

export default AnalysisReportScreen;
