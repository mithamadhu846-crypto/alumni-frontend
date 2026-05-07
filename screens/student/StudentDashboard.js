// screens/student/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { jobAPI, eventAPI, noticeAPI, userAPI, notificationAPI, chatbotAPI } from '../../utils/api';
import { StatCard, SectionTitle, RoleBadge, Avatar, EmptyState, PriorityBadge } from '../../components/UI';
import { Card } from '../../components/Card';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats] = useState({ jobs: 0, events: 0, mentors: 0 });
  const [recentJobs, setRecentJobs] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [matches, setMatches] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [insights, setInsights] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [jobsRes, eventsRes, noticesRes, matchesRes, notifsRes, insightsRes] = await Promise.allSettled([
        jobAPI.getJobs({ limit: 5 }),
        eventAPI.getEvents({ upcoming: true, limit: 4 }),
        noticeAPI.getNotices(),
        userAPI.getMatches(),
        notificationAPI.getNotifications({ limit: 1 }),
        chatbotAPI.getCareerInsights(),
      ]);
      if (jobsRes.status === 'fulfilled') {
        setRecentJobs(jobsRes.value.data.jobs || []);
        setStats(s => ({ ...s, jobs: jobsRes.value.data.pagination?.total || 0 }));
      }
      if (eventsRes.status === 'fulfilled') {
        setUpcomingEvents(eventsRes.value.data.events || []);
        setStats(s => ({ ...s, events: eventsRes.value.data.pagination?.total || 0 }));
      }
      if (noticesRes.status === 'fulfilled') setNotices(noticesRes.value.data.notices || []);
      if (matchesRes.status === 'fulfilled') {
        const m = matchesRes.value.data.matches || [];
        setMatches(m.slice(0, 4));
        setStats(s => ({ ...s, mentors: m.length }));
      }
      if (notifsRes.status === 'fulfilled') setUnreadNotifs(notifsRes.value.data.unreadCount || 0);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value.data.insights || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning 🌅';
    if (h < 17) return 'Good afternoon ☀️';
    return 'Good evening 🌙';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
    >
      {/* Hero */}
      <LinearGradient colors={['#1D4ED8', '#3B82F6', '#06B6D4']} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.heroName}>{user?.name?.split(' ')[0]}</Text>
            <RoleBadge role={user?.role} />
          </View>
          <View style={styles.heroRight}>
            {/* Notification bell */}
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadNotifs > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar name={user?.name} uri={user?.avatar} size={50} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.heroDeptRow}>
          <Ionicons name="school-outline" size={13} color="rgba(255,255,255,0.7)" />
          <Text style={styles.heroDept}>{user?.department} · {user?.enrollmentYear || user?.graduationYear}</Text>
        </View>
        {user?.points > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Gamification')} style={styles.pointsRow}>
            <Ionicons name="star" size={13} color="#FCD34D" />
            <Text style={styles.pointsText}>{user.points} points</Text>
            {user?.badges?.slice(0, 3).map(b => <Text key={b.name} style={{ fontSize: 13 }}>{b.icon}</Text>)}
          </TouchableOpacity>
        )}
      </LinearGradient>

      <View style={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Open Jobs"  value={stats.jobs}    icon="briefcase-outline" color="#3B82F6" style={{ marginRight: 6 }} />
          <StatCard label="Events"     value={stats.events}  icon="calendar-outline"  color="#8B5CF6" style={{ marginHorizontal: 3 }} />
          <StatCard label="Mentors"    value={stats.mentors} icon="people-outline"    color="#10B981" style={{ marginLeft: 6 }} />
        </View>

        {/* Quick Actions */}
        <SectionTitle title="Quick Actions" />
        <View style={styles.actionsGrid}>
          {[
            { icon: 'people-outline',               label: 'Find Mentor',   color: '#10B981', screen: 'Mentorship' },
            { icon: 'briefcase-outline',             label: 'Browse Jobs',   color: '#3B82F6', screen: 'Jobs' },
            { icon: 'trending-up-outline',           label: 'Career Path',   color: '#8B5CF6', screen: 'Career' },
            { icon: 'analytics-outline',             label: 'Skill Gap',     color: '#F59E0B', screen: 'Career' },
            { icon: 'document-text-outline',         label: 'Resume AI',     color: '#A78BFA', screen: 'ResumeAnalyzer' },
            { icon: 'trophy-outline',                label: 'My Badges',     color: '#EF4444', screen: 'Gamification' },
            { icon: 'chatbubble-ellipses-outline',   label: 'AI Chat',       color: '#06B6D4', screen: 'Chatbot' },
            { icon: 'chatbubbles-outline',           label: 'Messages',      color: '#EC4899', tab: 'Messages' },
            { icon: 'rocket-outline', label: 'Startup', color: '#F97316', screen: 'Startups' },
          ].map(({ icon, label, color, screen, tab }) => (
            <TouchableOpacity
              key={label}
              style={styles.actionCard}
              onPress={() => tab ? navigation.navigate(tab) : navigation.navigate(screen)}
            >
              <View style={[styles.actionIcon, { backgroundColor: color + '22' }]}>
                <Ionicons name={icon} size={22} color={color} />
              </View>
              <Text style={styles.actionLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Career Insights */}
        {insights.length > 0 && (
          <>
            <SectionTitle title="✨ AI Career Insights" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {insights.map((ins, i) => (
                <View key={i} style={[styles.insightCard, { borderColor: ins.color + '44' }]}>
                  <Text style={styles.insightIcon}>{ins.icon}</Text>
                  <Text style={[styles.insightTitle, { color: ins.color }]}>{ins.title}</Text>
                  <Text style={styles.insightBody}>{ins.body}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Notices */}
        {notices.length > 0 && (
          <>
            <SectionTitle title="📢 Notices" action="See All" onAction={() => navigation.navigate('Notices')} />
            {notices.slice(0, 2).map(n => (
              <Card key={n._id}>
                <View style={styles.noticeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noticeTitle}>{n.title}</Text>
                    <Text style={styles.noticeContent} numberOfLines={2}>{n.content}</Text>
                  </View>
                  <PriorityBadge priority={n.priority} />
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Top Mentor Matches */}
        <SectionTitle title="🎯 AI Mentor Matches" action="See All" onAction={() => navigation.navigate('Mentorship')} />
        {matches.length === 0
          ? <EmptyState icon="people-outline" title="No mentor matches yet" subtitle="Complete your profile with skills to get matched" />
          : matches.map(({ alumni: alum, score, sharedSkills, breakdown }) => (
            <TouchableOpacity key={alum._id} onPress={() => navigation.navigate('UserProfile', { userId: alum._id })}>
              <Card>
                <View style={styles.mentorRow}>
                  <Avatar name={alum.name} uri={alum.avatar} size={46} color="#10B981" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.mentorName}>{alum.name}</Text>
                    <Text style={styles.mentorRole}>{alum.currentRole} at {alum.currentCompany}</Text>
                    <View style={styles.skillsRow}>
                      {sharedSkills?.slice(0, 3).map(s => (
                        <View key={s} style={styles.skillPill}>
                          <Text style={styles.skillText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                    {/* Score breakdown mini-bar */}
                    <View style={styles.scoreBreakdown}>
                      {breakdown && Object.entries({ Skills: breakdown.skills?.score, Dept: breakdown.department?.score, Career: breakdown.career?.score }).map(([k, v]) => (
                        <View key={k} style={styles.scoreItem}>
                          <Text style={styles.scoreItemLabel}>{k}</Text>
                          <View style={styles.scoreBarBg}>
                            <View style={[styles.scoreBarFill, { width: `${Math.min(100, (v / 40) * 100)}%` }]} />
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.scoreCircle}>
                    <Text style={styles.scoreNum}>{score}%</Text>
                    <Text style={styles.scoreLabel}>match</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        }

        {/* Recent Jobs */}
        <SectionTitle title="💼 Recent Jobs" action="See All" onAction={() => navigation.navigate('Jobs')} />
        {recentJobs.slice(0, 3).map(job => (
          <TouchableOpacity key={job._id} onPress={() => navigation.navigate('JobDetail', { jobId: job._id })}>
            <Card>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobCompany}>{job.company} · {job.location}</Text>
              <View style={styles.jobMeta}>
                <View style={styles.jobTypeBadge}><Text style={styles.jobTypeText}>{job.type}</Text></View>
                {job.salary?.min && (
                  <Text style={styles.jobSalary}>₹{(job.salary.min / 100000).toFixed(1)}L–₹{(job.salary.max / 100000).toFixed(1)}L</Text>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {/* Upcoming Events */}
        <SectionTitle title="📅 Upcoming Events" action="See All" onAction={() => navigation.navigate('Events')} />
        {upcomingEvents.slice(0, 2).map(ev => (
          <TouchableOpacity key={ev._id} onPress={() => navigation.navigate('EventDetail', { eventId: ev._id })}>
            <Card>
              <View style={styles.eventRow}>
                <View style={styles.eventDateBox}>
                  <Text style={styles.eventDay}>{new Date(ev.date).getDate()}</Text>
                  <Text style={styles.eventMonth}>{new Date(ev.date).toLocaleString('default', { month: 'short' })}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.eventTitle}>{ev.title}</Text>
                  <Text style={styles.eventVenue} numberOfLines={1}>{ev.isOnline ? '🌐 Online' : ev.venue}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  hero: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 24 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  heroRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  heroName: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  heroDeptRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroDept: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  bellBtn: { position: 'relative', padding: 4 },
  bellBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#1D4ED8' },
  bellBadgeText: { fontSize: 9, color: '#fff', fontWeight: '800' },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, backgroundColor: 'rgba(0,0,0,0.2)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  pointsText: { fontSize: 12, color: '#FCD34D', fontWeight: '700' },
  content: { padding: 16 },
  statsRow: { flexDirection: 'row', marginBottom: 20 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  actionCard: { width: '22%', backgroundColor: '#1E2235', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#2D3448' },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 10, color: '#94A3B8', textAlign: 'center', fontWeight: '600' },
  insightCard: { width: 200, backgroundColor: '#1E2235', borderRadius: 14, padding: 14, marginRight: 10, borderWidth: 1 },
  insightIcon: { fontSize: 24, marginBottom: 6 },
  insightTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  insightBody: { fontSize: 12, color: '#94A3B8', lineHeight: 17 },
  noticeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  noticeContent: { fontSize: 12, color: '#64748B' },
  mentorRow: { flexDirection: 'row', alignItems: 'flex-start' },
  mentorName: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  mentorRole: { fontSize: 12, color: '#64748B', marginTop: 2 },
  skillsRow: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  skillPill: { backgroundColor: '#1E3A5F', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  skillText: { fontSize: 10, color: '#60A5FA' },
  scoreBreakdown: { marginTop: 8, gap: 3 },
  scoreItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreItemLabel: { fontSize: 9, color: '#64748B', width: 34 },
  scoreBarBg: { flex: 1, height: 3, backgroundColor: '#0F172A', borderRadius: 2 },
  scoreBarFill: { height: 3, backgroundColor: '#10B981', borderRadius: 2 },
  scoreCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#10B98122', borderWidth: 2, borderColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  scoreNum: { fontSize: 13, fontWeight: '800', color: '#10B981' },
  scoreLabel: { fontSize: 8, color: '#10B981' },
  jobTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  jobCompany: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobTypeBadge: { backgroundColor: '#1E3A5F', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  jobTypeText: { fontSize: 11, color: '#60A5FA', fontWeight: '600' },
  jobSalary: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventDateBox: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#2563EB22', borderWidth: 1, borderColor: '#2563EB55', alignItems: 'center', justifyContent: 'center' },
  eventDay: { fontSize: 18, fontWeight: '800', color: '#60A5FA' },
  eventMonth: { fontSize: 9, color: '#60A5FA', fontWeight: '600' },
  eventTitle: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  eventVenue: { fontSize: 12, color: '#64748B', marginTop: 2 },
});
