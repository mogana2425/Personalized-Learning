import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Modal, Platform, KeyboardAvoidingView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import api from '../../services/api';
import { COLORS, STYLES } from '../../components/Theme';
import {
  MessageCircle, ThumbsUp, Plus, X, Search, ChevronDown,
  Send, Clock, ArrowLeft, BookOpen, Award,
} from 'lucide-react-native';

const SUBJECTS = ['All', 'General', 'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography'];

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const avatarColor = (name: string) => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

interface Post {
  _id: string;
  authorName: string;
  title: string;
  body: string;
  subject: string;
  upvotes: number;
  replies: Reply[];
  createdAt: string;
}

interface Reply {
  _id: string;
  authorName: string;
  body: string;
  upvotes: number;
  createdAt: string;
}

export const CommunityScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const user = useSelector((state: RootState) => state.auth.user);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [search, setSearch] = useState('');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  // Selected post for detail view
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // New post modal
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newSubject, setNewSubject] = useState('General');
  const [posting, setPosting] = useState(false);

  const fetchPosts = async () => {
    try {
      const params: any = {};
      if (selectedSubject !== 'All') params.subject = selectedSubject;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/community', { params });
      if (res.data.success) setPosts(res.data.posts);
    } catch (e) {
      console.error('Community fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchPosts(); }, [selectedSubject]));

  const handleSearch = () => { setLoading(true); fetchPosts(); };

  const handlePostQuestion = async () => {
    if (!newTitle.trim() || !newBody.trim()) {
      Alert.alert('Missing Info', 'Please fill in both the title and question details.');
      return;
    }
    setPosting(true);
    try {
      const res = await api.post('/community', {
        title: newTitle.trim(),
        body: newBody.trim(),
        subject: newSubject,
      });
      if (res.data.success) {
        setPosts([res.data.post, ...posts]);
        setNewTitle('');
        setNewBody('');
        setNewSubject('General');
        setShowNewPost(false);
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to post question.');
    } finally {
      setPosting(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    try {
      const res = await api.put(`/community/${postId}/upvote`);
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) => p._id === postId ? { ...p, upvotes: res.data.upvotes } : p)
        );
        if (selectedPost?._id === postId) {
          setSelectedPost((p) => p ? { ...p, upvotes: res.data.upvotes } : p);
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedPost) return;
    setSendingReply(true);
    try {
      const res = await api.post(`/community/${selectedPost._id}/reply`, { body: replyText.trim() });
      if (res.data.success) {
        setSelectedPost(res.data.post);
        setPosts((prev) => prev.map((p) => p._id === selectedPost._id ? res.data.post : p));
        setReplyText('');
      }
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  // ─── POST DETAIL VIEW ────────────────────────────────────────────────────────
  if (selectedPost) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={STYLES.container} contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedPost(null)}
          >
            <ArrowLeft color={COLORS.primary} size={18} />
            <Text style={styles.backBtnText}>Community</Text>
          </TouchableOpacity>

          {/* Post card */}
          <View style={[STYLES.card, { marginTop: 0 }]}>
            <View style={styles.subjectTag}>
              <BookOpen color={COLORS.primaryLight} size={12} />
              <Text style={styles.subjectTagText}>{selectedPost.subject}</Text>
            </View>
            <Text style={styles.postDetailTitle}>{selectedPost.title}</Text>
            <Text style={styles.postDetailBody}>{selectedPost.body}</Text>
            <View style={styles.postMeta}>
              <View style={[styles.authorBadge, { backgroundColor: avatarColor(selectedPost.authorName) }]}>
                <Text style={styles.authorInitial}>{selectedPost.authorName.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.postAuthor}>{selectedPost.authorName}</Text>
              <Clock color={COLORS.textMuted} size={12} />
              <Text style={styles.postTime}>{timeAgo(selectedPost.createdAt)}</Text>
              <TouchableOpacity style={styles.upvoteBtn} onPress={() => handleUpvote(selectedPost._id)}>
                <ThumbsUp color={COLORS.primary} size={14} />
                <Text style={styles.upvoteCount}>{selectedPost.upvotes}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Replies */}
          <Text style={styles.repliesHeader}>
            {selectedPost.replies.length} {selectedPost.replies.length === 1 ? 'Answer' : 'Answers'}
          </Text>

          {selectedPost.replies.length === 0 && (
            <View style={styles.emptyReplies}>
              <Text style={styles.emptyRepliesText}>No answers yet. Be the first to help! 🎓</Text>
            </View>
          )}

          {selectedPost.replies.map((reply, idx) => (
            <View key={reply._id || idx} style={styles.replyCard}>
              <View style={styles.replyHeader}>
                <View style={[styles.authorBadge, { backgroundColor: avatarColor(reply.authorName) }]}>
                  <Text style={styles.authorInitial}>{reply.authorName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.postAuthor}>{reply.authorName}</Text>
                {idx === 0 && (
                  <View style={styles.bestAnswerBadge}>
                    <Award color="#f59e0b" size={10} />
                    <Text style={styles.bestAnswerText}>Top Answer</Text>
                  </View>
                )}
                <Clock color={COLORS.textMuted} size={11} />
                <Text style={styles.postTime}>{timeAgo(reply.createdAt)}</Text>
              </View>
              <Text style={styles.replyBody}>{reply.body}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Reply input */}
        <View style={styles.replyInputBar}>
          <TextInput
            style={styles.replyInput}
            placeholder="Write your answer..."
            placeholderTextColor={COLORS.textMuted}
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !replyText.trim() && { opacity: 0.4 }]}
            onPress={handleSendReply}
            disabled={!replyText.trim() || sendingReply}
          >
            {sendingReply ? <ActivityIndicator color="#fff" size={16} /> : <Send color="#fff" size={16} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ─── MAIN LIST VIEW ──────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={STYLES.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Community Q&A</Text>
            <Text style={styles.headerSub}>Ask, answer, and learn together 🤝</Text>
          </View>
          <TouchableOpacity style={styles.newPostBtn} onPress={() => setShowNewPost(true)}>
            <Plus color="#fff" size={18} />
            <Text style={styles.newPostBtnText}>Ask</Text>
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search color={COLORS.textMuted} size={16} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search questions..."
              placeholderTextColor={COLORS.textMuted}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity style={styles.subjectFilter} onPress={() => setShowSubjectPicker(true)}>
            <Text style={styles.subjectFilterText} numberOfLines={1}>{selectedSubject}</Text>
            <ChevronDown color={COLORS.primary} size={14} />
          </TouchableOpacity>
        </View>

        {/* Stats banner */}
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{posts.length}</Text>
            <Text style={styles.statLbl}>Questions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{posts.reduce((a, p) => a + p.replies.length, 0)}</Text>
            <Text style={styles.statLbl}>Answers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{posts.reduce((a, p) => a + p.upvotes, 0)}</Text>
            <Text style={styles.statLbl}>Upvotes</Text>
          </View>
        </View>

        {/* Post list */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loadingText}>Loading questions...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>No questions yet</Text>
            <Text style={styles.emptyHint}>Be the first to ask something!</Text>
            <TouchableOpacity style={[STYLES.button, { marginTop: 16, paddingHorizontal: 32 }]} onPress={() => setShowNewPost(true)}>
              <Text style={STYLES.buttonText}>Ask a Question</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post) => (
            <View
              key={post._id}
              style={[styles.postCard, post.replies.length === 0 && styles.postCardUnanswered]}
            >
              <TouchableOpacity onPress={() => setSelectedPost(post)} activeOpacity={0.85}>
                <View style={styles.postCardTop}>
                  <View style={[styles.subjectTag, { alignSelf: 'flex-start' }]}>
                    <Text style={styles.subjectTagText}>{post.subject}</Text>
                  </View>
                  {post.replies.length > 0 ? (
                    <View style={styles.answeredBadge}>
                      <Text style={styles.answeredText}>✓ {post.replies.length} {post.replies.length === 1 ? 'Answer' : 'Answers'}</Text>
                    </View>
                  ) : (
                    <View style={styles.needsHelpBadge}>
                      <Text style={styles.needsHelpText}>🙋 Needs Help</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
                <Text style={styles.postBodyPreview} numberOfLines={2}>{post.body}</Text>
              </TouchableOpacity>
              <View style={styles.postFooter}>
                <View style={[styles.authorBadge, { backgroundColor: avatarColor(post.authorName) }]}>
                  <Text style={styles.authorInitial}>{post.authorName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.postAuthor}>{post.authorName}</Text>
                <Text style={styles.dot}>·</Text>
                <Clock color={COLORS.textMuted} size={11} />
                <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity style={styles.upvoteBtn} onPress={() => handleUpvote(post._id)}>
                  <ThumbsUp color={COLORS.primary} size={13} />
                  <Text style={styles.upvoteCount}>{post.upvotes}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.answerBtn} onPress={() => setSelectedPost(post)}>
                  <MessageCircle color="#fff" size={13} />
                  <Text style={styles.answerBtnText}>Answer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ── Subject Picker Modal ── */}
      <Modal visible={showSubjectPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowSubjectPicker(false)}>
          <View style={styles.pickerBox}>
            <Text style={styles.pickerTitle}>Filter by Subject</Text>
            {SUBJECTS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.pickerOption, selectedSubject === s && styles.pickerOptionActive]}
                onPress={() => { setSelectedSubject(s); setShowSubjectPicker(false); setLoading(true); }}
              >
                <Text style={[styles.pickerOptionText, selectedSubject === s && styles.pickerOptionTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── New Post Modal ── */}
      <Modal visible={showNewPost} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.newPostBox}>
              <View style={styles.newPostHeader}>
                <Text style={styles.newPostTitle}>Ask a Question</Text>
                <TouchableOpacity onPress={() => setShowNewPost(false)}>
                  <X color={COLORS.textMuted} size={22} />
                </TouchableOpacity>
              </View>

              <Text style={STYLES.inputLabel}>Subject</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {SUBJECTS.filter((s) => s !== 'All').map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.subjectChip, newSubject === s && styles.subjectChipActive]}
                    onPress={() => setNewSubject(s)}
                  >
                    <Text style={[styles.subjectChipText, newSubject === s && { color: '#fff' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={STYLES.inputLabel}>Question Title</Text>
              <TextInput
                style={STYLES.input}
                placeholder="What do you want to know?"
                placeholderTextColor={COLORS.textMuted}
                value={newTitle}
                onChangeText={setNewTitle}
                maxLength={200}
              />

              <Text style={STYLES.inputLabel}>Details</Text>
              <TextInput
                style={[STYLES.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Describe your question in detail..."
                placeholderTextColor={COLORS.textMuted}
                value={newBody}
                onChangeText={setNewBody}
                multiline
              />

              <TouchableOpacity
                style={[STYLES.button, { marginTop: 8 }]}
                onPress={handlePostQuestion}
                disabled={posting}
              >
                {posting ? <ActivityIndicator color="#fff" /> : <Text style={STYLES.buttonText}>Post Question</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  newPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  newPostBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  subjectFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    maxWidth: 110,
  },
  subjectFilterText: { color: COLORS.primary, fontWeight: '600', fontSize: 13, flex: 1 },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  statLbl: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  postCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  subjectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    marginBottom: 8,
  },
  subjectTagText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  answeredBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  answeredText: { fontSize: 11, fontWeight: '700', color: '#065f46' },
  postTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 6, lineHeight: 21 },
  postBodyPreview: { fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: 12 },
  postFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInitial: { color: '#fff', fontSize: 11, fontWeight: '800' },
  postAuthor: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  dot: { color: COLORS.textMuted, fontSize: 12 },
  postTime: { fontSize: 11, color: COLORS.textMuted },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  upvoteCount: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  replyCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyCountText: { fontSize: 12, color: COLORS.textMuted },
  answerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  answerBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  needsHelpBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  needsHelpText: { fontSize: 11, fontWeight: '700', color: '#92400e' },
  postCardUnanswered: {
    borderColor: '#fde68a',
    borderWidth: 1.5,
    backgroundColor: '#fffdf7',
  },
  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: COLORS.textMuted, fontSize: 14 },
  emptyWrap: { alignItems: 'center', paddingVertical: 50 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptyHint: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  // Detail view
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 14, paddingVertical: 4 },
  backBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 15 },
  postDetailTitle: { fontSize: 19, fontWeight: '800', color: COLORS.text, marginVertical: 10, lineHeight: 27 },
  postDetailBody: { fontSize: 14, color: COLORS.textMuted, lineHeight: 22, marginBottom: 14 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  repliesHeader: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginVertical: 12 },
  replyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  bestAnswerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  bestAnswerText: { fontSize: 10, fontWeight: '700', color: '#b45309' },
  replyBody: { fontSize: 14, color: COLORS.text, lineHeight: 21 },
  emptyReplies: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 16 },
  emptyRepliesText: { color: COLORS.textMuted, fontSize: 14 },
  replyInputBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 12,
    gap: 10,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 360,
  },
  pickerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 14 },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
  },
  pickerOptionActive: { backgroundColor: '#eef2ff' },
  pickerOptionText: { fontSize: 15, color: COLORS.text },
  pickerOptionTextActive: { color: COLORS.primary, fontWeight: '700' },
  newPostBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
  },
  newPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  newPostTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  subjectChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subjectChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  subjectChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
});

export default CommunityScreen;
