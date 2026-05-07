// screens/JobsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { jobAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { EmptyState, SectionTitle } from '../components/UI';
import { Card } from '../components/Card';

const JOB_TYPES = ['all', 'full-time', 'internship', 'part-time', 'remote', 'contract'];

export default function JobsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchJobs = async (reset = false) => {
    try {
      const params = { page: reset ? 1 : page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (typeFilter !== 'all') params.type = typeFilter;

      const res = await jobAPI.getJobs(params);
      const newJobs = res.data.jobs || [];
      setJobs(reset ? newJobs : prev => [...prev, ...newJobs]);
      setHasMore(newJobs.length === 15);
      if (reset) setPage(2); else setPage(p => p + 1);
    } catch {} finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { fetchJobs(true); }, [typeFilter]);

  const onRefresh = () => { setRefreshing(true); fetchJobs(true); };
  const onLoadMore = () => { if (hasMore && !loading) fetchJobs(); };

  const canPost = ['alumni', 'faculty', 'admin'].includes(user?.role);

  const renderJob = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('JobDetail', { jobId: item._id })}>
      <Card>
        <View style={styles.jobHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <Text style={styles.jobCompany}>{item.company}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: typeColor(item.type) + '22' }]}>
            <Text style={[styles.typeText, { color: typeColor(item.type) }]}>{item.type}</Text>
          </View>
        </View>
        <View style={styles.jobMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color="#64748B" />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
          {item.salary?.min && (
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={13} color="#10B981" />
              <Text style={[styles.metaText, { color: '#10B981' }]}>
                ₹{(item.salary.min / 100000).toFixed(1)}L–₹{(item.salary.max / 100000).toFixed(1)}L
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text style={styles.metaText}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>
        {item.skills?.length > 0 && (
          <View style={styles.skillsRow}>
            {item.skills.slice(0, 4).map(s => (
              <View key={s} style={styles.skillPill}>
                <Text style={styles.skillText}>{s}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Job Portal</Text>
        {canPost && (
          <TouchableOpacity style={styles.postBtn} onPress={() => navigation.navigate('PostJob')}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs, companies, skills..."
          placeholderTextColor="#475569"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => fetchJobs(true)}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); fetchJobs(true); }}>
            <Ionicons name="close-circle" size={18} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filter */}
      <FlatList
        horizontal
        data={JOB_TYPES}
        keyExtractor={t => t}
        contentContainerStyle={styles.filterList}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, typeFilter === item && styles.filterChipActive]}
            onPress={() => setTypeFilter(item)}
          >
            <Text style={[styles.filterChipText, typeFilter === item && styles.filterChipTextActive]}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading && page === 1 ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={j => j._id}
          renderItem={renderJob}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={<EmptyState icon="briefcase-outline" title="No jobs found" subtitle="Try different filters or check back later" />}
          ListFooterComponent={hasMore && !loading ? <ActivityIndicator color="#3B82F6" style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </View>
  );
}

const typeColor = (type) => {
  const map = { 'full-time': '#3B82F6', internship: '#8B5CF6', 'part-time': '#F59E0B', remote: '#10B981', contract: '#EF4444' };
  return map[type] || '#64748B';
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#F1F5F9' },
  postBtn: { backgroundColor: '#2563EB', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E2235', borderRadius: 12, marginHorizontal: 16,
    paddingHorizontal: 14, marginBottom: 12, borderWidth: 1, borderColor: '#2D3448',
  },
  searchInput: { flex: 1, height: 44, color: '#F1F5F9', fontSize: 14 },
  filterList: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: '#2D3448', backgroundColor: '#1E2235',
  },
  filterChipActive: { backgroundColor: '#1E3A5F', borderColor: '#3B82F6' },
  filterChipText: { color: '#64748B', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: '#60A5FA', fontWeight: '700' },
  jobHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
  jobCompany: { fontSize: 13, color: '#64748B' },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  typeText: { fontSize: 11, fontWeight: '700' },
  jobMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, color: '#64748B' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillPill: { backgroundColor: '#1E2D40', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  skillText: { fontSize: 11, color: '#60A5FA' },
});
