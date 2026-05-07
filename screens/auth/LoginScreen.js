// screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

/* ⭐ STATIC STAR POSITIONS (like splash) */
const STARS = [
  { top: '8%', left: '12%' }, { top: '15%', left: '72%' },
  { top: '22%', left: '35%' }, { top: '30%', left: '88%' },
  { top: '42%', left: '5%' },  { top: '55%', left: '60%' },
  { top: '63%', left: '20%' }, { top: '71%', left: '80%' },
  { top: '82%', left: '45%' }, { top: '90%', left: '15%' },
  { top: '18%', left: '50%' }, { top: '48%', left: '75%' },
];

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Error', 'Please fill in all fields.');
    }
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Login failed.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#020617', '#0B1120', '#0F172A']} style={styles.container}>

      {/* ⭐ STARS */}
      {STARS.map((pos, i) => (
        <View key={i} style={[styles.star, { top: pos.top, left: pos.left }]} />
      ))}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="school" size={32} color="#fff" />
              </View>
              <Text style={styles.logoText}>AlumniHub</Text>
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to AlumniHub</Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#475569"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.icon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} disabled={loading}>
              <LinearGradient colors={['#0b1d45','#290e54']} style={styles.loginBtn}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.loginBtnText}>Sign In</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* REGISTER */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* ⭐ STAR STYLE */
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#fff',
    opacity: 0.15,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  header: {
    alignItems: 'center',
    marginBottom: 40,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },

  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },

  form: {
    gap: 16,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2235',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2D3448',
    paddingHorizontal: 16,
  },

  icon: { marginRight: 12 },

  input: {
    flex: 1,
    height: 52,
    color: '#F1F5F9',
    fontSize: 15,
  },

  forgotWrap: { alignItems: 'flex-end' },

  forgotText: {
    color: '#60A5FA',
    fontSize: 13,
  },

  loginBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },

  registerText: {
    color: '#94A3B8',
    fontSize: 14,
  },

  registerLink: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
  },
});