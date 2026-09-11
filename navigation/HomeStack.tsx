import React, { useLayoutEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import HomeScreen from '../screens/HomeScreen';
import StudentManagementScreen from '../screens/modules/StudentManagementScreen';
import OfficeManagementScreen from '../screens/modules/OfficeManagementScreen';
import ExamResultsScreen from '../screens/modules/ExamResultsScreen';
import AttendanceScreen from '../screens/modules/AttendanceScreen';
import ContactScreen from '../screens/modules/ContactScreen';
import TimeTableScreen from '../screens/modules/TimeTableScreen';
import TransportsScreen from '../screens/modules/TransportsScreen';
import EventsScreen from '../screens/modules/EventsScreen';
import GalleryScreen from '../screens/modules/GalleryScreen';
import CircularScreen from '../screens/modules/CircularScreen';
import OnlineClassScreen from '../screens/modules/OnlineClassScreen';
import LeaveRequestScreen from '../screens/modules/LeaveRequestScreen';
import VideosScreen from '../screens/modules/VideosScreen';
import CommunicationScreen from '../screens/modules/CommunicationScreen';
import ChatScreen from '../screens/modules/ChatScreen';
import NewCommunicationScreen from '../screens/modules/Communication';
import ChatList from '../screens/modules/ChatList';
import CommunicationRouter from '../screens/modules/CommunicationRouter';
import NotificationsScreen from '../screens/modules/NotificationsScreen';
import ResultScreen from '../screens/ResultScreen';


// Event Category Screens
import SportsEventsScreen from '../screens/modules/events/SportsEventsScreen';
import CompetitionEventsScreen from '../screens/modules/events/CompetitionEventsScreen';
import ProgramEventsScreen from '../screens/modules/events/ProgramEventsScreen';
import CulturalEventsScreen from '../screens/modules/events/CulturalEventsScreen';

import HomeworkScreen from '../screens/HomeworkScreen';
import FeesScreen from '../screens/FeesScreen';
import FeesHistoryScreen from '../screens/FeesHistoryScreen';
import StaffHomework from '../screens/modules/StaffHomework/StaffHomework';
import StaffAttendanceScreen from '../screens/modules/StaffAttendanceScreen';
import StaffAttendanceMarkScreen from '../screens/modules/StaffAttendanceMarkScreen';
import StaffMarkEntryScreen from '../screens/modules/StaffMarkEntryScreen';
import StaffLeaveApproveScreen from '../screens/modules/StaffLeaveApproveScreen';
import StaffLeaveScreen from '../screens/modules/StaffLeaveScreen';
import StaffRemarksScreen from '../screens/modules/StaffRemarksScreen';
import RemarksScreen from '../screens/modules/RemarksScreen';

import SchoolCalendarScreen from '../screens/modules/SchoolCalendarScreen';
import SchoolCalendarMonthScreen from '../screens/modules/SchoolCalendarMonthScreen';

import { useUser } from '../hooks/useUser';

const Stack = createNativeStackNavigator();

const ChatScreenWrapper = (props: any) => {
  const { user } = useUser();
  const userId = (user as any)?.studentId || (user as any)?.employeeId || (user as any)?.adminId || 'anonymous';
  console.log('🛡️ [HomeStack] ChatScreenWrapper for userId:', userId);
  return <ChatScreen key={userId} {...props} />;
};

const HIDE_TAB_ON = new Set(['Chat', 'NewCommunication']);

export default function HomeStack({ navigation, route }: any) {
  const nestedName = getFocusedRouteNameFromRoute(route) ?? 'HomeMain';
  const hideTabBar = HIDE_TAB_ON.has(nestedName);

  useLayoutEffect(() => {
    // HomeStack is the Home tab. setOptions here is what actually collapses
    // the employee (2-tab) bar — ChatScreen cannot see that tab route.
    navigation?.setOptions({
      tabBarStyle: hideTabBar
        ? { display: 'none', height: 0, position: 'absolute', overflow: 'hidden' }
        : { display: 'flex', height: undefined, position: 'relative' },
    });
  }, [navigation, hideTabBar]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 280,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />

      <Stack.Screen name="Homework" component={HomeworkScreen} />
      <Stack.Screen name="Fees" component={FeesScreen} />
      <Stack.Screen name="FeesHistory" component={FeesHistoryScreen} />
      <Stack.Screen name="StudentManagement" component={StudentManagementScreen} />
      <Stack.Screen name="OfficeManagement" component={OfficeManagementScreen} />
      <Stack.Screen name="ExamResults" component={ExamResultsScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="TimeTable" component={TimeTableScreen} />
      <Stack.Screen name="Transports" component={TransportsScreen} />
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="SchoolCalendar" component={SchoolCalendarScreen} />
      <Stack.Screen name="SchoolCalendarMonth" component={SchoolCalendarMonthScreen} />
      <Stack.Screen name="SportsEvents" component={SportsEventsScreen} />
      <Stack.Screen name="CompetitionEvents" component={CompetitionEventsScreen} />
      <Stack.Screen name="ProgramEvents" component={ProgramEventsScreen} />
      <Stack.Screen name="CulturalEvents" component={CulturalEventsScreen} />
      <Stack.Screen name="Gallery" component={GalleryScreen} />
      <Stack.Screen name="Circular" component={CircularScreen} />
      <Stack.Screen name="OnlineClass" component={OnlineClassScreen} />
      <Stack.Screen name="LeaveRequest" component={LeaveRequestScreen} />
      <Stack.Screen name="Videos" component={VideosScreen} />
      <Stack.Screen name="Communication" component={CommunicationRouter} />
      <Stack.Screen name="ChatList" component={ChatList} />
      <Stack.Screen name="Chat" component={ChatScreenWrapper} />
      <Stack.Screen name="NewCommunication" component={NewCommunicationScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="StaffHomework" component={StaffHomework} />
      <Stack.Screen name="StaffAttendance" component={StaffAttendanceScreen} />
      <Stack.Screen name="StaffAttendanceMark" component={StaffAttendanceMarkScreen} />
      <Stack.Screen name="StaffMarkEntry" component={StaffMarkEntryScreen} />
      <Stack.Screen name="StaffLeaveApprove" component={StaffLeaveApproveScreen} />
      <Stack.Screen name="StaffLeave" component={StaffLeaveScreen} />
      <Stack.Screen name="StaffRemarks" component={StaffRemarksScreen} />
      <Stack.Screen name="Remarks" component={RemarksScreen} />

    </Stack.Navigator>
  );
}
