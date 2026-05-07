// screens/StartupsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Linking, Modal,
  TextInput, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { startupAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const STAGES = ['All', 'Idea', 'Mvp', 'Early-stage', 'Growth', 'Scaling'];
const STAGE_KEYS = ['all', 'idea', 'mvp', 'early-stage', 'growth', 'scaling'];
const STAGE_COLORS = {
  idea: '#F59E0B', mvp: '#8B5CF6', 'early-stage': '#3B82F6',
  growth: '#10B981', scaling: '#EF4444', acquired: '#EC4899',
};

function Field({ label, fieldKey, placeholder, keyboardType = 'default', multiline = false, form, setForm }) {
  return (
    <View style={m.field}>
      <Text style={m.label}>{label}</Text>
      <TextInput
        style={[m.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        value={form[fieldKey]}
        onChangeText={v => setForm(p => ({ ...p, [fieldKey]: v }))}
        keyboardType={keyboardType}
        multiline={multiline}
        blurOnSubmit={false}
      />
    </View>
  );
}

function PostStartupModal({ visible, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '', tagline: '', description: '', sector: '',
    stage: 'idea', website: '', teamSize: '', foundedYear: '',
    isHiring: false,
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      return Alert.alert('Required', 'Please fill in Name and Description.');
    }
    setLoading(true);
    try {
      await startupAPI.createStartup({
        ...form,
        teamSize:    form.teamSize    ? parseInt(form.teamSize)    : undefined,
        foundedYear: form.foundedYear ? parseInt(form.foundedYear) : undefined,
      });
      Alert.alert('Success', 'Startup submitted for approval!');
      onSuccess();
      onClose();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Could not post startup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={m.container}>
        <View style={m.header}>
          <Text style={m.title}>Post Your Startup</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="always" keyboardDismissMode="none">
          <Field label="Startup Name *"    fieldKey="name"        placeholder="e.g. TechVenture"                    form={form} setForm={setForm} />
          <Field label="Tagline"           fieldKey="tagline"     placeholder="One line description"                 form={form} setForm={setForm} />
          <Field label="Description *"     fieldKey="description" placeholder="What does your startup do?" multiline form={form} setForm={setForm} />
          <Field label="Sector"            fieldKey="sector"      placeholder="e.g. Fintech, EdTech, HealthTech"     form={form} setForm={setForm} />
          <Field label="Website"           fieldKey="website"     placeholder="https://yourstartup.com"              form={form} setForm={setForm} />
          <Field label="Team Size"         fieldKey="teamSize"    placeholder="e.g. 5" keyboardType="numeric"        form={form} setForm={setForm} />
          <Field label="Founded Year"      fieldKey="foundedYear" placeholder="e.g. 2023" keyboardType="numeric"     form={form} setForm={setForm} />

          <Text style={m.label}>Stage</Text>
          <View style={m.stageRow}>
            {STAGE_KEYS.filter(s => s !== 'all').map(s => (
              <TouchableOpacity
                key={s}
                style={[m.stageChip, form.stage === s && { backgroundColor: (STAGE_COLORS[s] || '#3B82F6') + '33', borderColor: STAGE_COLORS[s] || '#3B82F6' }]}
                onPress={() => setForm(p => ({ ...p, stage: s }))}
              >
                <Text style={[m.stageChipText, form.stage === s && { color: STAGE_COLORS[s] || '#3B82F6' }]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[m.hiringToggle, form.isHiring && m.hiringActive]}
            onPress={() => setForm(p => ({ ...p, isHiring: !p.isHiring }))}
          >
            <Ionicons name="briefcase-outline" size={16} color={form.isHiring ? '#10B981' : '#64748B'} />
            <Text style={[m.hiringText, form.isHiring && { color: '#10B981' }]}>
              {form.isHiring ? 'Currently Hiring ✓' : 'Currently Hiring?'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[m.submitBtn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={m.submitText}>Submit Startup</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function StartupsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [startups,   setStartups]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stageIdx,   setStageIdx]   = useState(0);
  const [hiringOnly, setHiringOnly] = useState(false);
  const [showPost,   setShowPost]   = useState(false);

  const load = async () => {
    try {
      const params = { limit: 30 };
      const stageKey = STAGE_KEYS[stageIdx];
      if (stageKey !== 'all') params.stage = stageKey;
      if (hiringOnly) params.hiring = true;
      const res = await startupAPI.getStartups(params);
      setStartups(res.data.startups || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, [stageIdx, hiringOnly]);

  const handleLike = async (id) => {
    try {
      const res = await startupAPI.likeStartup(id);
      setStartups(prev => prev.map(s =>
        s._id === id
          ? { ...s, likes: res.data.liked ? [...(s.likes||[]), user._id] : (s.likes||[]).filter(l => l !== user._id) }
          : s
      ));
    } catch {}
  };

  const renderStartup = ({ item }) => {
    const stageColor = STAGE_COLORS[item.stage] || '#64748B';
    const liked = item.likes?.includes(user?._id);
    return (
      <View style={styles.card}>
        <View style={styles.startupHeader}>
          <View style={[styles.logoBox, { backgroundColor: stageColor + '22' }]}>
            <Text style={[styles.logoText, { color: stageColor }]}>{item.name?.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.startupName}>{item.name}</Text>
            {item.tagline && <Text style={styles.tagline} numberOfLines={1}>{item.tagline}</Text>}
            <View style={styles.metaRow}>
              <View style={[styles.stageBadge, { backgroundColor: stageColor + '22' }]}>
                <Text style={[styles.stageText, { color: stageColor }]}>{item.stage}</Text>
              </View>
              {item.sector && <Text style={styles.sector}>· {item.sector}</Text>}
            </View>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>{item.description}</Text>

        {item.founders?.length > 0 && (
          <View style={styles.foundersRow}>
            <Text style={styles.foundersLabel}>By </Text>
            {item.founders.slice(0, 3).map((f, i) => (
              <TouchableOpacity key={f._id || i} onPress={() => navigation.navigate('UserProfile', { userId: f._id })}>
                <Text style={styles.founderName}>{f.name}{i < Math.min(item.founders.length, 3) - 1 ? ', ' : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            {item.isHiring && (
              <View style={styles.hiringBadge}>
                <Ionicons name="briefcase-outline" size={10} color="#10B981" />
                <Text style={styles.hiringText}>Hiring</Text>
              </View>
            )}
            {item.teamSize && (
              <View style={styles.metaChip}>
                <Ionicons name="people-outline" size={10} color="#64748B" />
                <Text style={styles.metaChipText}>{item.teamSize}</Text>
              </View>
            )}
            {item.foundedYear && <Text style={styles.year}>Est. {item.foundedYear}</Text>}
          </View>
          <View style={styles.footerRight}>
            <TouchableOpacity style={styles.likeBtn} onPress={() => handleLike(item._id)}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#EF4444' : '#64748B'} />
              <Text style={[styles.likeCount, liked && { color: '#EF4444' }]}>{item.likes?.length || 0}</Text>
            </TouchableOpacity>
            {item.website && (
              <TouchableOpacity style={styles.webBtn} onPress={() => Linking.openURL(item.website)}>
                <Ionicons name="globe-outline" size={15} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Startup Hub 🚀</Text>
          <Text style={styles.subtitle}>Alumni-built ventures</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.hiringToggle, hiringOnly && styles.hiringToggleActive]}
            onPress={() => setHiringOnly(!hiringOnly)}
          >
            <Ionicons name="briefcase-outline" size={13} color={hiringOnly ? '#10B981' : '#64748B'} />
            <Text style={[styles.hiringToggleText, hiringOnly && { color: '#10B981' }]}>Hiring</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.postBtn} onPress={() => setShowPost(true)}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Fixed-size filter chips ── */}
      <View style={styles.filterRow}>
        {STAGES.map((label, i) => {
          const key = STAGE_KEYS[i];
          const color = STAGE_COLORS[key] || '#3B82F6';
          const active = stageIdx === i;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, active && { backgroundColor: color + '22', borderColor: color }]}
              onPress={() => setStageIdx(i)}
            >
              <Text style={[styles.chipText, active && { color, fontWeight: '700' }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={startups}
          keyExtractor={s => s._id}
          renderItem={renderStartup}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#8B5CF6" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🚀</Text>
              <Text style={styles.emptyTitle}>No startups yet</Text>
              <Text style={styles.emptySubtitle}>Be the first to showcase your venture!</Text>
              <TouchableOpacity style={styles.postBtn2} onPress={() => setShowPost(true)}>
                <Text style={styles.postBtn2Text}>+ Post Your Startup</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <PostStartupModal visible={showPost} onClose={() => setShowPost(false)} onSuccess={load} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#0F0F1A', paddingTop: 56 },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  title:             { fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
  subtitle:          { fontSize: 12, color: '#64748B', marginTop: 2 },
  headerRight:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hiringToggle:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#2D3448', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  hiringToggleActive:{ borderColor: '#10B981', backgroundColor: '#10B98122' },
  hiringToggleText:  { fontSize: 12, color: '#64748B', fontWeight: '600' },
  postBtn:           { width: 36, height: 36, borderRadius: 10, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },

  // ── Fixed filter row — each chip same width ──
  filterRow:         { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 12, gap: 6 },
  chip:              { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#2D3448', backgroundColor: '#1E2235' },
  chipText:          { color: '#64748B', fontSize: 11, fontWeight: '600' },

  card:              { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2D3448' },
  startupHeader:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  logoBox:           { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoText:          { fontSize: 20, fontWeight: '800' },
  startupName:       { fontSize: 16, fontWeight: '800', color: '#F1F5F9' },
  tagline:           { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  metaRow:           { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  stageBadge:        { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  stageText:         { fontSize: 10, fontWeight: '700' },
  sector:            { fontSize: 11, color: '#64748B' },
  description:       { fontSize: 13, color: '#94A3B8', lineHeight: 19, marginBottom: 12 },
  foundersRow:       { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 },
  foundersLabel:     { fontSize: 12, color: '#64748B' },
  founderName:       { fontSize: 12, color: '#60A5FA', fontWeight: '600' },
  footer:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#2D3448' },
  footerLeft:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hiringBadge:       { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#10B98122', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  hiringText:        { fontSize: 10, color: '#10B981', fontWeight: '700' },
  metaChip:          { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaChipText:      { fontSize: 11, color: '#64748B' },
  year:              { fontSize: 11, color: '#475569' },
  footerRight:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  likeBtn:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount:         { fontSize: 13, color: '#64748B', fontWeight: '600' },
  webBtn:            { backgroundColor: '#1E3A5F', width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty:             { alignItems: 'center', paddingTop: 60 },
  emptyIcon:         { fontSize: 48, marginBottom: 12 },
  emptyTitle:        { fontSize: 18, fontWeight: '700', color: '#F1F5F9', marginBottom: 6 },
  emptySubtitle:     { fontSize: 13, color: '#64748B', marginBottom: 20 },
  postBtn2:          { backgroundColor: '#8B5CF6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  postBtn2Text:      { color: '#fff', fontWeight: '700', fontSize: 14 },
});

const m = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#0F0F1A' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: '#1E2235' },
  title:         { fontSize: 18, fontWeight: '700', color: '#F1F5F9' },
  field:         { marginBottom: 14 },
  label:         { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 6 },
  input:         { backgroundColor: '#1E2235', borderRadius: 10, padding: 12, color: '#F1F5F9', fontSize: 14, borderWidth: 1, borderColor: '#2D3448' },
  stageRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  stageChip:     { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#2D3448', backgroundColor: '#1E2235' },
  stageChipText: { fontSize: 12, color: '#64748B' },
  hiringToggle:  { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#2D3448', marginBottom: 20 },
  hiringActive:  { borderColor: '#10B981', backgroundColor: '#10B98122' },
  hiringText:    { fontSize: 14, color: '#64748B', fontWeight: '600' },
  submitBtn:     { backgroundColor: '#8B5CF6', padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 40 },
  submitText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});