// utils/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==============================
// 🌐 BASE URL (PRODUCTION READY)
// ==============================
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://alumni-backend-gf1r.onrender.com'; // 🔥 Render backend

// ==============================
// 🚀 AXIOS INSTANCE
// ==============================
const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==============================
// 🔐 ATTACH TOKEN AUTOMATICALLY
// ==============================
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==============================
// 🔄 AUTO REFRESH TOKEN (401)
// ==============================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        await AsyncStorage.multiSet([
          ['token', res.data.token],
          ['refreshToken', res.data.refreshToken],
        ]);

        original.headers.Authorization = `Bearer ${res.data.token}`;
        return api(original);
      } catch (err) {
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
      }
    }

    return Promise.reject(error);
  }
);

export default api;


/* ==============================
   🔐 AUTH API
============================== */
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  firebaseAuth: (data) => api.post('/auth/firebase', data),

  getMe: () => api.get('/auth/me'),   // ✅ FIXED

  logout: () => api.post('/auth/logout'),
  updatePassword: (data) => api.put('/auth/password', data),
};

/* ==============================
   👤 USER API
============================== */
export const userAPI = {
  getAlumni: (params) => api.get('/users/alumni', { params }),
  getMatches: () => api.get('/users/matches'),
  getSkillGap: (params) => api.get('/users/skill-gap', { params }),
  updateProfile: (data) => api.put('/users/profile', data),
  getUser: (id) => api.get(`/users/${id}`),
  getAllUsers: (params) => api.get('/users', { params }),
  toggleUser: (id) => api.patch(`/users/${id}/toggle`),
  changeRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
};

/* ==============================
   💼 JOB API
============================== */
export const jobAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJob: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post('/jobs', data),
  applyJob: (id) => api.post(`/jobs/${id}/apply`),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
};

/* ==============================
   📅 EVENT API
============================== */
export const eventAPI = {
  getEvents: (params) => api.get('/events', { params }),
  createEvent: (data) => api.post('/events', data),
  registerEvent: (id) => api.post(`/events/${id}/register`),
  approveEvent: (id) => api.patch(`/events/${id}/approve`),
};

/* ==============================
   🎓 MENTORSHIP API
============================== */
export const mentorshipAPI = {
  getMentorships: (params) => api.get('/mentorship', { params }),
  requestMentorship: (data) => api.post('/mentorship', data),
  updateStatus: (id, data) => api.patch(`/mentorship/${id}/status`, data),
  submitReview: (id, data) => api.post(`/mentorship/${id}/review`, data),
};

/* ==============================
   📢 NOTICE API
============================== */
export const noticeAPI = {
  getNotices: (params) => api.get('/notices', { params }),
  createNotice: (data) => api.post('/notices', data),
  markRead: (id) => api.patch(`/notices/${id}/read`),
};

export const startupAPI = {
  getStartups:        (params) => api.get('/startups', { params }),
  getPendingStartups: ()       => api.get('/startups/pending'),   // ADD THIS
  createStartup:      (data)   => api.post('/startups', data),
  likeStartup:        (id)     => api.post(`/startups/${id}/like`),
  approveStartup:     (id)     => api.patch(`/startups/${id}/approve`),
};

/* ==============================
   📊 ANALYTICS API
============================== */
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getEngagement: () => api.get('/analytics/engagement'),
};

/* ==============================
   🏆 LEADERBOARD API
============================== */
export const leaderboardAPI = {
  getLeaderboard: (params) => api.get('/leaderboard', { params }),
};

/* ==============================
   🧭 CAREER API
============================== */
export const careerAPI = {
  getRoadmap: (params) => api.get('/career/roadmap', { params }),
};

/* ==============================
   🤖 CHATBOT API
============================== */
export const chatbotAPI = {
  sendMessage: (message, history = []) =>
    api.post('/chatbot/message', { message, history }),

  analyzeResume: (resumeText, targetRole) =>
    api.post('/chatbot/resume-analyze', { resumeText, targetRole }),

  getCareerInsights: () => api.get('/chatbot/career-insights'),
};

/* ==============================
   🎤 VOICE CHAT API (NEW 🔥)
============================== */
export const voiceAPI = {
  sendVoice: (formData) =>
    axios.post(`${API_URL}/chatbot/voice`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

/* ==============================
   💬 CHAT API (REALTIME)
============================== */
export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getOrCreateChat: (userId) => api.get(`/chat/with/${userId}`),
  getMessages: (chatId, params) =>
    api.get(`/chat/${chatId}/messages`, { params }),
  sendMessage: (chatId, content) =>
    api.post(`/chat/${chatId}/messages`, { content }),
  deleteMessage: (messageId) =>
    api.delete(`/chat/message/${messageId}`)
};

/* ==============================
   🔔 NOTIFICATION API
============================== */
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};