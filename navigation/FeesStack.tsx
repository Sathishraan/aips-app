import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeesDiaryHubScreen from '../screens/FeesDiaryHubScreen';
import FeesHistoryScreen from '../screens/FeesHistoryScreen';

const Stack = createNativeStackNavigator();

/** Fees tab stack: hub (Fees + Diary view) + payment history */
export default function FeesStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 280,
                gestureEnabled: true,
                contentStyle: { backgroundColor: '#F8FAFC' },
            }}
        >
            <Stack.Screen name="FeesMain" component={FeesDiaryHubScreen} />
            <Stack.Screen name="FeesHistory" component={FeesHistoryScreen} />
        </Stack.Navigator>
    );
}
