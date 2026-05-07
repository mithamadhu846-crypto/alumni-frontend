// screens/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { analyticsAPI, eventAPI } from '../../utils/api';
import { StatCard, SectionTitle, RoleBadge, Avatar } from '../../components/UI';
import { Card } from '../../components/Card';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [sRes, eRes] = await Promise.allSettled([
        analyticsAPI.getDashboard(),
        eventAPI.getEvents({ limit: 20 }),
      ]);
      if (sRes.status === 'fulfilled') setStats(sRes.value.data.overview);
      if (eRes.status === 'fulfilled') {
        setPendingEvents((eRes.value.data.events || []).filter(e => !e.isApproved));
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const approveEvent = async (id) => {
    try {
      await eventAPI.approveEvent(id);
      setPendingEvents(prev => prev.filter(e => e._id !== id));
    } catch {}
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#b32424" />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc1b1b" />}
    >
      <LinearGradient colors={['#a11f1f', '#d73030', '#7c2b2b']} style={styles.hero}>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.greeting}>Admin Dashboard</Text>
            <Text style={styles.heroName}>{user?.name?.split(' ')[0]}</Text>
            <RoleBadge role="admin" />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Avatar name={user?.name} uri={user?.avatar} size={54} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>

        {/* Platform Overview */}
        {stats && (
          <>
            <SectionTitle title="Platform Overview" />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsRow}
            >
              <StatCard label="Total Users"   value={stats.totalUsers}    icon="people-outline"    color="#3B82F6" style={styles.statItem} />
              <StatCard label="Students"      value={stats.studentCount}  icon="school-outline"    color="#2563EB" style={styles.statItem} />
              <StatCard label="Alumni"        value={stats.alumniCount}   icon="ribbon-outline"    color="#10B981" style={styles.statItem} />
              <StatCard label="Active Jobs"   value={stats.activeJobs}    icon="briefcase-outline" color="#F59E0B" style={styles.statItem} />
              <StatCard label="Events"        value={stats.upcomingEvents} icon="calendar-outline" color="#8B5CF6" style={styles.statItem} />
              <StatCard label="Mentorships"   value={stats.activeMentorships} icon="link-outline" color="#EF4444" style={styles.statItem} />
            </ScrollView>
          </>
        )}

        <View style={styles.actionsGrid}>
  {[
    { icon: 'people-outline',    label: 'Manage Users', screen: 'ManageUsers', color: '#3B82F6' },
    { icon: 'megaphone-outline', label: 'Post Notice',  screen: 'PostNotice',  color: '#DC2626' },
    { icon: 'analytics-outline', label: 'Analytics',    screen: 'Analytics',   color: '#8B5CF6' },
    { icon: 'shield-outline',    label: 'Approvals',    screen: 'Approvals',   color: '#F59E0B' },
  ].map(({ icon, label, color, screen }) => (
    
    <TouchableOpacity 
      key={label} 
      style={styles.actionCard}
      onPress={() => navigation.navigate(screen)}   // ✅ THIS LINE FIXES IT
    >
      <View style={[styles.actionIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>

  ))}
</View>

        {/* Pending Events */}
        {pendingEvents.length > 0 && (
          <>
            <SectionTitle title={`⏳ Pending Events (${pendingEvents.length})`} />
            {pendingEvents.slice(0, 5).map(ev => (
              <Card key={ev._id}>
                <Text style={styles.evTitle}>{ev.title}</Text>
                <Text style={styles.evMeta}>{ev.category} · {new Date(ev.date).toLocaleDateString()}</Text>
                <Text style={styles.evOrg}>By: {ev.organizer?.name}</Text>
                <View style={styles.evActions}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => approveEvent(ev._id)}>
                    <Ionicons name="checkmark" size={14} color="#10B981" />
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn}>
                    <Ionicons name="close" size={14} color="#c42a2a" />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' },

  hero: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 28 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  heroName: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },

  content: { padding: 16 },

  // ✅ Horizontal Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
  },
  statItem: {
    width: 120,
  },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  actionCard: {
    width: '47%',
    backgroundColor: '#1E2235',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3448',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '600',
  },

  evTitle: { fontSize: 14, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
  evMeta: { fontSize: 12, color: '#64748B' },
  evOrg: { fontSize: 11, color: '#94A3B8', marginTop: 2, marginBottom: 10 },

  evActions: { flexDirection: 'row', gap: 8 },

  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B98122',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  approveBtnText: { color: '#10B981', fontSize: 12, fontWeight: '700' },

  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF444422',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rejectBtnText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
});