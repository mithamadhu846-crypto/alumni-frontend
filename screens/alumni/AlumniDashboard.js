// screens/alumni/AlumniDashboard.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { mentorshipAPI, jobAPI, eventAPI, noticeAPI } from '../../utils/api';
import { StatCard, SectionTitle, RoleBadge, Avatar, EmptyState } from '../../components/UI';
import { Card } from '../../components/Card';

export default function AlumniDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [mentorships, setMentorships] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [notices, setNotices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [mRes, jRes, nRes] = await Promise.allSettled([
        mentorshipAPI.getMentorships({ role: 'mentor', status: 'pending' }),
        jobAPI.getJobs({ limit: 5 }),
        noticeAPI.getNotices(),
      ]);
      if (mRes.status === 'fulfilled') setMentorships(mRes.value.data.mentorships || []);
      if (jRes.status === 'fulfilled') setMyJobs(jRes.value.data.jobs?.filter(j => j.postedBy?._id === user?._id) || []);
      if (nRes.status === 'fulfilled') setNotices(nRes.value.data.notices || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
    >
      <LinearGradient colors={['#047857', '#10B981', '#34D399']} style={styles.hero}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.greeting}>Welcome back 🌟</Text>
            <Text style={styles.heroName}>{user?.name?.split(' ')[0]}</Text>
            <RoleBadge role="alumni" />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar name={user?.name} uri={user?.avatar} size={54} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.heroBio} numberOfLines={2}>{user?.currentRole} at {user?.currentCompany}</Text>
        {/* Points badge */}
        <View style={styles.pointsBadge}>
          <Ionicons name="star" size={14} color="#FCD34D" />
          <Text style={styles.pointsText}>{user?.points || 0} points</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsRow}>
          <StatCard label="Pending Requests" value={mentorships.filter(m => m.status === 'pending').length} icon="time-outline" color="#F59E0B" style={{ marginRight: 6 }} />
          <StatCard label="Active Mentees" value={mentorships.filter(m => m.status === 'active').length} icon="people-outline" color="#10B981" style={{ marginHorizontal: 3 }} />
          <StatCard label="Points" value={user?.points || 0} icon="trophy-outline" color="#8B5CF6" style={{ marginLeft: 6 }} />
        </View>

        {/* Quick Actions */}
        <SectionTitle title="Quick Actions" />
        <View style={styles.actionsGrid}>
          {[
            { icon: 'briefcase-outline', label: 'Post a Job', color: '#3B82F6', screen: 'PostJob' },
            { icon: 'people-outline', label: 'My Mentees', color: '#10B981', screen: 'Mentorship' },
            { icon: 'rocket-outline', label: 'Add Startup', color: '#8B5CF6', screen: 'Startups' },
            { icon: 'calendar-outline', label: 'Host Event', color: '#F59E0B', screen: 'PostEvent' },
            { icon: 'trophy-outline', label: 'Leaderboard', color: '#EF4444', screen: 'Gamification' },
            { icon: 'chatbubble-ellipses-outline', label: 'AI Chat', color: '#06B6D4', screen: 'Chatbot' },
          ].map(({ icon, label, color, screen }) => (
            <TouchableOpacity key={label} style={styles.actionCard} onPress={() => navigation.navigate(screen)}>
              <View style={[styles.actionIcon, { backgroundColor: color + '22' }]}>
                <Ionicons name={icon} size={22} color={color} />
              </View>
              <Text style={styles.actionLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Mentorship Requests */}
        <SectionTitle title="📨 Mentorship Requests" action="See All" onAction={() => navigation.navigate('Mentorship')} />
        {mentorships.filter(m => m.status === 'pending').length === 0 ? (
          <EmptyState icon="people-outline" title="No pending requests" subtitle="You'll see mentorship requests here" />
        ) : (
          mentorships.filter(m => m.status === 'pending').slice(0, 3).map(m => (
            <Card key={m._id}>
              <View style={styles.requestRow}>
                <Avatar name={m.mentee?.name} size={40} color="#10B981" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.reqName}>{m.mentee?.name}</Text>
                  <Text style={styles.reqDept}>{m.mentee?.department}</Text>
                  <Text style={styles.reqMsg} numberOfLines={1}>{m.message}</Text>
                </View>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => navigation.navigate('Mentorship')}
                >
                  <Text style={styles.acceptText}>View</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {/* Notices */}
        {notices.slice(0, 2).map(n => (
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
  heroBio: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  pointsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.2)', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  pointsText: { color: '#FCD34D', fontSize: 12, fontWeight: '700' },
  content: { padding: 16 },
  statsRow: { flexDirection: 'row', marginBottom: 20 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  actionCard: {
    width: '30%', backgroundColor: '#1E2235', borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2D3448',
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 11, color: '#94A3B8', textAlign: 'center', fontWeight: '600' },
  requestRow: { flexDirection: 'row', alignItems: 'center' },
  reqName: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  reqDept: { fontSize: 12, color: '#64748B' },
  reqMsg: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  acceptBtn: { backgroundColor: '#10B98122', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  acceptText: { color: '#10B981', fontSize: 12, fontWeight: '700' },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  noticeContent: { fontSize: 12, color: '#64748B' },
});
