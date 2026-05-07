// screens/faculty/FacultyDashboard.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { noticeAPI, eventAPI } from '../../utils/api';
import { StatCard, SectionTitle, RoleBadge, Avatar, EmptyState } from '../../components/UI';
import { Card } from '../../components/Card';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [nRes, eRes] = await Promise.allSettled([
        noticeAPI.getNotices(),
        eventAPI.getEvents({ upcoming: true, limit: 5 }),
      ]);
      if (nRes.status === 'fulfilled') setNotices(nRes.value.data.notices || []);
      if (eRes.status === 'fulfilled') setEvents(eRes.value.data.events || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D97706" />}>
      <LinearGradient colors={['#92400E', '#D97706', '#FBBF24']} style={styles.hero}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.greeting}>Good day 🎓</Text>
            <Text style={styles.heroName}>{user?.name?.split(' ')[0]}</Text>
            <RoleBadge role="faculty" />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar name={user?.name} uri={user?.avatar} size={54} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.heroDept}>{user?.department}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <StatCard label="Notices" value={notices.length} icon="megaphone-outline" color="#D97706" style={{ marginRight: 6 }} />
          <StatCard label="Events" value={events.length} icon="calendar-outline" color="#8B5CF6" style={{ marginLeft: 6 }} />
        </View>

        <SectionTitle title="Faculty Actions" />
        <View style={styles.actionsGrid}>
          {[
            { icon: 'megaphone-outline', label: 'Post Notice', color: '#D97706', screen: 'PostNotice' },
            { icon: 'calendar-outline', label: 'Create Event', color: '#8B5CF6', screen: 'PostEvent' },
            { icon: 'briefcase-outline', label: 'Post a Job', color: '#3B82F6', screen: 'PostJob' },
            { icon: 'people-outline', label: 'Alumni Dir.', color: '#10B981', screen: 'AlumniDirectory' },
          ].map(({ icon, label, color, screen }) => (
            <TouchableOpacity key={label} style={styles.actionCard} onPress={() => navigation.navigate(screen)}>
              <View style={[styles.actionIcon, { backgroundColor: color + '22' }]}>
                <Ionicons name={icon} size={22} color={color} />
              </View>
              <Text style={styles.actionLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionTitle title="📢 Recent Notices" />
        {notices.slice(0, 4).map(n => (
          <Card key={n._id}>
            <Text style={styles.noticeTitle}>{n.title}</Text>
            <Text style={styles.noticeContent} numberOfLines={2}>{n.content}</Text>
          </Card>
        ))}

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  hero: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 28 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  heroName: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  heroDept: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  content: { padding: 16 },
  statsRow: { flexDirection: 'row', marginBottom: 20 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  actionCard: {
    width: '47%', backgroundColor: '#1E2235', borderRadius: 14,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2D3448',
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, color: '#94A3B8', textAlign: 'center', fontWeight: '600' },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  noticeContent: { fontSize: 12, color: '#64748B' },
});
