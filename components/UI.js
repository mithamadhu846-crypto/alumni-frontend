// components/UI.js — shared UI primitives
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// ─── Screen Header ────────────────────────────────────────────────────────────
export function ScreenHeader({ title, subtitle, rightAction, onBack, navigation }) {
  return (
    <View style={hdr.wrap}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={hdr.back}>
          <Ionicons name="arrow-back" size={22} color="#94A3B8" />
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <Text style={hdr.title}>{title}</Text>
        {subtitle && <Text style={hdr.subtitle}>{subtitle}</Text>}
      </View>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
}
const hdr = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  back: { marginRight: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
});

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = '#3B82F6', style }) {
  return (
    <View style={[stat.card, style]}>
      <View style={[stat.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={stat.value}>{value}</Text>
      <Text style={stat.label}>{label}</Text>
    </View>
  );
}
const stat = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: '#1E2235', borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2D3448',
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  value: { fontSize: 22, fontWeight: '800', color: '#F1F5F9', marginBottom: 2 },
  label: { fontSize: 11, color: '#64748B', textAlign: 'center' },
});

// ─── Badge ────────────────────────────────────────────────────────────────────
export function RoleBadge({ role }) {
  const colors = {
    student: '#2563EB', alumni: '#059669', faculty: '#D97706', admin: '#DC2626',
  };
  const color = colors[role] || '#64748B';
  return (
    <View style={[badge.wrap, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[badge.text, { color }]}>{role?.toUpperCase()}</Text>
    </View>
  );
}
const badge = StyleSheet.create({
  wrap: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, alignSelf: 'flex-start' },
  text: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ uri, name = '?', size = 44, color = '#3B82F6' }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={[avtr.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '33', borderColor: color + '55' }]}>
      <Text style={[avtr.initials, { fontSize: size * 0.35, color }]}>
        {name?.charAt(0)?.toUpperCase() || '?'}
      </Text>
    </View>
  );
}
const avtr = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  initials: { fontWeight: '700' },
});

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon = 'search-outline', title, subtitle }) {
  return (
    <View style={empty.wrap}>
      <Ionicons name={icon} size={48} color="#334155" />
      <Text style={empty.title}>{title}</Text>
      {subtitle && <Text style={empty.subtitle}>{subtitle}</Text>}
    </View>
  );
}
const empty = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  title: { fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 12, textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#334155', marginTop: 4, textAlign: 'center' },
});

// ─── Gradient Button ──────────────────────────────────────────────────────────
export function GradientButton({ title, onPress, colors = ['#2563EB', '#7C3AED'], style, disabled }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={style}>
      <LinearGradient colors={disabled ? ['#374151', '#374151'] : colors} style={btn.btn}>
        <Text style={btn.text}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}
const btn = StyleSheet.create({
  btn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

// ─── Section Title ────────────────────────────────────────────────────────────
export function SectionTitle({ title, action, onAction }) {
  return (
    <View style={sec.row}>
      <Text style={sec.title}>{title}</Text>
      {action && <TouchableOpacity onPress={onAction}><Text style={sec.action}>{action}</Text></TouchableOpacity>}
    </View>
  );
}
const sec = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '700', color: '#F1F5F9' },
  action: { fontSize: 13, color: '#60A5FA', fontWeight: '600' },
});

// ─── Priority Badge ───────────────────────────────────────────────────────────
export function PriorityBadge({ priority }) {
  const map = {
    urgent: '#DC2626', high: '#EA580C', medium: '#D97706', low: '#16A34A',
  };
  const color = map[priority] || '#64748B';
  return (
    <View style={[pri.wrap, { backgroundColor: color + '22' }]}>
      <Text style={[pri.text, { color }]}>{priority?.toUpperCase()}</Text>
    </View>
  );
}
const pri = StyleSheet.create({
  wrap: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  text: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});
