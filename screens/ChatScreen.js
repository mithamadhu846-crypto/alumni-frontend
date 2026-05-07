// screens/ChatScreen.js — Real-time DM Chat
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { chatAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { Avatar } from '../components/UI';

export default function ChatScreen({ route, navigation }) {
  const { userId, userName, userAvatar, userRole } = route.params || {};
  const { user } = useAuth();
  const { socket } = useSocket();

  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(false);

  const flatListRef = useRef(null);
  const typingTimer = useRef(null);
  const typingAnim = useRef(new Animated.Value(0)).current;
  const roleColor = { student: '#3B82F6', alumni: '#10B981', faculty: '#D97706', admin: '#DC2626' }[userRole] || '#3B82F6';

  // Init chat
  useEffect(() => {
    initChat();
  }, []);

  // Join socket room once we have chatId
  useEffect(() => {
    if (!socket || !chatId) return;
    socket.emit('joinChat', chatId);

    const onMessage = ({ chatId: cId, message }) => {
  if (cId !== chatId) return;

  setMessages(prev => {
    // remove optimistic duplicate
    const withoutTemp = prev.filter(
      m => !(m._id?.startsWith('tmp_') && m.content === message.content)
    );

    // avoid same id duplicate
    if (withoutTemp.some(m => m._id === message._id)) return withoutTemp;

    return [...withoutTemp, message];
  });

  scrollToBottom();
};

    const onTyping = ({ userId: tId }) => {
      if (tId !== userId) return;
      setIsTyping(true);
      Animated.loop(Animated.sequence([
        Animated.timing(typingAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(typingAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]), { iterations: 5 }).start();
    };

    const onStopTyping = ({ userId: tId }) => {
      if (tId === userId) setIsTyping(false);
    };

    const onOnline = ({ userId: oId, online }) => {
      if (oId === userId) setOnlineStatus(online);
    };

    socket.on('messageReceived', onMessage);
    socket.on('userTyping', onTyping);
    socket.on('userStopTyping', onStopTyping);
    socket.on('userOnline', onOnline);

    return () => {
      socket.off('messageReceived', onMessage);
      socket.off('userTyping', onTyping);
      socket.off('userStopTyping', onStopTyping);
      socket.off('userOnline', onOnline);
    };
  }, [socket, chatId, userId]);

  const initChat = async () => {
    try {
      const res = await chatAPI.getOrCreateChat(userId);
      const chatData = res.data.chat;
      setChatId(chatData._id);
      const msgRes = await chatAPI.getMessages(chatData._id);
      setMessages(msgRes.data.messages || []);
    } catch (e) {
      console.error('Chat init error:', e);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !chatId || sending) return;

    const optimistic = {
      _id: `tmp_${Date.now()}`,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      content: text,
      type: 'text',
      readBy: [user._id],
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, optimistic]);
    setInput('');
    setSending(true);
    scrollToBottom();

    try {
      // Emit via socket for real-time delivery
      if (socket) {
        socket.emit('sendMessage', {
          chatId,
          content: text,
          senderId: user._id,
          senderName: user.name,
          senderAvatar: user.avatar,
        });
      } else {
        // REST fallback
        await chatAPI.sendMessage(chatId, text);
      }

      // Stop typing indicator
      if (socket) socket.emit('stopTyping', { chatId, userId: user._id });
    } catch {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, chatId, sending, socket, user]);

  const handleTyping = (text) => {
    setInput(text);
    if (!socket || !chatId) return;
    socket.emit('typing', { chatId, userId: user._id, name: user.name });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('stopTyping', { chatId, userId: user._id });
    }, 1500);
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender?._id?.toString() === user._id?.toString() || item.sender?.toString() === user._id?.toString();
    const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={[s.msgRow, isMe ? s.msgRowMe : s.msgRowThem]}>
        {!isMe && <View style={s.avatarGap} />}
        <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
          <Text style={[s.msgText, isMe && { color: '#fff' }]}>{item.content}</Text>
          <Text style={[s.time, isMe && { color: 'rgba(255,255,255,0.45)' }]}>{time}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
          <Ionicons name="arrow-back" size={22} color="#94A3B8" />
        </TouchableOpacity>
        <Avatar name={userName} uri={userAvatar} size={36} color={roleColor} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.headerName}>{userName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {onlineStatus && <View style={s.onlineDot} />}
            <Text style={s.headerSub}>{onlineStatus ? 'Online' : userRole}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Messages */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={roleColor} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m._id?.toString() || Math.random().toString()}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={isTyping ? (
            <View style={[s.msgRow, s.msgRowThem]}>
              <View style={s.bubbleThem}>
                <Animated.Text style={{ color: '#64748B', opacity: typingAnim }}>typing...</Animated.Text>
              </View>
            </View>
          ) : null}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Type a message..."
            placeholderTextColor="#475569"
            value={input}
            onChangeText={handleTyping}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            disabled={!input.trim() || sending}
            onPress={sendMessage}
          >
            <LinearGradient
              colors={input.trim() && !sending ? ['#4338CA', '#7C3AED'] : ['#1E2235', '#1E2235']}
              style={s.sendBtn}
            >
              {sending
                ? <ActivityIndicator size="small" color="#64748B" />
                : <Ionicons name="send" size={18} color={input.trim() ? '#fff' : '#475569'} />
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A14' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 14 },
  headerName: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  headerSub: { fontSize: 11, color: '#64748B' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  msgRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowThem: { justifyContent: 'flex-start' },
  avatarGap: { width: 8 },
  bubble: { maxWidth: '74%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#1E2235', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#2D3448' },
  msgText: { fontSize: 14, color: '#E2E8F0', lineHeight: 20 },
  time: { fontSize: 10, color: '#475569', marginTop: 4, textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#1E2235', backgroundColor: '#0F172A' },
  input: { flex: 1, backgroundColor: '#1E2235', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: '#F1F5F9', fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: '#2D3448' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
