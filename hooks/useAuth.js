// hooks/useAuth.js
// Firebase is optional — app falls back to direct JWT auth if Firebase not configured.
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../utils/api';

// Load Firebase safely — no crash if env vars are empty
let fbSignIn = null, fbCreateUser = null, fbSignOut = null, fbAuth = null;
try {
  const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = require('firebase/auth');
  const { auth } = require('../utils/firebase');
  fbAuth       = auth;
  fbSignIn     = signInWithEmailAndPassword;
  fbCreateUser = createUserWithEmailAndPassword;
  fbSignOut    = signOut;
} catch (e) {
  console.warn('[Auth] Firebase unavailable, using JWT-only mode:', e?.message);
}

const AuthContext = createContext(null);

export const ROLE_COLORS = {
  student: { primary: '#2563EB', secondary: '#DBEAFE', gradient: ['#1D4ED8', '#3B82F6'] },
  alumni:  { primary: '#059669', secondary: '#D1FAE5', gradient: ['#047857', '#10B981'] },
  faculty: { primary: '#D97706', secondary: '#FEF3C7', gradient: ['#B45309', '#F59E0B'] },
  admin:   { primary: '#DC2626', secondary: '#FEE2E2', gradient: ['#B91C1C', '#EF4444'] },
};

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStoredUser(); }, []);

  const loadStoredUser = async () => {
    try {
      const results = await AsyncStorage.multiGet(['user', 'token']);
      const storedUser = results[0][1];
      const token      = results[1][1];
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
        // Silently re-validate token
        authAPI.getMe()
          .then(res => {
            setUser(res.data.user);
            AsyncStorage.setItem('user', JSON.stringify(res.data.user));
          })
          .catch(() => clearAuth());
      }
    } catch (e) {
      console.warn('[Auth] loadStoredUser error:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = async () => {
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
    setUser(null);
  };

  const persistAuth = async ({ token, refreshToken, user: userData }) => {
    await AsyncStorage.multiSet([
      ['token',        token],
      ['refreshToken', refreshToken],
      ['user',         JSON.stringify(userData)],
    ]);
    setUser(userData);
  };

  // Register: Firebase first → falls back to direct JWT
  const register = async ({ name, email, password, role, department, graduationYear }) => {
    let uid = null;

    if (fbAuth && fbCreateUser) {
      try {
        const fb = await fbCreateUser(fbAuth, email, password);
        uid = fb.user.uid;
      } catch (e) {
        // Ignore config errors, rethrow real auth errors
        const configErrors = ['auth/invalid-api-key', 'auth/configuration-not-found', 'auth/app-not-authorized'];
        if (!configErrors.includes(e.code)) throw e;
      }
    }

    if (uid) {
      const res = await authAPI.firebaseAuth({ uid, email, name, role, department, graduationYear });
      await persistAuth(res.data);
      return res.data.user;
    }

    // Direct JWT registration
    const res = await authAPI.register({ name, email, password, role, department, graduationYear });
    await persistAuth(res.data);
    return res.data.user;
  };

  // Login: Firebase first → falls back to direct JWT
  const login = async ({ email, password }) => {
    let uid = null;

    if (fbAuth && fbSignIn) {
      try {
        const fb = await fbSignIn(fbAuth, email, password);
        uid = fb.user.uid;
      } catch (e) {
        const configErrors = ['auth/invalid-api-key', 'auth/configuration-not-found', 'auth/app-not-authorized'];
        if (!configErrors.includes(e.code)) throw e;
      }
    }

    if (uid) {
      const res = await authAPI.firebaseAuth({ uid, email });
      await persistAuth(res.data);
      return res.data.user;
    }

    // Direct JWT login
    const res = await authAPI.login({ email, password });
    await persistAuth(res.data);
    return res.data.user;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    try { if (fbAuth && fbSignOut) await fbSignOut(fbAuth); } catch {}
    await clearAuth();
  };

  const updateUser = async (updatedUser) => {
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const roleColors = ROLE_COLORS[user?.role] || ROLE_COLORS.student;

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateUser, roleColors,
      isStudent: user?.role === 'student',
      isAlumni:  user?.role === 'alumni',
      isFaculty: user?.role === 'faculty',
      isAdmin:   user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
