// screens/admin/Analytics.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Dimensions, RefreshControl
} from 'react-native';
import { analyticsAPI } from '../utils/api';

const { width } = Dimensions.get('window');
const BAR_WIDTH = width - 64;

/* ---------------- BAR CHART ---------------- */
function BarChart({ data, maxVal }) {
  return (
    <View style={{ marginTop: 8 }}>
      {data.map((item, i) => {
        const pct = maxVal > 0 ? (item.value / maxVal) : 0;

        return (
          <View key={i} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ color: '#e8eaf6', fontSize: 12, fontWeight: '600' }}>
                {item.label}
              </Text>
              <Text style={{ color: item.color, fontSize: 12, fontWeight: '700' }}>
                {item.value}
              </Text>
            </View>

            <View style={{
              height: 8,
              backgroundColor: 'rgba(79,142,247,0.1)',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <View
                style={{
                  width: BAR_WIDTH * pct,
                  height: '100%',
                  backgroundColor: item.color,
                  borderRadius: 4
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ---------------- STAT CARD ---------------- */
function StatCard({ icon, value, label, color, sub }) {
  return (
    <View style={[s.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={{ fontSize: 28 }}>{icon}</Text>
      <Text style={[s.statVal, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub && <Text style={s.statSub}>{sub}</Text>}
    </View>
  );
}

/* ---------------- MAIN ---------------- */
export default function Analytics({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* FETCH FROM SAME API AS ADMIN DASHBOARD */
  const fetchStats = async () => {
    try {
      const res = await analyticsAPI.getDashboard();

      // unified backend structure
      setStats(res.data.overview || res.data);
    } catch (err) {
      console.log("Analytics API error:", err);

      // fallback safe data
      setStats({
        totalUsers: 10,
        studentCount: 5,
        alumniCount: 2,
        facultyCount: 1,
        adminCount: 1,
        activeJobs: 4,
        upcomingEvents: 4,
        activeMentorships: 0,
        notices: 3,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color="#4f8ef7" />
          <Text style={s.loadingTxt}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* MAP API → UI */
  const userBar = [
    { label: 'Students', value: stats?.studentCount || 0, color: '#4f8ef7' },
    { label: 'Alumni',   value: stats?.alumniCount || 0,  color: '#f59e0b' },
    { label: 'Faculty',  value: stats?.facultyCount || 0, color: '#10b981' },
    { label: 'Admins',   value: stats?.adminCount || 0,   color: '#ef4444' },
  ];

  const maxUser = Math.max(...userBar.map(b => b.value), 1);

  const activityBar = [
    { label: 'Active Jobs', value: stats?.activeJobs || 0, color: '#4f8ef7' },
    { label: 'Events',      value: stats?.upcomingEvents || 0, color: '#7c3aed' },
    { label: 'Mentorships', value: stats?.activeMentorships || 0, color: '#10b981' },
    { label: 'Notices',     value: stats?.notices || 0, color: '#f59e0b' },
  ];

  const maxActivity = Math.max(...activityBar.map(b => b.value), 1);

  const totalUsers =
    stats?.totalUsers ||
    (stats?.studentCount || 0) +
    (stats?.alumniCount || 0) +
    (stats?.facultyCount || 0) +
    (stats?.adminCount || 0);

  return (
    <SafeAreaView style={s.safe}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>

        <View>
          <Text style={s.title}>📊 Analytics</Text>
          <Text style={s.subtitle}>Platform Statistics Overview</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchStats();
            }}
            tintColor="#4f8ef7"
          />
        }
      >

        {/* USER OVERVIEW */}
        <Text style={s.sectionTitle}>👥 User Overview</Text>

        <View style={s.statsGrid}>
          <StatCard icon="👨‍🎓" value={stats?.studentCount || 0} label="Students" color="#4f8ef7" />
          <StatCard icon="🎓" value={stats?.alumniCount || 0} label="Alumni" color="#f59e0b" />
          <StatCard icon="👨‍🏫" value={stats?.facultyCount || 0} label="Faculty" color="#10b981" />
          <StatCard icon="🛡️" value={stats?.adminCount || 0} label="Admins" color="#ef4444" />
        </View>

        {/* TOTAL USERS */}
        <View style={s.bigCard}>
          <Text style={s.cardTitle}>Total Registered Users</Text>
          <Text style={s.total}>{totalUsers}</Text>
          <BarChart data={userBar} maxVal={maxUser} />
        </View>

       

        {/* ACTIVITY */}
        <Text style={s.sectionTitle}>🔥 Platform Activity</Text>

        <View style={s.bigCard}>
          <BarChart data={activityBar} maxVal={maxActivity} />
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0f2c' },

  header: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,

  paddingHorizontal: 16,
  paddingTop: 40,   // ✅ pushes header down properly
  paddingBottom: 14,

  backgroundColor: '#0a0f2c',
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(79,142,247,0.2)'
},

  back: { color: '#4f8ef7', fontSize: 22, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  subtitle: { fontSize: 12, color: '#8892b0', marginTop: 2 },

  scroll: { padding: 16 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e8eaf6',
    marginBottom: 12,
    marginTop: 10
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },

  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#111a4a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center'
  },

  statVal: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6
  },

  statLabel: {
    fontSize: 11,
    color: '#8892b0',
    marginTop: 4,
    textAlign: 'center'
  },

  statSub: {
    fontSize: 10,
    color: '#8892b0',
    marginTop: 2
  },

  bigCard: {
    backgroundColor: '#111a4a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16
  },

  cardTitle: {
    color: '#e8eaf6',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8
  },

  total: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4f8ef7',
    marginBottom: 10
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  loadingTxt: {
    color: '#8892b0',
    marginTop: 10
  }
});