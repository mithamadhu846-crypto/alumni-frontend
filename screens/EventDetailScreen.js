// screens/EventDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { eventAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Avatar } from '../components/UI';
import { Card } from '../components/Card';

const CAT_COLORS = {
  workshop: '#3B82F6', seminar: '#8B5CF6', networking: '#10B981',
  hackathon: '#EF4444', webinar: '#F59E0B', reunion: '#EC4899', other: '#64748B',
};

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params || {};
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    eventAPI.getEvents({ limit: 100 })
      .then(res => {
        const found = res.data.events?.find(e => e._id === eventId);
        setEvent(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventId]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await eventAPI.registerEvent(eventId);
      setEvent(prev => ({ ...prev, registrations: [...(prev.registrations || []), user._id] }));
      Alert.alert('Registered!', 'You are now registered for this event.');
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Registration failed.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#8B5CF6" /></View>;
  if (!event) return <View style={styles.loading}><Text style={{ color: '#fff' }}>Event not found.</Text></View>;

  const isRegistered = event.registrations?.includes(user?._id);
  const isFull = event.maxAttendees && event.registrations?.length >= event.maxAttendees;
  const isPast = new Date(event.date) < new Date();
  const catColor = CAT_COLORS[event.category] || '#64748B';
  const eventDate = new Date(event.date);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={[catColor + 'DD', '#0F0F1A']} style={styles.hero}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          <View style={[styles.catBadge, { backgroundColor: catColor + '33', borderColor: catColor }]}>
            <Text style={[styles.catText, { color: catColor }]}>{event.category?.toUpperCase()}</Text>
          </View>

          <Text style={styles.eventTitle}>{event.title}</Text>

          {/* Date block */}
          <View style={styles.dateBlock}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{eventDate.getDate()}</Text>
              <Text style={styles.dateMon}>{eventDate.toLocaleString('default', { month: 'short' }).toUpperCase()}</Text>
              <Text style={styles.dateYear}>{eventDate.getFullYear()}</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeText}>
                {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {event.endDate && (
                <Text style={styles.timeEnd}>
                  – {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
              <View style={styles.venueRow}>
                <Ionicons name={event.isOnline ? 'globe-outline' : 'location-outline'} size={14} color="#94A3B8" />
                <Text style={styles.venueText}>{event.isOnline ? 'Online Event' : event.venue}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{event.registrations?.length || 0}</Text>
              <Text style={styles.statLabel}>Registered</Text>
            </View>
            {event.maxAttendees && (
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{event.maxAttendees - (event.registrations?.length || 0)}</Text>
                <Text style={styles.statLabel}>Seats Left</Text>
              </View>
            )}
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{isPast ? '✓' : `${Math.ceil((eventDate - new Date()) / 86400000)}d`}</Text>
              <Text style={styles.statLabel}>{isPast ? 'Ended' : 'To Go'}</Text>
            </View>
          </View>

          {/* Organizer */}
          {event.organizer && (
            <Card>
              <Text style={styles.sectionTitle}>Organized by</Text>
              <TouchableOpacity
                style={styles.organizerRow}
                onPress={() => navigation.navigate('UserProfile', { userId: event.organizer._id })}
              >
                <Avatar name={event.organizer.name} uri={event.organizer.avatar} size={40} color={catColor} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.organizerName}>{event.organizer.name}</Text>
                  <Text style={styles.organizerRole}>{event.organizer.role}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#475569" />
              </TouchableOpacity>
            </Card>
          )}

          {/* Description */}
          <Card>
            <Text style={styles.sectionTitle}>About this Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </Card>

          {/* Online link */}
          {event.isOnline && event.meetLink && (
            <Card>
              <Text style={styles.sectionTitle}>Join Link</Text>
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => Linking.openURL(event.meetLink)}
              >
                <Ionicons name="videocam-outline" size={18} color="#3B82F6" />
                <Text style={styles.linkText}>Join Online Meeting</Text>
                <Ionicons name="open-outline" size={14} color="#3B82F6" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </Card>
          )}

          {/* Tags */}
          {event.tags?.length > 0 && (
            <View style={styles.tagsRow}>
              {event.tags.map(t => (
                <View key={t} style={[styles.tag, { borderColor: catColor + '55' }]}>
                  <Text style={[styles.tagText, { color: catColor }]}>#{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Target audience */}
          {event.targetRoles?.length > 0 && (
            <Card>
              <Text style={styles.sectionTitle}>For</Text>
              <View style={styles.audienceRow}>
                {event.targetRoles.map(r => (
                  <View key={r} style={styles.audiencePill}>
                    <Text style={styles.audienceText}>{r}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Register CTA */}
      {!isPast && (
        <View style={styles.registerBar}>
          <View style={styles.regInfo}>
            <Text style={styles.regCount}>{event.registrations?.length || 0} people registered</Text>
            {event.registrationDeadline && (
              <Text style={styles.regDeadline}>
                Register by {new Date(event.registrationDeadline).toLocaleDateString()}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.regBtn,
              isRegistered && styles.regBtnDone,
              isFull && !isRegistered && styles.regBtnFull,
            ]}
            onPress={handleRegister}
            disabled={isRegistered || isFull || registering}
          >
            {registering ? <ActivityIndicator size="small" color="#fff" /> : (
              <>
                <Ionicons
                  name={isRegistered ? 'checkmark-circle' : 'calendar-outline'}
                  size={16} color="#fff"
                />
                <Text style={styles.regBtnText}>
                  {isRegistered ? 'Registered ✓' : isFull ? 'Event Full' : 'Register Free'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' },
  hero: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 30 },
  backBtn: { marginBottom: 16 },
  catBadge: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 12 },
  catText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  eventTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 20, lineHeight: 30 },
  dateBlock: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 14 },
  dateBox: { alignItems: 'center', paddingRight: 16, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.15)', marginRight: 16 },
  dateDay: { fontSize: 32, fontWeight: '900', color: '#fff' },
  dateMon: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  dateYear: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  timeBox: {},
  timeText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  timeEnd: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  venueText: { fontSize: 13, color: '#94A3B8' },
  content: { padding: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox: { flex: 1, backgroundColor: '#1E2235', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2D3448' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#F1F5F9' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', marginBottom: 12 },
  organizerRow: { flexDirection: 'row', alignItems: 'center' },
  organizerName: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  organizerRole: { fontSize: 12, color: '#64748B', marginTop: 2 },
  description: { fontSize: 14, color: '#CBD5E1', lineHeight: 22 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1E3A5F', borderRadius: 10, padding: 14 },
  linkText: { fontSize: 14, color: '#60A5FA', fontWeight: '600' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: '600' },
  audienceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  audiencePill: { backgroundColor: '#1E2235', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  audienceText: { fontSize: 13, color: '#94A3B8', textTransform: 'capitalize' },
  registerBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0F172A', borderTopWidth: 1, borderTopColor: '#1E2235',
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
  },
  regInfo: { flex: 1 },
  regCount: { fontSize: 13, fontWeight: '600', color: '#F1F5F9' },
  regDeadline: { fontSize: 11, color: '#64748B', marginTop: 2 },
  regBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#8B5CF6', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  regBtnDone: { backgroundColor: '#10B981' },
  regBtnFull: { backgroundColor: '#374151' },
  regBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
