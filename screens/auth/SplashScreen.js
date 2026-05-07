// screens/auth/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';

const { width, height } = Dimensions.get('window');

// Static stars (NO Math.random crash)
const STARS = Array.from({ length: 40 }).map((_, i) => ({
  top: (i * 37) % height,
  left: (i * 83) % width,
}));

export default function SplashScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Loading bar animation
    Animated.timing(loadingAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start(() => {
      // Role-based navigation
      if (user) {
        const routes = {
          student: 'StudentHome',
          alumni: 'AlumniHome',
          faculty: 'FacultyHome',
          admin: 'AdminHome',
        };
        navigation.replace(routes[user.role] || 'Login');
      } else {
        navigation.replace('Login');
      }
    });
  }, []);

  const widthInterpolate = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '80%'],
  });

  return (
    <LinearGradient
      colors={['#0A0F2C', '#0F172A', '#1E293B']}
      style={styles.container}
    >
      {/* Stars */}
      {STARS.map((s, i) => (
        <View key={i} style={[styles.star, { top: s.top, left: s.left }]} />
      ))}

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* 🎓 Icon */}
        <View style={styles.logoCircle}>
          <Ionicons name="school" size={50} color="#fff" />
        </View>

        {/* Title */}
        <Text style={styles.title}>AlumniHub</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>Connect · Grow · Inspire</Text>

        {/* Loading Bar */}
        <View style={styles.barWrap}>
          <Animated.View style={[styles.barFill, { width: widthInterpolate }]} />
        </View>

        {/* Version */}
        <Text style={styles.version}>v1.0.0</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#fff',
    opacity: 0.15,
  },

  content: {
    alignItems: 'center',
  },

  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 34,
    color: '#fff',
    fontWeight: '900', // Kavoon-like feel
    letterSpacing: 1,
  },

  tagline: {
    color: '#94A3B8',
    marginTop: 6,
    fontSize: 14,
  },

  barWrap: {
    width: 200,
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    marginTop: 20,
    overflow: 'hidden',
  },

  barFill: {
    height: 4,
    backgroundColor: '#3B82F6',
  },

  version: {
    marginTop: 15,
    fontSize: 12,
    color: '#64748B',
  },
});