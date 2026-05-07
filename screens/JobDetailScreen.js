// screens/JobDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { jobAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Avatar, RoleBadge } from '../components/UI';
import { Card } from '../components/Card';

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params || {};
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (jobId) {
      jobAPI.getJob(jobId)
        .then(res => { setJob(res.data.job); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [jobId]);

  const handleApply = async () => {
    if (job.applyUrl) {
      Linking.openURL(job.applyUrl);
      return;
    }
    setApplying(true);
    try {
      await jobAPI.applyJob(jobId);
      setJob(prev => ({ ...prev, applications: [...(prev.applications || []), user._id] }));
      Alert.alert('Applied!', 'Your application has been submitted.');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Could not apply.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return (
    <View style={styles.loading}><ActivityIndicator size="large" color="#3B82F6" /></View>
  );
  if (!job) return (
    <View style={styles.loading}><Text style={{ color: '#fff' }}>Job not found.</Text></View>
  );

  const hasApplied = job.applications?.includes(user?._id);
  const typeColors = {
    'full-time': '#3B82F6', internship: '#8B5CF6',
    'part-time': '#F59E0B', remote: '#10B981', contract: '#EF4444',
  };
  const typeColor = typeColors[job.type] || '#64748B';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.hero}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#94A3B8" />
          </TouchableOpacity>

          <View style={[styles.typeBadge, { backgroundColor: typeColor + '22', borderColor: typeColor + '55' }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>{job.type?.toUpperCase()}</Text>
          </View>

          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobCompany}>{job.company}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{job.location}</Text>
            </View>
            {job.salary?.min && (
              <View style={styles.metaItem}>
                <Ionicons name="cash-outline" size={14} color="#10B981" />
                <Text style={[styles.metaText, { color: '#10B981' }]}>
                  ₹{(job.salary.min / 100000).toFixed(1)}L – ₹{(job.salary.max / 100000).toFixed(1)}L/yr
                </Text>
              </View>
            )}
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{job.views} views</Text>
            </View>
          </View>

          {/* Posted by */}
          {job.postedBy && (
            <TouchableOpacity
              style={styles.posterRow}
              onPress={() => navigation.navigate('UserProfile', { userId: job.postedBy._id })}
            >
              <Avatar name={job.postedBy.name} uri={job.postedBy.avatar} size={32} color="#3B82F6" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.posterName}>Posted by {job.postedBy.name}</Text>
                <Text style={styles.posterRole}>{job.postedBy.currentCompany || job.postedBy.role}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#475569" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}
        </LinearGradient>

        <View style={styles.content}>
          {/* Key Info Cards */}
          <View style={styles.infoGrid}>
            <InfoBox icon="briefcase-outline" label="Type" value={job.type} color="#3B82F6" />
            <InfoBox icon="time-outline" label="Posted" value={timeAgo(job.createdAt)} color="#8B5CF6" />
            {job.deadline && (
              <InfoBox icon="calendar-outline" label="Deadline" value={new Date(job.deadline).toLocaleDateString()} color="#EF4444" />
            )}
            <InfoBox icon="people-outline" label="Applicants" value={`${job.applications?.length || 0}`} color="#10B981" />
          </View>

          {/* Description */}
          <Card>
            <Text style={styles.sectionTitle}>Job Description</Text>
            <Text style={styles.description}>{job.description}</Text>
          </Card>

          {/* Requirements */}
          {job.requirements?.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Requirements</Text>
              {job.requirements.map((req, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text style={styles.bulletText}>{req}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Skills */}
          {job.skills?.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>Skills Required</Text>
              <View style={styles.skillsWrap}>
                {job.skills.map(s => (
                  <View key={s} style={styles.skillPill}>
                    <Text style={styles.skillText}>{s}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Tags */}
          {job.tags?.length > 0 && (
            <View style={styles.tagsRow}>
              {job.tags.map(t => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>#{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.applyBar}>
        <View style={styles.applyInfo}>
          <Text style={styles.applyCount}>{job.applications?.length || 0} applicants</Text>
          {job.deadline && (
            <Text style={styles.applyDeadline}>Closes {new Date(job.deadline).toLocaleDateString()}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.applyBtn, hasApplied && styles.applyBtnDone]}
          onPress={handleApply}
          disabled={hasApplied || applying}
        >
          {applying ? <ActivityIndicator size="small" color="#fff" /> : (
            <>
              <Ionicons name={hasApplied ? 'checkmark-circle' : 'send-outline'} size={16} color="#fff" />
              <Text style={styles.applyBtnText}>{hasApplied ? 'Applied' : 'Apply Now'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InfoBox({ icon, label, value, color }) {
  return (
    <View style={[infoStyles.box, { borderColor: color + '33' }]}>
      <Ionicons name={icon} size={16} color={color} style={{ marginBottom: 4 }} />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}
const infoStyles = StyleSheet.create({
  box: { flex: 1, backgroundColor: '#1E2235', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1 },
  label: { fontSize: 10, color: '#64748B', marginBottom: 2 },
  value: { fontSize: 13, fontWeight: '700', color: '#F1F5F9', textAlign: 'center' },
});

const timeAgo = (date) => {
  const d = Math.floor((Date.now() - new Date(date)) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' },
  hero: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: { marginBottom: 16 },
  typeBadge: {
    alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12,
  },
  typeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  jobTitle: { fontSize: 24, fontWeight: '800', color: '#F1F5F9', marginBottom: 6 },
  jobCompany: { fontSize: 16, color: '#94A3B8', marginBottom: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: '#64748B' },
  posterRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E2235', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#2D3448',
  },
  posterName: { fontSize: 13, fontWeight: '600', color: '#F1F5F9' },
  posterRole: { fontSize: 11, color: '#64748B', marginTop: 2 },
  content: { padding: 16 },
  infoGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginBottom: 12 },
  description: { fontSize: 14, color: '#CBD5E1', lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6', marginTop: 6, marginRight: 10 },
  bulletText: { flex: 1, fontSize: 14, color: '#CBD5E1', lineHeight: 20 },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillPill: {
    backgroundColor: '#1E3A5F', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#2563EB44',
  },
  skillText: { fontSize: 13, color: '#60A5FA', fontWeight: '500' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#1E2235', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { fontSize: 12, color: '#475569' },
  applyBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0F172A', borderTopWidth: 1, borderTopColor: '#1E2235',
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
  },
  applyInfo: { flex: 1 },
  applyCount: { fontSize: 13, fontWeight: '600', color: '#F1F5F9' },
  applyDeadline: { fontSize: 11, color: '#64748B', marginTop: 2 },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2563EB', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  applyBtnDone: { backgroundColor: '#10B981' },
  applyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
