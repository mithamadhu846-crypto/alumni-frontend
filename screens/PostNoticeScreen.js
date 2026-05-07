// screens/PostNoticeScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { noticeAPI } from '../utils/api';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const TARGETS = ['all', 'student', 'alumni', 'faculty'];

export default function PostNoticeScreen({ navigation }) {
  const [form, setForm] = useState({ title: '', content: '', priority: 'medium', targetRoles: ['all'] });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleTarget = (role) => {
    setForm(p => ({
      ...p,
      targetRoles: p.targetRoles.includes(role)
        ? p.targetRoles.filter(r => r !== role)
        : [...p.targetRoles, role],
    }));
  };

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      return Alert.alert('Missing fields', 'Title and content are required.');
    }
    setLoading(true);
    try {
      await noticeAPI.createNotice({
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority,
        targetRoles: form.targetRoles.length ? form.targetRoles : ['all'],
      });
      Alert.alert('Posted!', 'Notice has been posted.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not post notice.');
    } finally { setLoading(false); }
  };

  const priorityColor = { low: '#10B981', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#94A3B8" />
          </TouchableOpacity>
          <Text style={s.title}>Post Notice</Text>
          <View style={{ width: 22 }} />
        </View>
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.label}>Title *</Text>
          <TextInput style={s.input} placeholder="Notice title" placeholderTextColor="#475569"
            value={form.title} onChangeText={v => set('title', v)} />

          <Text style={s.label}>Content *</Text>
          <TextInput style={[s.input, { height: 140, textAlignVertical: 'top' }]}
            placeholder="Write the notice content..." placeholderTextColor="#475569"
            value={form.content} onChangeText={v => set('content', v)} multiline />

          <Text style={s.label}>Priority</Text>
          <View style={s.row}>
            {PRIORITIES.map(p => (
              <TouchableOpacity key={p}
                style={[s.chip, form.priority === p && { backgroundColor: priorityColor[p] + '22', borderColor: priorityColor[p] }]}
                onPress={() => set('priority', p)}>
                <Text style={[s.chipText, form.priority === p && { color: priorityColor[p], fontWeight: '700' }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Target Audience</Text>
          <View style={s.row}>
            {TARGETS.map(t => (
              <TouchableOpacity key={t}
                style={[s.chip, form.targetRoles.includes(t) && s.chipActive]}
                onPress={() => toggleTarget(t)}>
                <Text style={[s.chipText, form.targetRoles.includes(t) && s.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <><Ionicons name="megaphone-outline" size={18} color="#fff" /><Text style={s.btnText}>Post Notice</Text></>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: '#F1F5F9' },
  scroll: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 6, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1E2235', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#F1F5F9', fontSize: 14, borderWidth: 1, borderColor: '#2D3448', marginBottom: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E2235', borderWidth: 1, borderColor: '#2D3448' },
  chipActive: { backgroundColor: '#1E3A5F', borderColor: '#3B82F6' },
  chipText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#60A5FA', fontWeight: '700' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#D97706', borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
