// navigation/AppNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

// Role dashboards
import StudentDashboard  from '../screens/student/StudentDashboard';
import AlumniDashboard   from '../screens/alumni/AlumniDashboard';
import FacultyDashboard  from '../screens/faculty/FacultyDashboard';
import AdminDashboard    from '../screens/admin/AdminDashboard';

// Tab screens
import JobsScreen            from '../screens/JobsScreen';
import EventsScreen          from '../screens/EventsScreen';
import ConversationsScreen   from '../screens/ConversationsScreen';
import LeaderboardScreen     from '../screens/LeaderboardScreen';

// Stack screens
import JobDetailScreen       from '../screens/JobDetailScreen';
import EventDetailScreen     from '../screens/EventDetailScreen';
import MentorshipScreen      from '../screens/MentorshipScreen';
import ChatbotScreen         from '../screens/ChatbotScreen';
import ChatScreen            from '../screens/ChatScreen';
import ResumeAnalyzerScreen  from '../screens/ResumeAnalyzerScreen';
import NotificationsScreen   from '../screens/NotificationsScreen';
import GamificationScreen    from '../screens/GamificationScreen';
import CareerScreen          from '../screens/CareerScreen';
import StartupsScreen        from '../screens/StartupsScreen';
import AlumniDirectoryScreen from '../screens/AlumniDirectoryScreen';
import UserProfileScreen     from '../screens/UserProfileScreen';
import ProfileScreen         from '../screens/ProfileScreen';
import NoticeScreen          from '../screens/NoticeScreen';
import PostJobScreen         from '../screens/PostJobScreen';
import PostEventScreen       from '../screens/PostEventScreen';
import PostNoticeScreen      from '../screens/PostNoticeScreen';

// ✅ ADD THESE (same screens folder)
import ManageUsersScreen from '../screens/ManageUsersScreen';
import AnalyticsScreen   from '../screens/AnalyticsScreen';
import ApprovalsScreen   from '../screens/ApprovalsScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function getDashboard(role) {
  return { alumni: AlumniDashboard, faculty: FacultyDashboard, admin: AdminDashboard }[role]
    || StudentDashboard;
}

// ─── More tab stack ─────────────────────────────────────────
function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome"        component={LeaderboardScreen} />
      <Stack.Screen name="Career"          component={CareerScreen} />
      <Stack.Screen name="Startups"        component={StartupsScreen} />
      <Stack.Screen name="AlumniDirectory" component={AlumniDirectoryScreen} />
      <Stack.Screen name="Notices"         component={NoticeScreen} />
      <Stack.Screen name="Gamification"    component={GamificationScreen} />
      <Stack.Screen name="ResumeAnalyzer"  component={ResumeAnalyzerScreen} />
      <Stack.Screen name="Mentorship"      component={MentorshipScreen} />
    </Stack.Navigator>
  );
}

// ─── Bottom tab navigator ───────────────────────────────────
function MainTabs() {
  const { user, roleColors } = useAuth();
  const Dashboard = getDashboard(user?.role);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   roleColors?.primary || '#3B82F6',
        tabBarInactiveTintColor: '#4B5563',
        tabBarStyle: {
          backgroundColor: '#0D0D1A',
          borderTopColor:  '#1A1A2E',
          height: 62,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Home:     focused ? 'home'        : 'home-outline',
            Jobs:     focused ? 'briefcase'   : 'briefcase-outline',
            Events:   focused ? 'calendar'    : 'calendar-outline',
            Messages: focused ? 'chatbubbles' : 'chatbubbles-outline',
            More:     focused ? 'grid'        : 'grid-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"     component={Dashboard} />
      <Tab.Screen name="Jobs"     component={JobsScreen} />
      <Tab.Screen name="Events"   component={EventsScreen} />
      <Tab.Screen name="Messages" component={ConversationsScreen} />
      <Tab.Screen name="More"     component={MoreStack} />
    </Tab.Navigator>
  );
}

// ─── Root stack ─────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      
      <Stack.Screen name="Main" component={MainTabs} />

    
      <Stack.Screen name="Mentorship"      component={MentorshipScreen} />
      <Stack.Screen name="JobDetail"       component={JobDetailScreen} />
      <Stack.Screen name="EventDetail"     component={EventDetailScreen} />
      <Stack.Screen name="UserProfile"     component={UserProfileScreen} />
      <Stack.Screen name="Chat"            component={ChatScreen} />
      <Stack.Screen name="Chatbot"         component={ChatbotScreen} />
      <Stack.Screen name="Profile"         component={ProfileScreen} />
      <Stack.Screen name="Career"          component={CareerScreen} />
      <Stack.Screen name="ResumeAnalyzer"  component={ResumeAnalyzerScreen} />
      <Stack.Screen name="Notifications"   component={NotificationsScreen} />
      <Stack.Screen name="Gamification"    component={GamificationScreen} />
      <Stack.Screen name="AlumniDirectory" component={AlumniDirectoryScreen} />
      <Stack.Screen name="Notices"         component={NoticeScreen} />
      <Stack.Screen name="PostJob"         component={PostJobScreen} />
      <Stack.Screen name="PostEvent"       component={PostEventScreen} />
      <Stack.Screen name="PostNotice"      component={PostNoticeScreen} />

      <Stack.Screen name="Startups"        component={StartupsScreen} /> 
      <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
      <Stack.Screen name="Analytics"   component={AnalyticsScreen} />
      <Stack.Screen name="Approvals"   component={ApprovalsScreen} />

    </Stack.Navigator>
  );
}