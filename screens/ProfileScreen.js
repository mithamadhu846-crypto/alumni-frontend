// screens/ProfileScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { userAPI } from '../utils/api';
import { Avatar, RoleBadge } from '../components/UI';
import { Card } from '../components/Card';

export default function ProfileScreen({ navigation }) {
  const { user, updateUser, logout, roleColors } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: user?.bio || '', currentRole: user?.currentRole || '', currentCompany: user?.currentCompany || '', linkedIn: user?.linkedIn || '', skills: user?.skills?.join(', ') || '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const updates = { ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) };
      const res = await userAPI.updateProfile(updates);
      await updateUser(res.data.user);
      setEditing(false);
      Alert.alert('Saved', 'Profile updated.');
    } catch { Alert.alert('Error', 'Could not save.'); } finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={roleColors.gradient} style={styles.hero}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        <View style={styles.avatarWrap}>
          <Avatar name={user?.name} uri={user?.avatar} size={80} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <RoleBadge role={user?.role} />
        <Text style={styles.meta}>{user?.department} · {user?.graduationYear || user?.enrollmentYear}</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Points & Badges */}
        <Card>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{user?.points || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{user?.badges?.length || 0}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{user?.contributions?.jobsPosted || 0}</Text>
              <Text style={styles.statLabel}>Jobs Posted</Text>
            </View>
          </View>
          <View style={styles.badgesRow}>
            {user?.badges?.map(b => (
              <View key={b.name} style={styles.badgePill}>
                <Text style={styles.badgeIcon}>{b.icon}</Text>
                <Text style={styles.badgeName}>{b.name}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Edit / View */}
        <View style={styles.editHeader}>
          <Text style={styles.sectionTitle}>Profile Info</Text>
          <TouchableOpacity onPress={() => editing ? save() : setEditing(true)} style={styles.editBtn}>
            {saving ? <ActivityIndicator size="small" color="#3B82F6" /> : (
              <>
                <Ionicons name={editing ? 'checkmark' : 'pencil-outline'} size={14} color="#60A5FA" />
                <Text style={styles.editBtnText}>{editing ? 'Save' : 'Edit'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {editing ? (
          <Card>
            {[
              { label: 'Bio', key: 'bio', multiline: true },
              { label: 'Current Role', key: 'currentRole' },
              { label: 'Company', key: 'currentCompany' },
              { label: 'LinkedIn URL', key: 'linkedIn' },
              { label: 'Skills (comma separated)', key: 'skills' },
            ].map(({ label, key, multiline }) => (
              <View key={key} style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={[styles.fieldInput, multiline && { height: 80, textAlignVertical: 'top' }]}
                  value={form[key]}
                  onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                  multiline={multiline}
                  placeholderTextColor="#475569"
                />
              </View>
            ))}
          </Card>
        ) : (
          <Card>
            <InfoRow icon="person-outline" label="Name" value={user?.name} />
            <InfoRow icon="mail-outline" label="Email" value={user?.email} />
            <InfoRow icon="school-outline" label="Department" value={user?.department} />
            {user?.currentRole && <InfoRow icon="briefcase-outline" label="Role" value={`${user.currentRole} at ${user.currentCompany}`} />}
            {user?.bio && <InfoRow icon="document-text-outline" label="Bio" value={user.bio} />}
            {user?.skills?.length > 0 && <InfoRow icon="code-slash-outline" label="Skills" value={user.skills.join(', ')} />}
          </Card>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={() =>
  Alert.alert(
    'Sign Out',
    'Are you sure you want to sign out?',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]
  )
}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#64748B" style={{ marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoVal}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  hero: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 30, alignItems: 'center' },
  back: { position: 'absolute', top: 56, left: 16 },
  avatarWrap: { marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 6 },
  meta: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  content: { padding: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0F172A', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  badgeIcon: { fontSize: 14 },
  badgeName: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#F1F5F9' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1E3A5F', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: '#60A5FA', fontSize: 13, fontWeight: '600' },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: '#64748B', marginBottom: 6 },
  fieldInput: { backgroundColor: '#0F172A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#F1F5F9', fontSize: 14, borderWidth: 1, borderColor: '#2D3448' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1E2235' },
  infoLabel: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  infoVal: { fontSize: 14, color: '#E2E8F0' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 24, padding: 16, backgroundColor: '#7F1D1D22', borderRadius: 12, borderWidth: 1, borderColor: '#7F1D1D55' },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});
