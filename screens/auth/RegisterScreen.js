// screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; // ✅ FIXED
import { useAuth } from '../../hooks/useAuth';

const ROLES = ['student', 'alumni', 'faculty', 'admin'];

const DEPARTMENTS = [
  'Computer Science', 'EEE', 'ECE', 'IT', 'AI&DS',
  'Mechanical', 'Civil', 'MBA', 'Other'
];

const COLLEGES = [
  { name: "Annai Mira College of Engineering & Technology", code: "1526" },
  { name: "C. Abdul Hakeem College of Engineering & Technology", code: "1505" },
  { name: "College of Engineering, Guindy", code: "0001" },
  { name: "DKM College of Engineering", code: "1304" },
  { name: "Government College of Technology, Coimbatore", code: "2005" },
  { name: "Kongu Engineering College", code: "2711" },
  { name: "Kumaraguru College of Technology", code: "2712" },
  { name: "Madras Institute of Technology", code: "0004" },
  { name: "Panimalar Engineering College", code: "1210" },
  { name: "PSG College of Technology", code: "2006" },
  { name: "Rajalakshmi Engineering College", code: "1211" },
  { name: "RMK Engineering College", code: "1113" },
  { name: "Sri Nandhanam College of Engineering & Technology", code: "1216" },
  { name: "SSN College of Engineering", code: "1315" },
  { name: "St Joseph's College of Engineering", code: "1317" },
  { name: "Thanthai Periyar Government Institute of Technology", code: "1516" },
  { name: "Thiagarajar College of Engineering", code: "5008" },
  { name: "Velammal Engineering College", code: "1120" }
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: '',
    graduationYear: '',
    college: '',
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password || !form.department || !form.college) {
      return Alert.alert('Error', 'Please fill in all required fields.');
    }

    if (form.password.length < 6) {
      return Alert.alert('Error', 'Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      await register({
        ...form,
        graduationYear: form.graduationYear
          ? parseInt(form.graduationYear)
          : undefined,
        isMentor: form.role === 'alumni' // ✅ FIXED BUG
      });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Registration failed.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const roleColors = {
    student: '#2563EB',
    alumni: '#059669',
    faculty: '#D97706',
    admin: '#DC2626'
  };

  return (
    <LinearGradient colors={['#020617', '#0B1120', '#0F172A']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="school" size={34} color="#fff" />
            </View>
            <Text style={styles.logoText}>AlumniHub</Text>
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the AlumniHub community</Text>

          {/* Role */}
          <Text style={styles.label}>Select Your Role</Text>
          <View style={styles.roleRow}>
            {ROLES.map(r => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.roleBtn,
                  form.role === r && {
                    borderColor: roleColors[r],
                    backgroundColor: roleColors[r] + '22'
                  }
                ]}
                onPress={() => update('role', r)}
              >
                <Text style={[
                  styles.roleBtnText,
                  form.role === r && { color: roleColors[r] }
                ]}>
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Inputs */}
          <InputField icon="person-outline" placeholder="Full Name"
            value={form.name} onChangeText={v => update('name', v)} />

          <InputField icon="mail-outline" placeholder="Email Address"
            value={form.email} onChangeText={v => update('email', v)}
            keyboardType="email-address" autoCapitalize="none" />

          {/* Password */}
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.icon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="#475569"
              value={form.password}
              onChangeText={v => update('password', v)}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Department */}
          <Text style={styles.label}>Department *</Text>
          <View style={styles.deptGrid}>
            {DEPARTMENTS.map(d => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.deptBtn,
                  form.department === d && styles.deptBtnActive
                ]}
                onPress={() => update('department', d)}
              >
                <Text style={[
                  styles.deptText,
                  form.department === d && styles.deptTextActive
                ]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ✅ College Dropdown */}
          <Text style={styles.label}>College *</Text>
          <View style={styles.dropdownWrapper}>
            <Picker
              selectedValue={form.college}
              onValueChange={(value) => update('college', value)}
              dropdownIconColor="#fff"
              style={{ color: '#fff' }}
            >
              <Picker.Item label="Select your college..." value="" />
              {COLLEGES.map(c => (
                <Picker.Item
                  key={c.code}
                  label={`${c.name} (${c.code})`}
                  value={c.code}
                />
              ))}
            </Picker>
          </View>

          {/* Year */}
          <InputField
            icon="school-outline"
            placeholder="Year (e.g. 2022)"
            value={form.graduationYear}
            onChangeText={v => update('graduationYear', v)}
            keyboardType="numeric"
          />

          {/* Submit */}
          <TouchableOpacity onPress={handleRegister} disabled={loading}>
            <LinearGradient colors={['#0b1d45', '#290e54']} style={styles.submitBtn}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Create Account</Text>}
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function InputField({ icon, ...props }) {
  return (
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={20} color="#64748B" style={styles.icon} />
      <TextInput style={styles.input} placeholderTextColor="#475569" {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  backBtn: { marginBottom: 10 },

  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logoCircle: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '800' },

  title: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 24 },

  label: { color: '#94A3B8', fontSize: 13, marginBottom: 8 },

  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#2D3448', alignItems: 'center',
  },
  roleBtnText: { color: '#64748B', fontWeight: '600', fontSize: 13 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E2235', borderRadius: 14,
    borderWidth: 1, borderColor: '#2D3448',
    paddingHorizontal: 16, marginBottom: 12,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, height: 52, color: '#F1F5F9' },

  deptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  deptBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1,
    borderColor: '#2D3448', backgroundColor: '#1E2235',
  },
  deptBtnActive: { borderColor: '#3B82F6', backgroundColor: '#1E3A5F' },
  deptText: { color: '#64748B', fontSize: 13 },
  deptTextActive: { color: '#60A5FA', fontWeight: '600' },

  dropdownWrapper: {
    backgroundColor: '#1E2235',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2D3448',
    marginBottom: 16,
  },

  submitBtn: {
    height: 54, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});