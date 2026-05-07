// screens/CareerScreen.js
// ✅ FIX 2: AI-based dynamic career guidance (not static Entry/Mid/Senior)
// ✅ FIX 3: Skill gap analyzer fully working with match score, missing skills, roadmap
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { careerAPI, userAPI, chatbotAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const TABS = ['🗺 Roadmap', '📊 Skill Gap', '🤖 AI Insights'];

export default function CareerScreen({ navigation }) {
  const { user } = useAuth();
  const [tab,        setTab]        = useState(0);
  const [roadmap,    setRoadmap]    = useState(null);
  const [skillGap,   setSkillGap]   = useState(null);
  const [insights,   setInsights]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [targetRole, setTargetRole] = useState(user?.targetRole || '');
  const [editing,    setEditing]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const scoreAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchAll(user?.targetRole); }, []);

  const fetchAll = async (role) => {
    setLoading(true);
    try {
      const [rRes, sRes, iRes] = await Promise.allSettled([
        careerAPI.getRoadmap({ targetRole: role }),
        userAPI.getSkillGap({ targetRole: role }),
        chatbotAPI.getCareerInsights(),
      ]);
      if (rRes.status === 'fulfilled') setRoadmap(rRes.value?.data);
      if (sRes.status === 'fulfilled') {
        const gapData = sRes.value?.data;
        setSkillGap(gapData);
        Animated.timing(scoreAnim, {
          toValue: gapData?.matchPercentage || 0,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }
      if (iRes.status === 'fulfilled') setInsights(iRes.value?.data?.insights || []);
    } catch (e) {
      console.log('Career fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveRole = async () => {
    if (!targetRole.trim()) return Alert.alert('Error', 'Please enter a target role');
    setSaving(true);
    try {
      await userAPI.updateProfile({ targetRole: targetRole.trim() });
      setEditing(false);
      await fetchAll(targetRole.trim());
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const widthInterp = scoreAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const scoreColor = (s) => s >= 70 ? '#10B981' : s >= 40 ? '#F59E0B' : '#EF4444';

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text style={s.loadingTxt}>Building your career plan...</Text>
    </View>
  );

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

      {/* Header */}
      <LinearGradient colors={['#1E1B4B', '#312E81', '#4338CA']} style={s.hero}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color="#94A3B8" />
        </TouchableOpacity>
        <Text style={s.heroTitle}>🚀 Career Guidance</Text>
        <Text style={s.heroSub}>AI-powered path for {user?.name?.split(' ')[0] || 'you'}</Text>

        {/* Target Role */}
        {editing ? (
          <View style={s.editRow}>
            <TextInput
              style={s.roleInput}
              placeholder="e.g. Software Engineer, Data Scientist"
              placeholderTextColor="#6366F1"
              value={targetRole}
              onChangeText={setTargetRole}
              autoFocus
            />
            <TouchableOpacity style={s.saveBtn} onPress={saveRole} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.saveTxt}>Save</Text>
              }
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.roleChip} onPress={() => setEditing(true)}>
            <Ionicons name="flag-outline" size={14} color="#A5B4FC" />
            <Text style={s.roleChipTxt}>
              {roadmap?.targetRole || user?.targetRole || 'Set target role'} ✎
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={i} onPress={() => setTab(i)} style={[s.tab, tab === i && s.tabActive]}>
            <Text style={[s.tabTxt, tab === i && s.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.content}>

        {/* ─── TAB 0: ROADMAP ─── */}
        {tab === 0 && (
          <>
            {!roadmap?.roadmap?.milestones
              ? <EmptyCard msg="Set a target role above to generate your roadmap" icon="🗺" />
              : roadmap.roadmap.milestones.map((m, i) => {
                const isCurrent = i + 1 === (roadmap.currentLevel || 1);
                return (
                  <View key={i} style={[s.milestoneCard, isCurrent && s.milestoneActive]}>
                    <View style={s.milestoneHeader}>
                      <View style={[s.levelBadge, isCurrent && { backgroundColor: '#4338CA' }]}>
                        <Text style={s.levelNum}>L{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.milestoneTitle}>{m.title}</Text>
                        <Text style={s.milestoneTime}>⏱ {m.timeframe}</Text>
                      </View>
                      {isCurrent && (
                        <View style={s.currentBadge}>
                          <Text style={s.currentBadgeTxt}>📍 You</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.skillsRow}>
                      {(m.skills || []).map((sk, j) => (
                        <View key={j} style={s.skillChip}>
                          <Text style={s.skillChipTxt}>{String(sk)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })
            }
          </>
        )}

        {/* ─── TAB 1: SKILL GAP ─── */}
        {tab === 1 && (
          <>
            {!skillGap
              ? <EmptyCard msg="No skill gap data — set a target role first" icon="📊" />
              : <>
                {/* Score */}
                <View style={s.scoreCard}>
                  <Text style={s.scoreLabel}>Match Score</Text>
                  <Text style={[s.scoreBig, { color: scoreColor(skillGap.matchPercentage || 0) }]}>
                    {skillGap.matchPercentage || 0}%
                  </Text>
                  <View style={s.barBg}>
                    <Animated.View style={[s.barFill, {
                      width: widthInterp,
                      backgroundColor: scoreColor(skillGap.matchPercentage || 0),
                    }]} />
                  </View>
                  <Text style={s.scoreHint}>
                    {(skillGap.matchPercentage || 0) >= 70
                      ? '🎉 Strong match! Keep building.'
                      : (skillGap.matchPercentage || 0) >= 40
                      ? '📈 Good progress. Focus on gaps below.'
                      : '🔥 Early stage. Start with top missing skills.'}
                  </Text>
                </View>

                {/* Missing Skills */}
                {(skillGap.gaps?.length > 0) && (
                  <>
                    <Text style={s.sectionTitle}>⚠️ Missing Skills ({skillGap.gaps.length})</Text>
                    {skillGap.gaps.map((g, i) => (
                      <View key={i} style={s.gapCard}>
                        <View style={s.gapRow}>
                          <Text style={s.gapSkill}>{g.skill}</Text>
                          <Text style={s.gapFreq}>{g.frequency}/{g.total} alumni have this</Text>
                        </View>
                        <View style={s.barBgSm}>
                          <View style={[s.barFillSm, {
                            width: `${g.total ? (g.frequency / g.total) * 100 : 0}%`,
                          }]} />
                        </View>
                        <Text style={s.gapPriority}>
                          Priority: {g.frequency > (g.total * 0.7) ? '🔴 High' : g.frequency > (g.total * 0.4) ? '🟡 Medium' : '🟢 Low'}
                        </Text>
                      </View>
                    ))}
                  </>
                )}

                {/* Strengths */}
                {(skillGap.strengths?.length > 0) && (
                  <>
                    <Text style={s.sectionTitle}>✅ Your Strengths ({skillGap.strengths.length})</Text>
                    <View style={s.strengthsWrap}>
                      {skillGap.strengths.map((sk, i) => (
                        <View key={i} style={s.strengthChip}>
                          <Text style={s.strengthTxt}>✓ {sk.skill || sk}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Learning Roadmap */}
                {(skillGap.gaps?.length > 0) && (
                  <>
                    <Text style={s.sectionTitle}>📚 Learning Roadmap</Text>
                    {skillGap.gaps.slice(0, 5).map((g, i) => (
                      <View key={i} style={s.roadmapItem}>
                        <View style={s.roadmapNum}>
                          <Text style={s.roadmapNumTxt}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.roadmapSkill}>{g.skill}</Text>
                          <Text style={s.roadmapAction}>
                            {i === 0 ? '→ Start this week' : i === 1 ? '→ Start next week' : `→ Month ${i + 1}`}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </>
            }
          </>
        )}

        {/* ─── TAB 2: AI INSIGHTS ─── */}
        {tab === 2 && (
          <>
            {!insights || insights.length === 0
              ? <EmptyCard msg="AI insights loading..." icon="🤖" />
              : insights.map((ins, i) => (
                <View key={i} style={[s.insightCard, { borderLeftColor: ins.color || '#8B5CF6' }]}>
                  <View style={s.insightHeader}>
                    <Text style={s.insightIcon}>{ins.icon}</Text>
                    <Text style={s.insightTitle}>{ins.title}</Text>
                  </View>
                  <Text style={s.insightBody}>{ins.body}</Text>
                </View>
              ))
            }
          </>
        )}

      </View>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const EmptyCard = ({ msg, icon }) => (
  <View style={s.emptyCard}>
    <Text style={{ fontSize: 36 }}>{icon}</Text>
    <Text style={s.emptyTxt}>{msg}</Text>
  </View>
);

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0F0F1A' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F0F1A', gap: 12 },
  loadingTxt:     { color: '#8892B0', fontSize: 14 },
  hero:           { paddingTop: 56, padding: 20, paddingBottom: 24 },
  back:           { marginBottom: 12 },
  heroTitle:      { fontSize: 26, color: '#fff', fontWeight: '900' },
  heroSub:        { color: '#94A3B8', marginTop: 4, marginBottom: 12 },
  roleChip:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#6366F1' },
  roleChipTxt:    { color: '#A5B4FC', fontSize: 13, fontWeight: '600' },
  editRow:        { flexDirection: 'row', gap: 8, marginTop: 4 },
  roleInput:      { flex: 1, backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', borderWidth: 1, borderColor: '#6366F1' },
  saveBtn:        { backgroundColor: '#6366F1', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  saveTxt:        { color: '#fff', fontWeight: '700' },
  tabRow:         { paddingHorizontal: 16, paddingVertical: 12 },
  tab:            { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E2235', marginRight: 8, borderWidth: 1, borderColor: '#2D3448' },
  tabActive:      { backgroundColor: '#4338CA', borderColor: '#6366F1' },
  tabTxt:         { color: '#64748B', fontSize: 13, fontWeight: '600' },
  tabTxtActive:   { color: '#fff' },
  content:        { padding: 16 },
  milestoneCard:  { backgroundColor: '#1E2235', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2D3448' },
  milestoneActive:{ borderColor: '#6366F1', backgroundColor: '#1E1B4B' },
  milestoneHeader:{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  levelBadge:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2D3748', alignItems: 'center', justifyContent: 'center' },
  levelNum:       { color: '#A5B4FC', fontWeight: '800', fontSize: 12 },
  milestoneTitle: { color: '#F1F5F9', fontWeight: '700', fontSize: 15 },
  milestoneTime:  { color: '#64748B', fontSize: 12, marginTop: 2 },
  currentBadge:   { backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  currentBadgeTxt:{ color: '#A5B4FC', fontSize: 11, fontWeight: '700' },
  skillsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip:      { backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  skillChipTxt:   { color: '#94A3B8', fontSize: 11 },
  scoreCard:      { backgroundColor: '#1E2235', borderRadius: 14, padding: 20, marginBottom: 16, alignItems: 'center' },
  scoreLabel:     { color: '#64748B', fontSize: 13, marginBottom: 4 },
  scoreBig:       { fontSize: 52, fontWeight: '900', marginBottom: 8 },
  barBg:          { width: '100%', height: 10, backgroundColor: '#0F172A', borderRadius: 5, overflow: 'hidden' },
  barFill:        { height: 10, borderRadius: 5 },
  scoreHint:      { color: '#94A3B8', fontSize: 13, marginTop: 10, textAlign: 'center' },
  sectionTitle:   { color: '#94A3B8', fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 8, letterSpacing: 0.5 },
  gapCard:        { backgroundColor: '#1E2235', borderRadius: 12, padding: 14, marginBottom: 8 },
  gapRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  gapSkill:       { color: '#F1F5F9', fontWeight: '700', fontSize: 14 },
  gapFreq:        { color: '#64748B', fontSize: 11 },
  barBgSm:        { height: 6, backgroundColor: '#0F172A', borderRadius: 3, overflow: 'hidden' },
  barFillSm:      { height: 6, backgroundColor: '#EF4444', borderRadius: 3 },
  gapPriority:    { color: '#94A3B8', fontSize: 11, marginTop: 6 },
  strengthsWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  strengthChip:   { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  strengthTxt:    { color: '#10B981', fontSize: 13, fontWeight: '600' },
  roadmapItem:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1E2235', borderRadius: 12, padding: 14, marginBottom: 8 },
  roadmapNum:     { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4338CA', alignItems: 'center', justifyContent: 'center' },
  roadmapNumTxt:  { color: '#fff', fontWeight: '800', fontSize: 13 },
  roadmapSkill:   { color: '#F1F5F9', fontWeight: '700', fontSize: 14 },
  roadmapAction:  { color: '#6366F1', fontSize: 12, marginTop: 2 },
  insightCard:    { backgroundColor: '#1E2235', borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  insightHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  insightIcon:    { fontSize: 22 },
  insightTitle:   { color: '#F1F5F9', fontWeight: '700', fontSize: 15 },
  insightBody:    { color: '#94A3B8', lineHeight: 20, fontSize: 13 },
  emptyCard:      { alignItems: 'center', padding: 40, gap: 12 },
  emptyTxt:       { color: '#64748B', textAlign: 'center', fontSize: 14 },
});