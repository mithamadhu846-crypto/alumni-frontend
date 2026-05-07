// screens/AlumniDirectoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, RefreshControl, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userAPI, mentorshipAPI } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Avatar, EmptyState } from '../components/UI';
import { Card } from '../components/Card';

const AREAS = [
  'Career Guidance', 'Resume Review', 'Interview Prep',
  'Technical Skills', 'Networking', 'Entrepreneurship',
  'Research', 'Industry Insights'
];

export default function AlumniDirectoryScreen({ navigation }) {
  const { user } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [requests, setRequests] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [mentorModal, setMentorModal] = useState(null);
  const [reqForm, setReqForm] = useState({ areas: [], message: '' });
  const [sending, setSending] = useState(false);

  // 🔥 LOAD DATA
  const load = async () => {
    try {
      const res = await userAPI.getAlumni({ limit: 30 });
      setAlumni(res.data.alumni || []);

      // Fetch existing requests
      const reqRes = await mentorshipAPI.getMentorships({ role: 'mentee' });
      const map = {};
      (reqRes.data.mentorships || []).forEach(m => {
        if (m?.mentor?._id) {
          map[m.mentor._id] = m.status;
        }
      });
      setRequests(map);

    } catch (e) {
      console.log("LOAD ERROR:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  // 🔥 TOGGLE AREA
  const toggleArea = (area) => {
    setReqForm(p => ({
      ...p,
      areas: p.areas.includes(area)
        ? p.areas.filter(a => a !== area)
        : [...p.areas, area],
    }));
  };

  // 🔥 SEND REQUEST (FIXED)
  const sendRequest = async () => {
    if (!mentorModal) return;

    const mentorId = mentorModal._id || mentorModal.id;

    console.log("Sending request to:", mentorId);

    if (!mentorId) {
      return Alert.alert('Error', 'Invalid mentor ID');
    }

    if (reqForm.areas.length === 0) {
      return Alert.alert('Select areas', 'Please select at least one mentorship area.');
    }

    if (!reqForm.message.trim()) {
      return Alert.alert('Add a message', 'Write a short message.');
    }

    setSending(true);

    try {
      await mentorshipAPI.requestMentorship({
        mentorId,
        areas: reqForm.areas,
        message: reqForm.message.trim(),
      });

      // ✅ Update UI instantly
      setRequests(prev => ({
        ...prev,
        [mentorId]: 'pending',
      }));

      setMentorModal(null);
      setReqForm({ areas: [], message: '' });

      Alert.alert('Success', 'Request sent!');

    } catch (e) {
      console.log("REQUEST ERROR:", e?.response?.data);
      Alert.alert('Error', e?.response?.data?.error || 'Failed');
    } finally {
      setSending(false);
    }
  };

  // 🔥 BUTTON STATE HANDLER
  const renderButton = (item) => {
    if (user?.role !== 'student') return null;

    const id = item._id || item.id;
    const status = requests[id];

    if (status === 'pending') {
      return <Text style={s.pending}>Pending</Text>;
    }

    if (status === 'active') {
      return <Text style={s.connected}>Connected</Text>;
    }

    return (
      <TouchableOpacity
        style={s.connectBtn}
        onPress={() => {
          setMentorModal(item);
          setReqForm({ areas: [], message: '' });
        }}
      >
        <Ionicons name="people-outline" size={14} color="#fff" />
        <Text style={s.connectText}> Connect</Text>
      </TouchableOpacity>
    );
  };

  // 🔥 LIST ITEM
  const renderAlumni = ({ item }) => (
    <Card>
      <View style={s.row}>
        <Avatar name={item.name} uri={item.avatar} size={50} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={s.name}>{item.name}</Text>
          <Text style={s.role}>{item.currentRole || item.department}</Text>
        </View>
        {renderButton(item)}
      </View>
    </Card>
  );

  return (
    <View style={s.container}>
      <Text style={s.title}>Alumni Directory</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#10B981" />
      ) : (
        <FlatList
          data={alumni}
          keyExtractor={a => a._id || a.id}
          renderItem={renderAlumni}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
            />
          }
          ListEmptyComponent={
            <EmptyState title="No alumni found" />
          }
        />
      )}

      {/* 🔥 MODAL */}
      <Modal visible={!!mentorModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Request Mentorship</Text>

            <ScrollView showsVerticalScrollIndicator={false}>

              {/* AREAS */}
              <Text style={s.label}>Select Areas *</Text>
              <View style={s.areaWrap}>
                {AREAS.map(area => (
                  <TouchableOpacity
                    key={area}
                    style={[
                      s.areaChip,
                      reqForm.areas.includes(area) && s.areaActive
                    ]}
                    onPress={() => toggleArea(area)}
                  >
                    <Text style={[
                      s.areaText,
                      reqForm.areas.includes(area) && s.areaTextActive
                    ]}>
                      {area}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* MESSAGE */}
              <Text style={s.label}>Message *</Text>
              <TextInput
                style={s.textInput}
                placeholder="Write your message..."
                placeholderTextColor="#666"
                value={reqForm.message}
                onChangeText={v => setReqForm(p => ({ ...p, message: v }))}
                multiline
              />

              {/* SEND BUTTON */}
              <TouchableOpacity
                style={[s.sendBtn, sending && { opacity: 0.6 }]}
                onPress={sendRequest}
                disabled={sending}
              >
                {sending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.sendText}>Send Request</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMentorModal(null)}>
                <Text style={s.cancel}>Cancel</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// 🔥 STYLES
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A', padding: 30 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 },

  row: { flexDirection: 'row', alignItems: 'center' },
  name: { color: '#fff', fontWeight: 'bold' },
  role: { color: '#aaa' },

  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    padding: 6,
    borderRadius: 6,
  },
  connectText: { color: '#fff' },

  pending: { color: '#F59E0B' },
  connected: { color: '#3B82F6' },

  modalOverlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#111',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20
  },

  modalTitle: { color: '#fff', fontSize: 16, marginBottom: 10 },
  label: { color: '#aaa', marginTop: 10 },

  areaWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  areaChip: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
    margin: 4
  },
  areaActive: { backgroundColor: '#10B98122', borderColor: '#10B981' },
  areaText: { color: '#aaa', fontSize: 12 },
  areaTextActive: { color: '#10B981' },

  textInput: {
    backgroundColor: '#222',
    color: '#fff',
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    minHeight: 80
  },

  sendBtn: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    marginTop: 15
  },
  sendText: { color: '#fff', textAlign: 'center' },

  cancel: { color: '#888', textAlign: 'center', marginTop: 10 }
});