// screens/ConversationsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatAPI } from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { Avatar, EmptyState } from '../components/UI';

export default function ConversationsScreen({ navigation }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await chatAPI.getConversations();
      setConversations(res.data.conversations || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  // Update conversation list in real-time when new message arrives
  useEffect(() => {
    if (!socket) return;
    const onMessage = ({ chatId, message }) => {
      setConversations(prev => prev.map(conv => {
        if (conv.chatId === chatId) {
          return {
            ...conv,
            lastMessage: { content: message.content, at: message.createdAt },
            unreadCount: (conv.unreadCount || 0) + 1,
          };
        }
        return conv;
      }));
    };
    socket.on('messageReceived', onMessage);
    return () => socket.off('messageReceived', onMessage);
  }, [socket]);

  const openChat = (conv) => {
    navigation.navigate('Chat', {
      userId: conv.participant?._id,
      userName: conv.participant?.name,
      userAvatar: conv.participant?.avatar,
      userRole: conv.participant?.role,
    });
  };

  const timeStr = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  };

  const roleColor = (role) => ({
    student: '#3B82F6', alumni: '#10B981', faculty: '#D97706', admin: '#DC2626',
  }[role] || '#64748B');

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.row} onPress={() => openChat(item)}>
      <View style={styles.avatarWrap}>
        <Avatar
          name={item.participant?.name}
          uri={item.participant?.avatar}
          size={50}
          color={roleColor(item.participant?.role)}
        />
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.name, item.unreadCount > 0 && styles.nameUnread]}>
            {item.participant?.name}
          </Text>
          <Text style={styles.time}>{timeStr(item.lastMessage?.at)}</Text>
        </View>
        <Text
          style={[styles.lastMsg, item.unreadCount > 0 && styles.lastMsgUnread]}
          numberOfLines={1}
        >
          {item.lastMessage?.sender?.toString() === user._id
            ? `You: ${item.lastMessage?.content}`
            : item.lastMessage?.content || 'Start a conversation'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('AlumniDirectory')}
        >
          <Ionicons name="create-outline" size={22} color="#60A5FA" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={c => c.chatId}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3B82F6" />
          }
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title="No conversations yet"
              subtitle="Find alumni and start chatting!"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', paddingTop: 56 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#F1F5F9' },
  newBtn: { padding: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#1A1A2E',
  },
  avatarWrap: { position: 'relative', marginRight: 14 },
  unreadBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#3B82F6', borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 2, borderColor: '#0F0F1A',
  },
  unreadText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  info: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '600', color: '#CBD5E1' },
  nameUnread: { color: '#F1F5F9', fontWeight: '700' },
  time: { fontSize: 11, color: '#475569' },
  lastMsg: { fontSize: 13, color: '#475569' },
  lastMsgUnread: { color: '#94A3B8', fontWeight: '600' },
});
