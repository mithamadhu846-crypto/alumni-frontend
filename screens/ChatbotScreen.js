// screens/ChatbotScreen.js — OpenAI-powered Career Chatbot
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { chatbotAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

const QUICK_REPLIES = [
  { label: '💼 Find Jobs', msg: 'Show me job opportunities' },
  { label: '👥 Get Mentor', msg: 'How do I find a mentor?' },
  { label: '🚀 Career Path', msg: 'Show me my career roadmap' },
  { label: '📊 Skill Gap', msg: 'Analyze my skill gaps' },
  { label: '📄 Resume Tips', msg: 'Give me resume tips' },
  { label: '🏆 Badges', msg: 'How do I earn badges?' },
];

const WELCOME = {
  id: 'welcome', role: 'assistant', timestamp: new Date(),
  content: "Hi! I'm **AlumniBot** 🤖 — your AI career advisor powered by OpenAI.\n\nI can help with:\n• 💼 Jobs & internships\n• 👥 Finding mentors\n• 🚀 Career roadmaps\n• 📊 Skill gap analysis\n• 📄 Resume tips\n• 🏆 Platform guidance\n\nWhat would you like to explore?",
};

function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    dots.forEach((d, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 180),
        Animated.timing(d, { toValue: -5, duration: 280, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.delay(540),
      ])).start();
    });
  }, []);
  return (
    <View style={td.row}>
      <View style={td.icon}><Text>🤖</Text></View>
      <View style={td.bubble}>
        {dots.map((d, i) => <Animated.View key={i} style={[td.dot, { transform: [{ translateY: d }] }]} />)}
      </View>
    </View>
  );
}
const td = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, paddingHorizontal: 16 },
  icon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  bubble: { flexDirection: 'row', gap: 5, backgroundColor: '#1E2235', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: '#2D3448' },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#64748B' },
});

function MsgText({ content, isUser }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={[cs.msgText, isUser && { color: '#fff' }]}>
      {parts.map((p, i) => p.startsWith('**') && p.endsWith('**')
        ? <Text key={i} style={{ fontWeight: '800' }}>{p.slice(2, -2)}</Text>
        : <Text key={i}>{p}</Text>
      )}
    </Text>
  );
}

export default function ChatbotScreen({ navigation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [lastSource, setLastSource] = useState('');
  const listRef = useRef(null);

  const scrollDown = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 120);
  useEffect(() => { scrollDown(); }, [messages, typing]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || typing) return;
    const userMsg = { id: `u_${Date.now()}`, role: 'user', content: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    const history = messages.filter(m => m.id !== 'welcome').slice(-12)
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

    try {
      const res = await chatbotAPI.sendMessage(msg, history);
      const botText = res.data.messages?.[0]?.text || "I couldn't process that. Please try again!";
      setLastSource(res.data.source || '');
      setMessages(prev => [...prev, {
        id: `b_${Date.now()}`, role: 'assistant', content: botText,
        timestamp: new Date(), source: res.data.source,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `e_${Date.now()}`, role: 'assistant', timestamp: new Date(),
        content: "I'm having trouble connecting. Please try again! 🤖",
      }]);
    } finally { setTyping(false); }
  }, [input, messages, typing]);

  const renderMsg = ({ item }) => {
    const isUser = item.role === 'user';
    const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={[cs.row, isUser ? cs.rowUser : cs.rowBot]}>
        {!isUser && <View style={cs.botIcon}><Text style={{ fontSize: 16 }}>🤖</Text></View>}
        <View style={[cs.bubble, isUser ? cs.bubbleUser : cs.bubbleBot]}>
          <MsgText content={item.content} isUser={isUser} />
          <View style={cs.metaRow}>
            <Text style={[cs.time, isUser && { color: 'rgba(255,255,255,0.45)' }]}>{time}</Text>
            {item.source === 'openai' && (
              <View style={cs.gptPill}>
                <Ionicons name="sparkles" size={8} color="#34D399" />
                <Text style={cs.gptPillText}>GPT</Text>
              </View>
            )}
          </View>
        </View>
        {isUser && (
          <View style={cs.userIcon}>
            <Text style={cs.userInitial}>{user?.name?.charAt(0) || '?'}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={cs.container}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={cs.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#94A3B8" />
        </TouchableOpacity>
        <View style={cs.botAvatar}><Text style={{ fontSize: 20 }}>🤖</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={cs.headerName}>AlumniBot</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={cs.onlineDot} />
            <Text style={cs.headerSub}>AI Career Advisor</Text>
            {lastSource === 'openai' && (
              <View style={cs.gptPill}>
                <Ionicons name="sparkles" size={9} color="#34D399" />
                <Text style={cs.gptPillText}>OpenAI GPT</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={cs.resumeBtn} onPress={() => navigation.navigate('ResumeAnalyzer')}>
          <Ionicons name="document-text-outline" size={15} color="#60A5FA" />
          <Text style={cs.resumeBtnText}>Resume</Text>
        </TouchableOpacity>
      </LinearGradient>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderMsg}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={typing ? <TypingDots /> : null}
      />

      <FlatList
        horizontal data={QUICK_REPLIES} keyExtractor={q => q.label}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={cs.chip} onPress={() => send(item.msg)}>
            <Text style={cs.chipText}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={cs.inputBar}>
          <TextInput
            style={cs.input}
            placeholder="Ask me anything about your career..."
            placeholderTextColor="#475569"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity disabled={!input.trim() || typing} onPress={() => send()}>
            <LinearGradient
              colors={input.trim() && !typing ? ['#4338CA', '#7C3AED'] : ['#1E2235', '#1E2235']}
              style={cs.sendBtn}
            >
              {typing
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

const cs = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A14' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 14, gap: 10 },
  botAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },
  headerSub: { fontSize: 11, color: '#64748B' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  gptPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#0D3B1A', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  gptPillText: { fontSize: 9, color: '#34D399', fontWeight: '700' },
  resumeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1E3A5F', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  resumeBtnText: { fontSize: 12, color: '#60A5FA', fontWeight: '600' },
  row: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end', gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowBot: { justifyContent: 'flex-start' },
  botIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' },
  userIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center' },
  userInitial: { fontSize: 12, fontWeight: '800', color: '#fff' },
  bubble: { maxWidth: '74%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: '#1E2235', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#2D3448' },
  msgText: { fontSize: 14, color: '#E2E8F0', lineHeight: 21 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5, marginTop: 5 },
  time: { fontSize: 10, color: '#475569' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#1E2235', borderRadius: 16, borderWidth: 1, borderColor: '#2D3448' },
  chipText: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#1E2235', backgroundColor: '#0F172A' },
  input: { flex: 1, backgroundColor: '#1E2235', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, color: '#F1F5F9', fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: '#2D3448' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
