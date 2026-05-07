// screens/UserProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { userAPI, mentorshipAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Avatar, RoleBadge } from '../components/UI';
import { Card } from '../components/Card';

export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getUser(userId).then(res => { setProfile(res.data.user); setLoading(false); }).catch(() => setLoading(false));
  }, [userId]);

  const requestMentor = async () => {
    try {
      await mentorshipAPI.requestMentorship({ mentorId: userId, message: `Hi ${profile.name}, I'd love to connect for mentorship!` });
      Alert.alert('Request Sent!', 'Your mentorship request has been sent.');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Could not send request.');
    }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#3B82F6" /></View>;
  if (!profile) return <View style={styles.loading}><Text style={{ color: '#fff' }}>User not found.</Text></View>;

  const roleColor = { student: '#2563EB', alumni: '#059669', faculty: '#D97706', admin: '#DC2626' }[profile.role] || '#3B82F6';

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={[roleColor + 'CC', roleColor + '44']} style={styles.hero}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <Avatar name={profile.name} uri={profile.avatar} size={80} color={roleColor} />
        <Text style={styles.name}>{profile.name}</Text>
        <RoleBadge role={profile.role} />
        {profile.currentRole && <Text style={styles.role}>{profile.currentRole} at {profile.currentCompany}</Text>}
        <Text style={styles.dept}>{profile.department} · {profile.graduationYear}</Text>
      </LinearGradient>

      <View style={styles.content}>
        {me?.role === 'student' && profile.isMentor && (
          <TouchableOpacity onPress={requestMentor}>
            <LinearGradient colors={['#047857', '#10B981']} style={styles.connectBtn}>
              <Ionicons name="people-outline" size={18} color="#fff" />
              <Text style={styles.connectText}>Request Mentorship</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statVal}>{profile.points || 0}</Text><Text style={styles.statLabel}>Points</Text></View>
          <View style={styles.statItem}><Text style={styles.statVal}>{profile.badges?.length || 0}</Text><Text style={styles.statLabel}>Badges</Text></View>
          <View style={styles.statItem}><Text style={styles.statVal}>{profile.contributions?.menteesMentored || 0}</Text><Text style={styles.statLabel}>Mentees</Text></View>
        </View>

        {profile.bio && <Card><Text style={styles.bio}>{profile.bio}</Text></Card>}

        {profile.skills?.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsWrap}>
              {profile.skills.map(s => <View key={s} style={[styles.skillPill, { borderColor: roleColor + '55' }]}><Text style={[styles.skillText, { color: roleColor }]}>{s}</Text></View>)}
            </View>
          </Card>
        )}

        {profile.mentorshipAreas?.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Mentorship Areas</Text>
            <View style={styles.skillsWrap}>
              {profile.mentorshipAreas.map(a => <View key={a} style={styles.areaPill}><Text style={styles.areaText}>{a}</Text></View>)}
            </View>
          </Card>
        )}

        {profile.linkedIn && (
          <Card>
            <View style={styles.linkRow}>
              <Ionicons name="logo-linkedin" size={18} color="#0A66C2" />
              <Text style={styles.linkText}>{profile.linkedIn}</Text>
            </View>
          </Card>
        )}
      </View>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' },
  hero: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' },
  back: { position: 'absolute', top: 56, left: 16 },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 12, marginBottom: 6 },
  role: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
  dept: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  content: { padding: 16 },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, marginBottom: 16 },
  connectText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#1E2235', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2D3448' },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  bio: { fontSize: 14, color: '#CBD5E1', lineHeight: 21 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', marginBottom: 10 },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillPill: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  skillText: { fontSize: 13, fontWeight: '600' },
  areaPill: { backgroundColor: '#1E2D40', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  areaText: { fontSize: 13, color: '#60A5FA' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkText: { fontSize: 14, color: '#0A66C2' },
});
