import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider, useIsFetching, useIsMutating } from '@tanstack/react-query';
import AppStack from './navigation/AppStack';
import { initAuth } from './api/base';
import { queryClient } from './api/queryClient';
import { LoadingProvider, useLoading } from './context/LoadingContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import { navigationRef } from './navigation/RootNavigation';
import { useGlobalMessageListener } from './hooks/useGlobalMessageListener';
import { useSocket } from './hooks/useSocket';
import Constants from 'expo-constants';
import {
  handleNotification,
  handleNotificationResponse,
  ensureNotificationPermissions,
} from './utils/notification.utils';
import { getAuthToken } from './api/base';

const isExpoGo = Constants.appOwnership === 'expo';

/**
 * GlobalLoading component handles showing the loading spinner 
 * based on TanStack Query activity and manual loading states.
 */
function GlobalLoading() {
  const { isLoading: manualLoading } = useLoading();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const isLoading = manualLoading || isFetching > 0 || isMutating > 0;

  return <LoadingSpinner visible={isLoading} />;
}

/**
 * Background listeners that don't need to re-render when loading status changes
 */
const AppListeners = React.memo(() => {
  useSocket();
  useGlobalMessageListener();
  return null;
});

function AppContent() {
  console.log('🚀 [AppContent] Rendering');

  return (
    <>
      <AppListeners />
      <NavigationContainer ref={navigationRef}>
        <AppStack />
      </NavigationContainer>
      <GlobalLoading />
    </>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        await initAuth();
        // Ask parent to allow notifications after auth is ready
        if (getAuthToken()) {
          await ensureNotificationPermissions();
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    };

    prepare();

    if (isExpoGo) {
      return;
    }

    let notificationListener: { remove: () => void } | undefined;
    let responseListener: { remove: () => void } | undefined;
    try {
      const Notifications = require('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      notificationListener = Notifications.addNotificationReceivedListener(handleNotification);
      responseListener = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    } catch (e) {
      console.warn('⚠️ Notifications native module not ready:', e);
    }

    return () => {
      notificationListener?.remove();
      responseListener?.remove();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#5a6898" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <LoadingProvider>
          <AppContent />
        </LoadingProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
