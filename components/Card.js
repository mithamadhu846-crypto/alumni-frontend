// components/Card.js
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

export function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E2235',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D3448',
    marginBottom: 12,
  },
});
