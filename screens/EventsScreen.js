// screens/EventsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { eventAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { EmptyState } from '../components/UI';
import { Card } from '../components/Card';

const CATEGORIES = ['all', 'workshop', 'seminar', 'networking', 'hackathon', 'webinar', 'reunion'];

export default function EventsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('all');
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  const canPost = ['alumni', 'faculty', 'admin'].includes(user?.role);

  const load = async () => {
    try {
      const params = { limit: 30 };
      if (category !== 'all') params.category = category;
      if (upcomingOnly) params.upcoming = true;
      const res = await eventAPI.getEvents(params);
      setEvents(res.data.events || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [category, upcomingOnly]);

  const registerEvent = async (id) => {
    try {
      await eventAPI.registerEvent(id);
      load();
    } catch {}
  };

  const renderEvent = ({ item }) => {
    const isRegistered = item.registrations?.includes(user?._id);
    const isFull = item.maxAttendees && item.registrations?.length >= item.maxAttendees;

    return (
      <Card>
        <View style={styles.eventHeader}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>{new Date(item.date).getDate()}</Text>
            <Text style={styles.dateMonth}>{new Date(item.date).toLocaleString('default', { month: 'short' })}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventOrg}>By {item.organizer?.name}</Text>
            <View style={styles.eventMeta}>
              <Ionicons name={item.isOnline ? 'globe-outline' : 'location-outline'} size={12} color="#64748B" />
              <Text style={styles.eventMetaText}>{item.isOnline ? 'Online' : item.venue}</Text>
            </View>
          </View>
          <View style={[styles.catBadge, { backgroundColor: catColor(item.category) + '22' }]}>
            <Text style={[styles.catText, { color: catColor(item.category) }]}>{item.category}</Text>
          </View>
        </View>

        <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>

        <View style={styles.eventFooter}>
          <View style={styles.attendeeCount}>
            <Ionicons name="people-outline" size={13} color="#64748B" />
            <Text style={styles.attendeeText}>
              {item.registrations?.length || 0}{item.maxAttendees ? `/${item.maxAttendees}` : ''} attending
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.registerBtn,
              isRegistered && styles.registeredBtn,
              isFull && !isRegistered && styles.fullBtn]}
            onPress={() => !isRegistered && !isFull && registerEvent(item._id)}
            disabled={isRegistered || isFull}
          >
            <Text style={[styles.registerText,
              isRegistered && { color: '#10B981' },
              isFull && !isRegistered && { color: '#64748B' }]}>
              {isRegistered ? '✓ Registered' : isFull ? 'Full' : 'Register'}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={[styles.upcomingToggle, upcomingOnly && styles.upcomingToggleActive]}
            onPress={() => setUpcomingOnly(!upcomingOnly)}
          >
            <Text style={[styles.upcomingText, upcomingOnly && { color: '#60A5FA' }]}>Upcoming</Text>
          </TouchableOpacity>
          {canPost && (
            <TouchableOpacity style={styles.postBtn} onPress={() => navigation.navigate('PostEvent')}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        horizontal data={CATEGORIES} keyExtractor={c => c}
        contentContainerStyle={styles.filterList} showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, category === item && styles.chipActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.chipText, category === item && styles.chipTextActive]}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 40 }} /> : (
        <FlatList
          data={events} keyExtractor={e => e._id} renderItem={renderEvent}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#8B5CF6" />}
          ListEmptyComponent={<EmptyState icon="calendar-outline" title="No events found" />}
        />
      )}
    </View>
  );
}

const catColor = (cat) => {
  const map = { workshop: '#3B82F6', seminar: '#8B5CF6', networking: '#10B981', hackathon: '#EF4444', webinar: '#F59E0B', reunion: '#EC4899' };
  return map[cat] || '#64748B';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#F1F5F9' },
  postBtn: { backgroundColor: '#7C3AED', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  upcomingToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#2D3448' },
  upcomingToggleActive: { backgroundColor: '#1E3A5F', borderColor: '#3B82F6' },
  upcomingText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  filterList: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#2D3448', backgroundColor: '#1E2235' },
  chipActive: { backgroundColor: '#1E1B40', borderColor: '#8B5CF6' },
  chipText: { color: '#64748B', fontSize: 13 },
  chipTextActive: { color: '#A78BFA', fontWeight: '700' },
  eventHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  dateBadge: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#2563EB22', borderWidth: 1, borderColor: '#2563EB44', alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 18, fontWeight: '800', color: '#60A5FA' },
  dateMonth: { fontSize: 9, color: '#60A5FA', fontWeight: '600' },
  eventTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
  eventOrg: { fontSize: 12, color: '#64748B' },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  eventMetaText: { fontSize: 12, color: '#64748B' },
  catBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  catText: { fontSize: 10, fontWeight: '700' },
  eventDesc: { fontSize: 13, color: '#94A3B8', marginBottom: 12, lineHeight: 18 },
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attendeeCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeeText: { fontSize: 12, color: '#64748B' },
  registerBtn: { backgroundColor: '#2563EB22', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: '#2563EB55' },
  registeredBtn: { backgroundColor: '#10B98122', borderColor: '#10B98155' },
  fullBtn: { backgroundColor: '#1E2235', borderColor: '#2D3448' },
  registerText: { fontSize: 13, color: '#60A5FA', fontWeight: '700' },
});
