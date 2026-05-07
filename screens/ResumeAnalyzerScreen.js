// screens/ResumeAnalyzerScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

const SCORE_COLOR = (score) =>
  score >= 80 ? '#10B981' : score >= 65 ? '#F59E0B' : score >= 45 ? '#3B82F6' : '#EF4444';

const GRADE_BG = {
  A: { bg: '#064E3B', text: '#6EE7B7', border: '#10B981' },
  B: { bg: '#451A03', text: '#FCD34D', border: '#F59E0B' },
  C: { bg: '#1E3A5F', text: '#93C5FD', border: '#3B82F6' },
  D: { bg: '#431407', text: '#FEB794', border: '#F97316' },
  F: { bg: '#450A0A', text: '#FCA5A5', border: '#EF4444' },
};

const ScoreBar = ({ score }) => {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: score, duration: 1000, useNativeDriver: false }).start();
  }, [score]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  return (
    <View style={st.barBg}>
      <Animated.View style={[st.barFill, { width, backgroundColor: SCORE_COLOR(score) }]} />
    </View>
  );
};

const Chip = ({ label, variant = 'neutral' }) => {
  const colors = {
    green:   { bg: '#064E3B', text: '#6EE7B7', border: '#10B981' },
    red:     { bg: '#450A0A', text: '#FCA5A5', border: '#EF4444' },
    blue:    { bg: '#1E3A5F', text: '#93C5FD', border: '#3B82F6' },
    neutral: { bg: '#1E2235', text: '#94A3B8', border: '#2D3448' },
  }[variant];
  return (
    <View style={[st.chip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[st.chipText, { color: colors.text }]}>{label}</Text>
    </View>
  );
};

const SectionCard = ({ icon, title, children, accentColor = '#3B82F6' }) => (
  <View style={[st.sectionCard, { borderLeftColor: accentColor }]}>
    <View style={st.sectionHeader}>
      <Ionicons name={icon} size={16} color={accentColor} />
      <Text style={[st.sectionTitle, { color: accentColor }]}>{title}</Text>
    </View>
    {children}
  </View>
);

const StatBox = ({ label, value, color }) => (
  <View style={st.statBox}>
    <Text style={[st.statVal, { color }]}>{value}</Text>
    <Text style={st.statLabel}>{label}</Text>
  </View>
);

export default function ResumeAnalyzerScreen({ navigation }) {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [jobDesc,    setJobDesc]    = useState('');
  const [targetRole, setTargetRole] = useState(user?.targetRole || '');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);

  const analyze = async () => {
    if (!resumeText.trim() || resumeText.trim().length < 30) {
      return Alert.alert('Too short', 'Please paste your resume (at least 30 characters).');
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await api.post('/resume/analyze', {
        resumeText:     resumeText.trim(),
        jobDescription: jobDesc,
        targetRole,
      });
      setResult(response.data);
    } catch (e) {
      Alert.alert('Analysis failed', e?.response?.data?.error || e.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const grade = result?.grade || '';
  const gradeStyle = GRADE_BG[grade] || GRADE_BG.F;

  return (
    <ScrollView style={st.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#94A3B8" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Resume Analyzer</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={st.content}>

        {/* Input card */}
        <View style={st.card}>
          <Text style={st.label}>Target Role</Text>
          <View style={st.inputRow}>
            <Ionicons name="flag-outline" size={15} color="#475569" />
            <TextInput
              style={st.inlineInput}
              placeholder="e.g. Software Engineer, Data Analyst"
              placeholderTextColor="#475569"
              value={targetRole}
              onChangeText={setTargetRole}
            />
          </View>

          <Text style={st.label}>Job Description <Text style={st.labelHint}>(optional — improves accuracy)</Text></Text>
          <TextInput
            style={[st.textArea, { minHeight: 80 }]}
            placeholder="Paste job description to get keyword match score..."
            placeholderTextColor="#475569"
            multiline
            value={jobDesc}
            onChangeText={setJobDesc}
            textAlignVertical="top"
          />

          <Text style={[st.label, { marginTop: 12 }]}>Resume Text</Text>
          <TextInput
            style={[st.textArea, { minHeight: 160 }]}
            placeholder="Paste your resume here..."
            placeholderTextColor="#475569"
            multiline
            value={resumeText}
            onChangeText={setResumeText}
            textAlignVertical="top"
          />
          <Text style={st.charHint}>
            {resumeText.length} characters{resumeText.length < 30 ? ' (need 30+)' : ' ✓'}
          </Text>

          <TouchableOpacity
            style={[st.analyzeBtn, loading && st.analyzeBtnDisabled]}
            onPress={analyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={st.analyzeBtnText}>Analyzing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="flash-outline" size={18} color="#fff" />
                <Text style={st.analyzeBtnText}>Analyze Resume</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {result && (
          <>
            {/* Score card */}
            <View style={st.card}>
              <View style={st.scoreRow}>
                <View>
                  <Text style={st.scoreLabel}>ATS Score</Text>
                  <Text style={[st.scoreNum, { color: SCORE_COLOR(result.atsScore) }]}>
                    {result.atsScore}/100
                  </Text>
                </View>
                <View style={[st.gradeBadge, { backgroundColor: gradeStyle.bg, borderColor: gradeStyle.border }]}>
                  <Text style={[st.gradeText, { color: gradeStyle.text }]}>{grade}</Text>
                  <Text style={[st.gradeLabel, { color: gradeStyle.text }]}>Grade</Text>
                </View>
              </View>
              <ScoreBar score={result.atsScore} />
              <View style={st.statsRow}>
                <StatBox label="Words"    value={result.stats?.wordCount || 0}      color="#F1F5F9" />
                <View style={st.statDiv} />
                <StatBox label="Skills"   value={result.stats?.skillCount || 0}     color="#3B82F6" />
                <View style={st.statDiv} />
                <StatBox label="Sections" value={result.sectionsFound?.length || 0} color="#10B981" />
                <View style={st.statDiv} />
                <StatBox label="Source"   value="AI"                                color="#F59E0B" />
              </View>
            </View>

            {result.sectionsFound?.length > 0 && (
              <SectionCard icon="list-outline" title="Sections found" accentColor="#10B981">
                <View style={[st.chips, { marginTop: 8 }]}>
                  {result.sectionsFound.map(sec => <Chip key={sec} label={sec} variant="green" />)}
                </View>
              </SectionCard>
            )}

            {result.extractedSkills?.length > 0 && (
              <SectionCard icon="code-outline" title={`Skills detected (${result.extractedSkills.length})`} accentColor="#3B82F6">
                <View style={[st.chips, { marginTop: 8 }]}>
                  {result.extractedSkills.map(sk => <Chip key={sk} label={sk} variant="blue" />)}
                </View>
              </SectionCard>
            )}

            {result.matchedKeywords?.length > 0 && (
              <SectionCard icon="checkmark-circle-outline" title={`Matched keywords (${result.matchedKeywords.length})`} accentColor="#10B981">
                <View style={[st.chips, { marginTop: 8 }]}>
                  {result.matchedKeywords.map(k => <Chip key={k} label={k} variant="green" />)}
                </View>
              </SectionCard>
            )}

            {result.missingKeywords?.length > 0 && (
              <SectionCard icon="close-circle-outline" title={`Missing keywords (${result.missingKeywords.length})`} accentColor="#EF4444">
                <View style={[st.chips, { marginTop: 8 }]}>
                  {result.missingKeywords.map(k => <Chip key={k} label={k} variant="red" />)}
                </View>
              </SectionCard>
            )}

            {result.suggestions?.length > 0 && (
              <SectionCard icon="bulb-outline" title="Improvement suggestions" accentColor="#F59E0B">
                {result.suggestions.map((tip, i) => (
                  <View key={i} style={st.tipRow}>
                    <View style={st.tipNum}>
                      <Text style={st.tipNumText}>{i + 1}</Text>
                    </View>
                    <Text style={st.tipText}>{tip}</Text>
                  </View>
                ))}
              </SectionCard>
            )}
          </>
        )}

        <View style={{ height: 48 }} />
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#0F0F1A' },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:            { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#1A1A2E' },
  headerTitle:        { fontSize: 17, fontWeight: '600', color: '#F1F5F9' },
  content:            { padding: 16 },
  card:               { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2D3448' },
  label:              { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 6, letterSpacing: 0.3 },
  labelHint:          { fontSize: 11, color: '#475569', fontWeight: '400' },
  inputRow:           { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#2D3448', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, backgroundColor: '#0F0F1A' },
  inlineInput:        { flex: 1, color: '#F1F5F9', fontSize: 14 },
  textArea:           { borderWidth: 1, borderColor: '#2D3448', borderRadius: 10, padding: 12, color: '#F1F5F9', fontSize: 13, lineHeight: 20, backgroundColor: '#0F0F1A', marginBottom: 8 },
  charHint:           { fontSize: 11, color: '#475569', textAlign: 'right', marginBottom: 12 },
  analyzeBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#6366F1', borderRadius: 12, paddingVertical: 14 },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText:     { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  scoreRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  scoreLabel:         { fontSize: 12, color: '#64748B', marginBottom: 4 },
  scoreNum:           { fontSize: 42, fontWeight: '700' },
  gradeBadge:         { width: 64, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  gradeText:          { fontSize: 26, fontWeight: '700' },
  gradeLabel:         { fontSize: 10, fontWeight: '600', marginTop: -2 },
  barBg:              { height: 8, backgroundColor: '#1E2235', borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  barFill:            { height: 8, borderRadius: 4 },
  statsRow:           { flexDirection: 'row', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2D3448' },
  statBox:            { flex: 1, alignItems: 'center' },
  statVal:            { fontSize: 18, fontWeight: '700' },
  statLabel:          { fontSize: 10, color: '#475569', marginTop: 2 },
  statDiv:            { width: 1, backgroundColor: '#2D3448' },
  sectionCard:        { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2D3448', borderLeftWidth: 4 },
  sectionHeader:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle:       { fontSize: 13, fontWeight: '600' },
  chips:              { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:               { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  chipText:           { fontSize: 12, fontWeight: '500' },
  tipRow:             { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 10 },
  tipNum:             { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1E2235', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipNumText:         { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
  tipText:            { flex: 1, fontSize: 13, color: '#94A3B8', lineHeight: 19 },
});