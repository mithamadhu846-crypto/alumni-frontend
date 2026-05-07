// screens/MentorshipScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
  RefreshControl, ActivityIndicator, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { mentorshipAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Avatar, EmptyState } from '../components/UI';
import { Card } from '../components/Card';

export default function MentorshipScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [tab, setTab] = useState(
    user?.role === 'alumni' || user?.role === 'faculty' ? 'received' : 'sent'
  );
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const role = tab === 'received' ? 'mentor' : 'mentee';
      const res = await mentorshipAPI.getMentorships({ role });
      setMentorships(res.data.mentorships || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [tab]);

  const updateStatus = async (id, status) => {
    try {
      await mentorshipAPI.updateStatus(id, { status });
      load();
    } catch {
      Alert.alert('Error', 'Could not update status.');
    }
  };

  const submitReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      await mentorshipAPI.submitReview(reviewModal._id, { rating, review: reviewText });
      setReviewModal(null);
      setRating(5);
      setReviewText('');
      load();
      Alert.alert('Thanks!', 'Your review has been submitted.');
    } catch {
      Alert.alert('Error', 'Could not submit review.');
    } finally { setSubmitting(false); }
  };

  const statusColor = (s) => ({
    pending: '#F59E0B', active: '#10B981', completed: '#3B82F6',
    declined: '#EF4444', cancelled: '#64748B',
  }[s] || '#64748B');

  const renderItem = ({ item }) => {
    const other = tab === 'received' ? item.mentee : item.mentor;
    const isPending = item.status === 'pending';
    const isActive = item.status === 'active';
    const isCompleted = item.status === 'completed';

    return (
      <Card>
        <View style={s.row}>
          <Avatar name={other?.name} uri={other?.avatar} size={46} color="#10B981" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.name}>{other?.name}</Text>
            <Text style={s.role}>{other?.currentRole || other?.department}</Text>
            {item.areas?.length > 0 && (
              <Text style={s.areas}>{item.areas.slice(0, 3).join(' · ')}</Text>
            )}
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusColor(item.status) + '22' }]}>
            <Text style={[s.statusText, { color: statusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>

        {item.message ? (
          <Text style={s.message}>"{item.message}"</Text>
        ) : null}

        <View style={s.actions}>
          {tab === 'received' && isPending && (
            <>
              <TouchableOpacity style={s.acceptBtn} onPress={() => updateStatus(item._id, 'active')}>
                <Ionicons name="checkmark" size={14} color="#10B981" />
                <Text style={s.acceptText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.declineBtn} onPress={() => updateStatus(item._id, 'declined')}>
                <Ionicons name="close" size={14} color="#EF4444" />
                <Text style={s.declineText}>Decline</Text>
              </TouchableOpacity>
            </>
          )}
          {isActive && (
            <TouchableOpacity style={s.completeBtn} onPress={() => updateStatus(item._id, 'completed')}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#3B82F6" />
              <Text style={s.completeText}>Mark Complete</Text>
            </TouchableOpacity>
          )}
          {isCompleted && tab === 'sent' && !item.rating && (
            <TouchableOpacity style={s.reviewBtn} onPress={() => { setReviewModal(item); setRating(5); setReviewText(''); }}>
              <Ionicons name="star-outline" size={14} color="#F59E0B" />
              <Text style={s.reviewText}>Leave Review</Text>
            </TouchableOpacity>
          )}
          {isActive && (
            <TouchableOpacity
              style={s.chatBtn}
              onPress={() => navigation.navigate('Chat', {
                userId: other?._id,
                userName: other?.name,
                userAvatar: other?.avatar,
                userRole: other?.role,
              })}
            >
              <Ionicons name="chatbubble-outline" size={14} color="#60A5FA" />
              <Text style={s.chatText}>Message</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Mentorship</Text>
        {user?.role === 'student' && (
          <TouchableOpacity
            style={s.findBtn}
            onPress={() => navigation.navigate('AlumniDirectory')}
          >
            <Ionicons name="search-outline" size={16} color="#fff" />
            <Text style={s.findBtnText}>Find Mentor</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(user?.role === 'student' ? ['sent'] : ['received', 'sent']).map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tab, tab === t && s.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'received' ? 'Requests Received' : 'My Requests'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={mentorships}
            keyExtractor={m => m._id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); load(); }}
                tintColor="#10B981"
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="people-outline"
                title={tab === 'received' ? 'No requests yet' : 'No mentorships yet'}
                subtitle="Connect with mentors from the alumni directory"
              />
            }
          />
        )
      }

      {/* Review Modal */}
      <Modal
        visible={!!reviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModal(null)}
      >
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Leave a Review</Text>
            <Text style={s.modalSub}>
              Rate your mentorship with {reviewModal?.mentor?.name}
            </Text>

            {/* Star rating */}
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setRating(n)}>
                  <Ionicons
                    name={n <= rating ? 'star' : 'star-outline'}
                    size={34}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={s.reviewInput}
              placeholder="Share your experience with this mentor..."
              placeholderTextColor="#475569"
              value={reviewText}
              onChangeText={setReviewText}
              multiline
            />

            <TouchableOpacity
              style={[s.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={submitReview}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.submitText}>Submit Review</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setReviewModal(null)} style={s.cancelBtn}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#F1F5F9' },
  findBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  findBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#1E2235', borderRadius: 12, padding: 4, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9 },
  tabActive: { backgroundColor: '#0F0F1A' },
  tabText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#F1F5F9', fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  role: { fontSize: 12, color: '#64748B', marginTop: 2 },
  areas: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  message: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginBottom: 10, paddingLeft: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B98122', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  acceptText: { color: '#10B981', fontSize: 12, fontWeight: '700' },
  declineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EF444422', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  declineText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3B82F622', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  completeText: { color: '#3B82F6', fontSize: 12, fontWeight: '700' },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F59E0B22', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  reviewText: { color: '#F59E0B', fontSize: 12, fontWeight: '700' },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3B82F622', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  chatText: { color: '#60A5FA', fontSize: 12, fontWeight: '700' },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#151827', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#F1F5F9', marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#94A3B8', marginBottom: 20 },
  starsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  reviewInput: { backgroundColor: '#1E2235', borderRadius: 10, padding: 14, color: '#F1F5F9', fontSize: 14, height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: '#2D3448', marginBottom: 16 },
  submitBtn: { backgroundColor: '#F59E0B', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelBtn: { alignItems: 'center', paddingVertical: 10, marginBottom: 8 },
  cancelText: { color: '#64748B', fontSize: 14 },
});
