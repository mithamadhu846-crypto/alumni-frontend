// screens/NoticeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { noticeAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { PriorityBadge, EmptyState } from '../components/UI';
import { Card } from '../components/Card';

export default function NoticeScreen({ navigation }) {
  const { user } = useAuth();
  const [notices,    setNotices]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await noticeAPI.getNotices();
      setNotices(res.data.notices || []);
    } catch (e) {
      console.warn('Notice load error:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await noticeAPI.markRead(id);
      setNotices(prev =>
        prev.map(n => n._id === id ? { ...n, reads: [...(n.reads || []), user._id] } : n)
      );
    } catch {}
  };

  const renderNotice = ({ item }) => {
    const isRead = item.reads?.includes(user?._id);
    return (
      <TouchableOpacity onPress={() => markRead(item._id)} activeOpacity={0.85}>
        <Card style={{ opacity: isRead ? 0.65 : 1, position: 'relative' }}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, isRead && { color: '#94A3B8' }]}>
                {item.title}
              </Text>
              <Text style={styles.meta}>
                By {item.postedBy?.name} · {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <PriorityBadge priority={item.priority} />
          </View>
          <Text style={styles.content}>{item.content}</Text>
          {!isRead && <View style={styles.dot} />}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#94A3B8" />
        </TouchableOpacity>
        <Text style={styles.heading}>Notice Board</Text>
        {['admin', 'faculty'].includes(user?.role) && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('PostNotice')}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notices}
          keyExtractor={n => n._id}
          renderItem={renderNotice}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor="#F59E0B"
            />
          }
          ListEmptyComponent={
            <EmptyState icon="megaphone-outline" title="No notices yet" subtitle="Check back soon!" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#0F0F1A', paddingTop: 56 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, marginBottom: 8,
  },
  heading:    { flex: 1, fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
  addBtn: {
    backgroundColor: '#D97706', width: 34, height: 34,
    borderRadius: 17, alignItems: 'center', justifyContent: 'center',
  },
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 8, gap: 8,
  },
  title:   { fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
  meta:    { fontSize: 11, color: '#64748B' },
  content: { fontSize: 13, color: '#94A3B8', lineHeight: 19 },
  dot: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B',
  },
});
