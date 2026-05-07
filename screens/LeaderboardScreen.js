// screens/LeaderboardScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { leaderboardAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Avatar, EmptyState } from '../components/UI';

const ROLE_FILTERS = ['all', 'student', 'alumni', 'faculty'];

export default function LeaderboardScreen({ navigation }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await leaderboardAPI.getLeaderboard({ role: roleFilter });
      setEntries(res.data.leaderboard || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [roleFilter]);

  const myRank = entries.findIndex(e => e.user._id === user?._id) + 1;

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  const renderEntry = ({ item }) => {
    const isMe = item.user._id === user?._id;
    return (
      <TouchableOpacity onPress={() => navigation.navigate('UserProfile', { userId: item.user._id })}>
        <View style={[styles.entryRow, isMe && styles.entryRowMe]}>
          <View style={styles.rankWrap}>
            {item.rank <= 3 ? (
              <Text style={styles.medal}>{'🥇🥈🥉'[item.rank - 1]}</Text>
            ) : (
              <Text style={styles.rankNum}>{item.rank}</Text>
            )}
          </View>
          <Avatar name={item.user.name} uri={item.user.avatar} size={40}
            color={{ student: '#3B82F6', alumni: '#10B981', faculty: '#D97706', admin: '#DC2626' }[item.user.role] || '#64748B'} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.entryName}>{item.user.name}{isMe ? ' (You)' : ''}</Text>
            <Text style={styles.entrySub}>{item.user.currentRole || item.user.department}</Text>
            <View style={styles.badgeRow}>
              {item.user.badges?.slice(0, 3).map(b => (
                <Text key={b.name} style={styles.badgeIcon}>{b.icon}</Text>
              ))}
            </View>
          </View>
          <View style={styles.pointsWrap}>
            <Text style={styles.pointsVal}>{item.points}</Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#312E81', '#4F46E5']} style={styles.heroBar}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        {myRank > 0 && <Text style={styles.myRankText}>Your rank: #{myRank}</Text>}
      </LinearGradient>

      <View style={styles.filterRow}>
        {ROLE_FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.chip, roleFilter === f && styles.chipActive]} onPress={() => setRoleFilter(f)}>
            <Text style={[styles.chipText, roleFilter === f && styles.chipTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={entries} keyExtractor={e => e.user._id} renderItem={renderEntry}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#6366F1" />}
          ListEmptyComponent={<EmptyState icon="trophy-outline" title="No data yet" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  heroBar: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  myRankText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 8, padding: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#2D3448', backgroundColor: '#1E2235' },
  chipActive: { backgroundColor: '#1E1B40', borderColor: '#6366F1' },
  chipText: { color: '#64748B', fontSize: 13 },
  chipTextActive: { color: '#A5B4FC', fontWeight: '700' },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E2235' },
  entryRowMe: { backgroundColor: '#1E1B40' },
  rankWrap: { width: 36, alignItems: 'center' },
  medal: { fontSize: 20 },
  rankNum: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  entryName: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  entrySub: { fontSize: 12, color: '#64748B', marginTop: 1 },
  badgeRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  badgeIcon: { fontSize: 14 },
  pointsWrap: { alignItems: 'center' },
  pointsVal: { fontSize: 18, fontWeight: '800', color: '#A5B4FC' },
  pointsLabel: { fontSize: 10, color: '#64748B' },
});
