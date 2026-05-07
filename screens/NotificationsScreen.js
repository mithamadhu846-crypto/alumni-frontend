// screens/NotificationsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationAPI } from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import { EmptyState } from '../components/UI';

const TYPE_CONFIG = {
  mentorship_request:   { icon: 'people-outline',        color: '#10B981' },
  mentorship_accepted:  { icon: 'checkmark-circle-outline', color: '#10B981' },
  mentorship_declined:  { icon: 'close-circle-outline',  color: '#EF4444' },
  mentorship_completed: { icon: 'ribbon-outline',         color: '#8B5CF6' },
  job_posted:           { icon: 'briefcase-outline',      color: '#3B82F6' },
  event_approved:       { icon: 'calendar-outline',       color: '#F59E0B' },
  notice_posted:        { icon: 'megaphone-outline',      color: '#D97706' },
  message_received:     { icon: 'chatbubble-outline',     color: '#06B6D4' },
  badge_earned:         { icon: 'trophy-outline',         color: '#FCD34D' },
  match_found:          { icon: 'heart-outline',          color: '#EC4899' },
  resume_analyzed:      { icon: 'document-text-outline',  color: '#A78BFA' },
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await notificationAPI.getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  // Real-time notification push
  useEffect(() => {
    if (!socket) return;
    const onNotif = (notif) => {
      setNotifications(prev => [{ ...notif, _id: notif.id, isRead: false, createdAt: new Date() }, ...prev]);
      setUnreadCount(c => c + 1);
    };
    socket.on('notification', onNotif);
    return () => socket.off('notification', onNotif);
  }, [socket]);

  const markRead = async (id) => {
    await notificationAPI.markRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const renderItem = ({ item }) => {
    const cfg = TYPE_CONFIG[item.type] || { icon: 'notifications-outline', color: '#64748B' };
    return (
      <TouchableOpacity
        style={[styles.row, !item.isRead && styles.rowUnread]}
        onPress={() => { if (!item.isRead) markRead(item._id); }}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrap, { backgroundColor: cfg.color + '22' }]}>
          <Ionicons name={cfg.icon} size={22} color={cfg.color} />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, !item.isRead && styles.titleUnread]}>{item.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>
        {!item.isRead && <View style={[styles.dot, { backgroundColor: cfg.color }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#94A3B8" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <Text style={styles.headerSub}>{unreadCount} unread</Text>}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n._id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3B82F6" />
          }
          ListEmptyComponent={
            <EmptyState icon="notifications-outline" title="No notifications yet" subtitle="Activity from the platform will appear here" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
  headerSub: { fontSize: 12, color: '#3B82F6', marginTop: 1 },
  markAllBtn: { backgroundColor: '#1E3A5F', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  markAllText: { fontSize: 12, color: '#60A5FA', fontWeight: '600' },
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A2E',
  },
  rowUnread: { backgroundColor: '#1A1A2E' },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginBottom: 3 },
  titleUnread: { color: '#F1F5F9', fontWeight: '700' },
  body: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  time: { fontSize: 11, color: '#475569', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, marginLeft: 8 },
});
