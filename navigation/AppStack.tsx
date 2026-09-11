import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import BottomTabs from './BottomTabs';
import SettingsScreen from '../screens/SettingsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import HomeworkDetailScreen from '../screens/HomeworkDetailScreen';
import SwitchUserScreen from '../screens/SwitchUserScreen';
import { getAuthToken } from '../api/base';

const Stack = createNativeStackNavigator();

export default function AppStack() {
    const token = getAuthToken();
    const initialRoute = token ? "MainTabs" : "Login";

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'fade_from_bottom',
                animationDuration: 260,
                gestureEnabled: true,
                contentStyle: { backgroundColor: '#F8FAFC' },
            }}
            initialRouteName={initialRoute}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="MainTabs" component={BottomTabs} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="HomeworkDetail" component={HomeworkDetailScreen} />
            <Stack.Screen
                name="SwitchUser"
                component={SwitchUserScreen}
                options={{ animation: 'slide_from_bottom', animationDuration: 300 }}
            />
        </Stack.Navigator>
    );
}
