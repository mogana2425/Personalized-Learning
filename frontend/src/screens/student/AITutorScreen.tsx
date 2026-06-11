import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import api from '../../services/api';
import { COLORS, STYLES } from '../../components/Theme';
import { Send, Sparkles, MessageSquare } from 'lucide-react-native';

interface Message {
  role: 'user' | 'model';
  text: string;
}

// ─── Smart Text Renderer ──────────────────────────────────────────────────────
// Renders a message string with bold/highlighted sections and bullet points
const FormattedText: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  const baseColor = isUser ? '#ffffff' : COLORS.text;

  // Split into lines first
  const lines = text.split('\n');

  return (
    <View>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={lineIdx} style={{ height: 6 }} />;

        // Bullet point lines: starts with * or -
        const isBullet = /^[*\-•]/.test(trimmed);
        const bulletContent = isBullet ? trimmed.replace(/^[*\-•]\s*/, '') : trimmed;

        return (
          <View key={lineIdx} style={isBullet ? styles.bulletRow : { marginBottom: 2 }}>
            {isBullet && (
              <Text style={[styles.bulletDot, { color: isUser ? '#fff' : COLORS.primary }]}>•</Text>
            )}
            <Text style={[styles.msgLine, { color: baseColor, flex: isBullet ? 1 : undefined }]}>
              {parseBoldSegments(bulletContent, isUser)}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// Parses **bold** markers into highlighted Text spans
function parseBoldSegments(text: string, isUser: boolean) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      // Bold / highlighted segment
      return (
        <Text
          key={i}
          style={[
            styles.boldText,
            {
              color: isUser ? '#ffe066' : COLORS.primary,
              backgroundColor: isUser ? 'rgba(255,224,102,0.15)' : 'rgba(99,102,241,0.12)',
            },
          ]}
        >
          {part}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export const AITutorScreen: React.FC = () => {
  const WELCOME_TEXT =
    "Hi there! 👋 I'm your friendly AI Teacher!\n\nI'm here to help you understand any topic — step by step, in a fun way! What are we learning today? 🎓";

  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: WELCOME_TEXT },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/tutor/history');
        if (
          response.data.success &&
          response.data.history &&
          response.data.history.length > 0
        ) {
          // Only load valid messages (with role and text)
          const loadedHistory: Message[] = response.data.history
            .filter((m: any) => m.role && m.text && m.text.trim())
            .map((m: any) => ({ role: m.role as 'user' | 'model', text: m.text }));

          if (loadedHistory.length > 0) {
            setMessages(loadedHistory);
          }
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300);
        }
      } catch (error) {
        // Silently fail — show welcome message instead
      }
    };
    fetchHistory();
  }, []);

  const suggestionChips = [
    '👋 Hello!',
    '🔬 How do chemical bonds work?',
    '📐 Explain Limits in Calculus',
    "⚡ What is Newton's First Law?",
    '🧬 Explain cell division',
    '✍️ Help me improve my essay',
    '💻 What is OOP in programming?',
    '🧮 Give me an Algebra problem',
  ];

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg: Message = { role: 'user', text: trimmed };

    // Snapshot current messages BEFORE we update state (for history payload)
    const currentMessages = [...messages];

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Build history from the snapshot: exclude welcome messages, only valid pairs
      const historyPayload = currentMessages
        .filter(
          (m) =>
            m.text &&
            m.text.trim() &&
            !m.text.includes("Hi there! 👋 I'm your friendly AI Teacher") &&
            !m.text.includes('Hi! I am your Personalized AI Tutor')
        )
        .map((m) => ({ role: m.role, text: m.text }));

      const response = await api.post('/tutor/message', {
        message: trimmed,
        history: historyPayload,
      });

      if (response.data.success) {
        const aiMsg: Message = { role: 'model', text: response.data.reply };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('Server returned failure');
      }
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message ||
        "Hmm 🤔 I couldn't reach my brain right now! Please try again in a second.";
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: errMsg },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  const isFirstMessage = messages.length === 1 && messages[0].role === 'model';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={STYLES.container}>
        {/* Chat Scrolling Area */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.chatScroll}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {/* Quick Questions Banner — shown only at first */}
          {isFirstMessage && (
            <View style={styles.helpCard}>
              <View style={styles.helpHeader}>
                <Sparkles color={COLORS.secondary} size={18} fill={COLORS.secondary} />
                <Text style={styles.helpTitle}>Quick Questions — tap to ask!</Text>
              </View>
              <View style={styles.chipsContainer}>
                {suggestionChips.map((chip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.chip}
                    onPress={() => handleSendMessage(chip)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Message Bubbles */}
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={idx}
                style={[
                  styles.bubbleContainer,
                  isUser ? styles.bubbleUser : styles.bubbleAI,
                ]}
              >
                {!isUser && (
                  <View style={styles.tutorAvatar}>
                    <MessageSquare color="#fff" size={14} />
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    isUser ? styles.bubbleBgUser : styles.bubbleBgAI,
                  ]}
                >
                  <FormattedText text={msg.text} isUser={isUser} />
                </View>
              </View>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <View style={[styles.bubbleContainer, styles.bubbleAI]}>
              <View style={styles.tutorAvatar}>
                <MessageSquare color="#fff" size={14} />
              </View>
              <View style={[styles.bubble, styles.bubbleBgAI, styles.typingBubble]}>
                <ActivityIndicator color={COLORS.primary} size="small" />
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Ask AI Tutor anything..."
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            multiline
            onSubmitEditing={() => handleSendMessage(inputText)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => handleSendMessage(inputText)}
            disabled={loading || !inputText.trim()}
            activeOpacity={0.8}
          >
            <Send color="#fff" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  chatScroll: {
    paddingBottom: 24,
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  helpCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 13,
  },
  chipText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '500',
  },
  bubbleContainer: {
    flexDirection: 'row',
    marginBottom: 14,
    maxWidth: '88%',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  bubbleAI: {
    alignSelf: 'flex-start',
  },
  tutorAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexShrink: 1,
  },
  bubbleBgUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleBgAI: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  msgLine: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  bulletDot: {
    fontSize: 16,
    lineHeight: 22,
    marginRight: 6,
    fontWeight: '700',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  typingText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: COLORS.background,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    maxHeight: 100,
    color: COLORS.text,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default AITutorScreen;
