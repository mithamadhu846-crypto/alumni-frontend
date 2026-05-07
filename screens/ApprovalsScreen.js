// screens/ApprovalsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { eventAPI, startupAPI } from '../utils/api';

const TAB_COLORS = { events: '#3B82F6', startups: '#8B5CF6' };

export default function ApprovalsScreen({ navigation }) {
  const [tab,          setTab]         = useState('startups'); // 'startups' | 'events'
  const [startups,     setStartups]    = useState([]);
  const [events,       setEvents]      = useState([]);
  const [loading,      setLoading]     = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Load pending startups — fetch all and filter unapproved
      const sRes = await startupAPI.getPendingStartups();
      setStartups(sRes.data?.startups || []);
    } catch (e) {
      console.log('startups error:', e.message);
    }
    try {
      const eRes = await eventAPI.getEvents({ limit: 100 });
      setEvents((eRes.data?.events || []).filter(e => !e.isApproved));
    } catch (e) {
      console.log('events error:', e.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const approveStartup = async (id) => {
    try {
      await startupAPI.approveStartup(id);
      setStartups(prev => prev.filter(s => s._id !== id));
      Alert.alert('Approved', 'Startup is now live!');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Could not approve.');
    }
  };

  const approveEvent = async (id) => {
    try {
      await eventAPI.approveEvent(id);
      setEvents(prev => prev.filter(e => e._id !== id));
      Alert.alert('Approved', 'Event is now live!');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Could not approve.');
    }
  };

  const renderStartup = ({ item }) => (
    <View style={st.card}>
      <View style={st.cardHeader}>
        <View style={st.logoBox}>
          <Text style={st.logoText}>{item.name?.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={st.itemTitle}>{item.name}</Text>
          <Text style={st.itemSub}>{item.stage} · {item.sector || 'No sector'}</Text>
          <Text style={st.itemSub} numberOfLines={1}>
            By: {item.founders?.map(f => f.name).join(', ') || 'Unknown'}
          </Text>
        </View>
        <View style={st.pendingBadge}>
          <Text style={st.pendingText}>Pending</Text>
        </View>
      </View>
      <Text style={st.description} numberOfLines={2}>{item.description}</Text>
      <TouchableOpacity style={st.approveBtn} onPress={() => approveStartup(item._id)}>
        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
        <Text style={st.approveBtnText}>Approve Startup</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEvent = ({ item }) => (
    <View style={st.card}>
      <View style={st.cardHeader}>
        <View style={[st.logoBox, { backgroundColor: '#1E3A5F' }]}>
          <Text style={[st.logoText, { color: '#3B82F6' }]}>{item.title?.charAt(0)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={st.itemTitle}>{item.title}</Text>
          <Text style={st.itemSub}>{item.category} · {new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <View style={st.pendingBadge}>
          <Text style={st.pendingText}>Pending</Text>
        </View>
      </View>
      <Text style={st.description} numberOfLines={2}>{item.description}</Text>
      <TouchableOpacity style={[st.approveBtn, { backgroundColor: '#3B82F6' }]} onPress={() => approveEvent(item._id)}>
        <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
        <Text style={st.approveBtnText}>Approve Event</Text>
      </TouchableOpacity>
    </View>
  );

  const data     = tab === 'startups' ? startups : events;
  const renderer = tab === 'startups' ? renderStartup : renderEvent;
  const pending  = tab === 'startups'
    ? startups.filter(s => !s.isApproved).length
    : events.length;

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#94A3B8" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Approvals</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={st.tabs}>
        {['startups', 'events'].map(t => (
          <TouchableOpacity
            key={t}
            style={[st.tab, tab === t && { borderBottomColor: TAB_COLORS[t], borderBottomWidth: 2 }]}
            onPress={() => setTab(t)}
          >
            <Text style={[st.tabText, tab === t && { color: TAB_COLORS[t] }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'startups' && startups.filter(s => !s.isApproved).length > 0
                ? ` (${startups.filter(s => !s.isApproved).length})`
                : t === 'events' && events.length > 0 ? ` (${events.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 60 }} />
      ) : data.length === 0 ? (
        <View style={st.empty}>
          <Text style={st.emptyIcon}>{tab === 'startups' ? '🚀' : '📅'}</Text>
          <Text style={st.emptyTitle}>No pending {tab}</Text>
          <Text style={st.emptySub}>All caught up!</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={i => i._id}
          renderItem={renderer}
          contentContainerStyle={{ padding: 16 }}
          onRefresh={loadAll}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0F0F1A', paddingTop: 56 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#1A1A2E' },
  headerTitle:  { fontSize: 17, fontWeight: '700', color: '#F1F5F9' },
  tabs:         { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2D3448', marginHorizontal: 16 },
  tab:          { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText:      { fontSize: 14, fontWeight: '600', color: '#64748B' },
  card:         { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2D3448' },
  cardHeader:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  logoBox:      { width: 44, height: 44, borderRadius: 12, backgroundColor: '#2D1B69', alignItems: 'center', justifyContent: 'center' },
  logoText:     { fontSize: 18, fontWeight: '800', color: '#A78BFA' },
  itemTitle:    { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  itemSub:      { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  approvedBadge:{ backgroundColor: '#064E3B', borderColor: '#10B981' },
  pendingBadge: { backgroundColor: '#451A03', borderColor: '#F59E0B' },
  approvedText: { fontSize: 11, fontWeight: '700', color: '#6EE7B7' },
  pendingText:  { fontSize: 11, fontWeight: '700', color: '#FCD34D' },
  description:  { fontSize: 13, color: '#94A3B8', lineHeight: 19, marginBottom: 12 },
  approveBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#8B5CF6', borderRadius: 10, paddingVertical: 10 },
  approveBtnText:{ color: '#fff', fontSize: 14, fontWeight: '600' },
  empty:        { alignItems: 'center', paddingTop: 80 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: '#F1F5F9', marginBottom: 6 },
  emptySub:     { fontSize: 13, color: '#64748B' },
});