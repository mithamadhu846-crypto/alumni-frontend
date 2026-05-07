// screens/PostJobScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { jobAPI } from '../utils/api';

const JOB_TYPES = ['full-time', 'part-time', 'internship', 'contract', 'remote'];

export default function PostJobScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '', company: '', location: '', type: 'full-time',
    description: '', requirements: '', skills: '',
    salaryMin: '', salaryMax: '', applyUrl: '', applyEmail: '', deadline: '',
  });

  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm(prev => ({ ...prev, [k]: v })); // ✅ SAFE UPDATE
  };

  const submit = async () => {
    if (!form.title.trim() || !form.company.trim() || !form.location.trim() || !form.description.trim()) {
      return Alert.alert('Missing fields', 'Title, company, location and description are required.');
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title.trim(),
        company: form.company.trim(),
        location: form.location.trim(),
        type: form.type,
        description: form.description.trim(),
        requirements: form.requirements.split('\n').map(s => s.trim()).filter(Boolean),
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        applyUrl: form.applyUrl.trim(),
        applyEmail: form.applyEmail.trim(),
      };

      if (form.salaryMin) {
        payload.salary = {
          min: Number(form.salaryMin) * 100000,
          max: Number(form.salaryMax || form.salaryMin) * 100000,
          currency: 'INR',
          period: 'yearly'
        };
      }

      if (form.deadline) payload.deadline = new Date(form.deadline);

      await jobAPI.createJob(payload);

      Alert.alert('Success!', 'Job posted successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not post job.');
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
          <Text style={s.title}>Post a Job</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Scroll */}
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always" // ✅ FIX
        >

          <Field label="Job Title *" value={form.title} onChange={v => set('title', v)} placeholder="e.g. Software Engineer" />
          <Field label="Company *" value={form.company} onChange={v => set('company', v)} placeholder="e.g. Google" />
          <Field label="Location *" value={form.location} onChange={v => set('location', v)} placeholder="e.g. Bangalore or Remote" />

          {/* Job Type */}
          <View style={s.field}>
            <Text style={s.label}>Job Type *</Text>
            <View style={s.typeRow}>
              {JOB_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.typeChip, form.type === t && s.typeChipActive]}
                  onPress={() => set('type', t)}
                >
                  <Text style={[s.typeText, form.type === t && s.typeTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Field label="Description *" value={form.description} onChange={v => set('description', v)} placeholder="Describe role..." multiline />
          <Field label="Requirements" value={form.requirements} onChange={v => set('requirements', v)} placeholder="Each line..." multiline />
          <Field label="Skills" value={form.skills} onChange={v => set('skills', v)} placeholder="React, Node" />

          {/* Salary */}
          <View style={s.row}>
            <Field label="Min Salary" value={form.salaryMin} onChange={v => set('salaryMin', v)} keyboardType="numeric" />
            <View style={{ width: 10 }} />
            <Field label="Max Salary" value={form.salaryMax} onChange={v => set('salaryMax', v)} keyboardType="numeric" />
          </View>

          <Field label="Apply URL" value={form.applyUrl} onChange={v => set('applyUrl', v)} />
          <Field label="Apply Email" value={form.applyEmail} onChange={v => set('applyEmail', v)} keyboardType="email-address" />
          <Field label="Deadline" value={form.deadline} onChange={v => set('deadline', v)} placeholder="YYYY-MM-DD" />

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, loading && { opacity: 0.6 }]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="briefcase-outline" size={18} color="#fff" />
                <Text style={s.submitText}>Post Job</Text>
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

//////////////////////////////////////////////////////////////
// ✅ MOVED OUTSIDE (VERY IMPORTANT FIX)
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
  typeChipActive: { backgroundColor: '#1E3A5F', borderColor: '#3B82F6' },
  typeText: { fontSize: 12, color: '#64748B' },
  typeTextActive: { color: '#60A5FA', fontWeight: '700' },
  row: { flexDirection: 'row' },
  submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});