// screens/GamificationScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { leaderboardAPI, userAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Avatar, SectionTitle } from '../components/UI';
import { Card } from '../components/Card';

const ALL_BADGES = [
  { name: 'Rising Star',        icon: '⭐', description: 'Earn 100 points',          threshold: 100,  color: '#F59E0B' },
  { name: 'Community Builder',  icon: '🏗️', description: 'Earn 500 points',          threshold: 500,  color: '#3B82F6' },
  { name: 'Alumni Champion',    icon: '🏆', description: 'Earn 1000 points',         threshold: 1000, color: '#8B5CF6' },
  { name: 'Legend',             icon: '👑', description: 'Earn 5000 points',         threshold: 5000, color: '#EF4444' },
  { name: 'Job Poster',         icon: '💼', description: 'Post 3+ jobs',             condition: 'jobs',    color: '#10B981' },
  { name: 'Event Host',         icon: '🎪', description: 'Host 2+ events',           condition: 'events',  color: '#EC4899' },
  { name: 'Mentor Pro',         icon: '🎓', description: 'Mentor 3+ students',       condition: 'mentees', color: '#06B6D4' },
  { name: 'Startup Founder',    icon: '🚀', description: 'List a startup',           condition: 'startup', color: '#A78BFA' },
  { name: 'Networker',          icon: '🤝', description: 'Connect with 10 alumni',   condition: 'network', color: '#34D399' },
];

const POINT_ACTIONS = [
  { action: 'Post a job',              points: '+50',  icon: 'briefcase-outline',    color: '#3B82F6' },
  { action: 'Register for event',      points: '+10',  icon: 'calendar-outline',     color: '#8B5CF6' },
  { action: 'List a startup',          points: '+75',  icon: 'rocket-outline',       color: '#F59E0B' },
  { action: 'Complete mentorship',     points: '+100', icon: 'people-outline',       color: '#10B981' },
  { action: 'Get mentorship review',   points: '+25',  icon: 'star-outline',         color: '#EF4444' },
  { action: 'Daily login',             points: '+5',   icon: 'log-in-outline',       color: '#06B6D4' },
];

function BadgePulse({ earned }) {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (earned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [earned]);
  return (
    <Animated.View style={{ transform: [{ scale: anim }] }}>
      {/* Content rendered by parent */}
    </Animated.View>
  );
}

export default function GamificationScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [myProfile, setMyProfile] = useState(user);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const load = async () => {
    try {
      const [lbRes, profileRes] = await Promise.allSettled([
        leaderboardAPI.getLeaderboard({ limit: 5 }),
        userAPI.getUser(user._id),
      ]);
      if (lbRes.status === 'fulfilled') setTopUsers(lbRes.value.data.leaderboard?.slice(0, 5) || []);
      if (profileRes.status === 'fulfilled') {
        setMyProfile(profileRes.value.data.user);
        updateUser(profileRes.value.data.user);
      }
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    load();
    Animated.timing(progressAnim, {
      toValue: Math.min(myProfile?.points || 0, 1000),
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, []);

  const nextThreshold = ALL_BADGES.filter(b => b.threshold > (myProfile?.points || 0))
    .sort((a, b) => a.threshold - b.threshold)[0];

  const progressToNext = nextThreshold
    ? Math.min(100, ((myProfile?.points || 0) / nextThreshold.threshold) * 100)
    : 100;

  const earnedNames = new Set(myProfile?.badges?.map(b => b.name) || []);

  if (loading) return (
    <View style={styles.loading}><ActivityIndicator size="large" color="#8B5CF6" /></View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#8B5CF6" />}
    >
      {/* Hero */}
      <LinearGradient colors={['#1E1B4B', '#312E81', '#6D28D9']} style={styles.hero}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <Avatar name={myProfile?.name} uri={myProfile?.avatar} size={64} color="#A78BFA" />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.heroName}>{myProfile?.name}</Text>
            <View style={styles.pointsBadgeRow}>
              <Ionicons name="star" size={16} color="#FCD34D" />
              <Text style={styles.pointsNum}>{myProfile?.points || 0}</Text>
              <Text style={styles.pointsLabel}> points</Text>
            </View>
            <View style={styles.rankRow}>
              <Ionicons name="trophy-outline" size={13} color="#A78BFA" />
              <Text style={styles.rankText}>{myProfile?.badges?.length || 0} badges earned</Text>
            </View>
          </View>
        </View>

        {/* Progress to next badge */}
        {nextThreshold && (
          <View style={styles.progressWrap}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Next: {nextThreshold.icon} {nextThreshold.name}</Text>
              <Text style={styles.progressPts}>{myProfile?.points || 0} / {nextThreshold.threshold} pts</Text>
            </View>
            <View style={styles.progressBg}>
              <Animated.View
                style={[styles.progressFill, {
                  width: progressAnim.interpolate({
                    inputRange: [0, nextThreshold.threshold],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp',
                  }),
                }]}
              />
            </View>
          </View>
        )}
      </LinearGradient>

      <View style={styles.content}>
        {/* My Badges */}
        <SectionTitle title="🏅 My Badges" />
        <View style={styles.badgeGrid}>
          {ALL_BADGES.map(badge => {
            const earned = earnedNames.has(badge.name);
            const myBadge = myProfile?.badges?.find(b => b.name === badge.name);
            return (
              <View key={badge.name} style={[styles.badgeCard, !earned && styles.badgeCardLocked]}>
                <View style={[
                  styles.badgeCircle,
                  { backgroundColor: earned ? badge.color + '33' : '#1E2235' },
                  earned && { borderColor: badge.color, borderWidth: 2 },
                ]}>
                  <Text style={[styles.badgeEmoji, !earned && { opacity: 0.25 }]}>{badge.icon}</Text>
                  {earned && <View style={[styles.earnedDot, { backgroundColor: badge.color }]} />}
                </View>
                <Text style={[styles.badgeName, earned && { color: badge.color }]} numberOfLines={2}>
                  {badge.name}
                </Text>
                <Text style={styles.badgeDesc} numberOfLines={2}>{badge.description}</Text>
                {earned && myBadge?.earnedAt && (
                  <Text style={styles.earnedDate}>
                    {new Date(myBadge.earnedAt).toLocaleDateString()}
                  </Text>
                )}
                {!earned && badge.threshold && (
                  <Text style={styles.lockedHint}>{badge.threshold} pts needed</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* How to earn points */}
        <SectionTitle title="⚡ How to Earn Points" />
        <Card>
          {POINT_ACTIONS.map((a, i) => (
            <View key={i} style={[styles.actionRow, i < POINT_ACTIONS.length - 1 && styles.actionRowBorder]}>
              <View style={[styles.actionIcon, { backgroundColor: a.color + '22' }]}>
                <Ionicons name={a.icon} size={18} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.action}</Text>
              <View style={[styles.pointsPill, { backgroundColor: a.color + '22' }]}>
                <Text style={[styles.pointsPillText, { color: a.color }]}>{a.points}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Mini Leaderboard */}
        <SectionTitle title="🏆 Top Contributors" action="Full Leaderboard" onAction={() => navigation.navigate('More')} />
        {topUsers.map((entry, i) => {
          const medals = ['🥇', '🥈', '🥉'];
          const isMe = entry.user._id === user._id;
          return (
            <TouchableOpacity
              key={entry.user._id}
              onPress={() => navigation.navigate('UserProfile', { userId: entry.user._id })}
            >
              <View style={[styles.lbRow, isMe && styles.lbRowMe]}>
                <Text style={styles.lbMedal}>{medals[i] || `${i + 1}.`}</Text>
                <Avatar name={entry.user.name} uri={entry.user.avatar} size={36}
                  color={{ student: '#3B82F6', alumni: '#10B981', faculty: '#D97706' }[entry.user.role] || '#64748B'} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.lbName}>{entry.user.name}{isMe ? ' (You)' : ''}</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {entry.user.badges?.slice(0, 3).map(b => (
                      <Text key={b.name} style={{ fontSize: 12 }}>{b.icon}</Text>
                    ))}
                  </View>
                </View>
                <View style={styles.lbPts}>
                  <Text style={styles.lbPtsNum}>{entry.points}</Text>
                  <Text style={styles.lbPtsLabel}>pts</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' },
  hero: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
  back: { marginBottom: 16 },
  heroContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  heroName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  pointsBadgeRow: { flexDirection: 'row', alignItems: 'center' },
  pointsNum: { fontSize: 22, fontWeight: '900', color: '#FCD34D', marginLeft: 4 },
  pointsLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rankText: { fontSize: 12, color: '#A78BFA' },
  progressWrap: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, color: '#E2E8F0', fontWeight: '600' },
  progressPts: { fontSize: 12, color: '#A78BFA' },
  progressBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: '#8B5CF6', borderRadius: 4 },
  content: { padding: 16 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  badgeCard: {
    width: '30%', backgroundColor: '#1E2235', borderRadius: 14,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2D3448',
  },
  badgeCardLocked: { opacity: 0.5 },
  badgeCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative',
  },
  badgeEmoji: { fontSize: 26 },
  earnedDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#1E2235',
  },
  badgeName: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textAlign: 'center', marginBottom: 2 },
  badgeDesc: { fontSize: 9, color: '#475569', textAlign: 'center' },
  earnedDate: { fontSize: 9, color: '#64748B', marginTop: 4 },
  lockedHint: { fontSize: 9, color: '#475569', marginTop: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  actionRowBorder: { borderBottomWidth: 1, borderBottomColor: '#2D3448' },
  actionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: 14, color: '#CBD5E1' },
  pointsPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pointsPillText: { fontSize: 13, fontWeight: '800' },
  lbRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E2235', borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#2D3448',
  },
  lbRowMe: { borderColor: '#8B5CF6', backgroundColor: '#1E1B40' },
  lbMedal: { fontSize: 18, width: 32 },
  lbName: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  lbPts: { alignItems: 'center' },
  lbPtsNum: { fontSize: 18, fontWeight: '800', color: '#A78BFA' },
  lbPtsLabel: { fontSize: 9, color: '#64748B' },
});
