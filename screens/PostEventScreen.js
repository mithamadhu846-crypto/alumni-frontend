// screens/PostEventScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { eventAPI } from '../utils/api';

const CATEGORIES = ['workshop', 'seminar', 'networking', 'hackathon', 'webinar', 'reunion', 'other'];

export default function PostEventScreen({ navigation }) {

  const [form, setForm] = useState({
    title: '', description: '', category: 'workshop',
    date: '', venue: '', isOnline: false, meetLink: '',
    maxAttendees: '', tags: '',
  });

  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v })); // ✅ SAFE UPDATE
  };

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.date.trim()) {
      return Alert.alert('Missing fields', 'Title, description and date are required.');
    }

    const dateObj = new Date(form.date);
    if (isNaN(dateObj.getTime())) {
      return Alert.alert('Invalid date', 'Use format: YYYY-MM-DD HH:MM');
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        date: dateObj,
        isOnline: form.isOnline,
        venue: form.isOnline ? 'Online' : form.venue.trim(),
        meetLink: form.meetLink.trim(),
        maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : undefined,
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
        targetRoles: ['all'],
      };

      await eventAPI.createEvent(payload);

      Alert.alert('Submitted!', 'Your event is pending admin approval.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);

    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.container}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#94A3B8" />
          </TouchableOpacity>
          <Text style={s.title}>Create Event</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Scroll */}
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always" // ✅ FIX
        >

          <Field label="Event Title *" value={form.title} onChange={v => set('title', v)} placeholder="e.g. Web Dev Workshop 2025" />
          <Field label="Description *" value={form.description} onChange={v => set('description', v)} placeholder="What is this event about?" multiline />

          {/* Category */}
          <View style={s.field}>
            <Text style={s.label}>Category *</Text>
            <View style={s.typeRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[s.typeChip, form.category === c && s.typeChipActive]}
                  onPress={() => set('category', c)}
                >
                  <Text style={[s.typeText, form.category === c && s.typeTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Field label="Date & Time * (YYYY-MM-DD HH:MM)" value={form.date} onChange={v => set('date', v)} placeholder="2025-08-15 10:00" />

          {/* Online Switch */}
          <View style={[s.field, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Text style={s.label}>Online Event</Text>
            <Switch
              value={form.isOnline}
              onValueChange={v => set('isOnline', v)}
              trackColor={{ false: '#2D3448', true: '#1D4ED8' }}
              thumbColor={form.isOnline ? '#60A5FA' : '#64748B'}
            />
          </View>

          {form.isOnline
            ? <Field label="Meeting Link" value={form.meetLink} onChange={v => set('meetLink', v)} placeholder="https://meet.google.com/" />
            : <Field label="Venue" value={form.venue} onChange={v => set('venue', v)} placeholder="Seminar Hall" />
          }

          <Field label="Max Attendees" value={form.maxAttendees} onChange={v => set('maxAttendees', v)} keyboardType="numeric" />
          <Field label="Tags" value={form.tags} onChange={v => set('tags', v)} placeholder="react, javascript" />

          {/* Info */}
          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#60A5FA" />
            <Text style={s.infoText}>
              Events require admin approval before they appear publicly.
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, loading && { opacity: 0.6 }]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="calendar-outline" size={18} color="#fff" />
                <Text style={s.submitText}>Submit Event</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

//////////////////////////////////////////////////////////////
// ✅ FIX: MOVE FIELD OUTSIDE
//////////////////////////////////////////////////////////////
const Field = ({ label, value, onChange, placeholder, multiline, keyboardType }) => (
  <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    <TextInput
      style={[s.input, multiline && s.multiline]}
      placeholder={placeholder}
      placeholderTextColor="#475569"
      value={value}
      onChangeText={onChange}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      keyboardType={keyboardType || 'default'}
      blurOnSubmit={false} // ✅ FIX
    />
  </View>
);

//////////////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////////////
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: '#F1F5F9' },
  scroll: { padding: 20, paddingBottom: 40 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 6 },
  input: { backgroundColor: '#1E2235', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#F1F5F9', borderWidth: 1, borderColor: '#2D3448' },
  multiline: { height: 100, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#1E2235', borderWidth: 1, borderColor: '#2D3448' },
  typeChipActive: { backgroundColor: '#1A2E1A', borderColor: '#10B981' },
  typeText: { fontSize: 12, color: '#64748B' },
  typeTextActive: { color: '#10B981', fontWeight: '700' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1E2D40', borderRadius: 10, padding: 12, marginBottom: 16 },
  infoText: { fontSize: 12, color: '#60A5FA', flex: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#059669', borderRadius: 14, paddingVertical: 16 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});