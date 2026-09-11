import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  Animated,
  useWindowDimensions,
  Keyboard,
} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeStack from './HomeStack';
import HomeworkScreen from '../screens/HomeworkScreen';
import FeesStack from './FeesStack';
import ProfileScreen from '../screens/ProfileScreen';
import { useUser, isEmployee } from '../hooks/useUser';
import { useRoleColors } from '../hooks/useRoleColors';

const Tab = createBottomTabNavigator();

/** WhatsApp-like content band (icon + label), excluding system inset */
const TAB_CONTENT_HEIGHT = {
  phone: 56,
  tablet: 60,
} as const;

type TabMeta = {
  label: string;
  icon: keyof typeof Icon.glyphMap;
  iconFocused: keyof typeof Icon.glyphMap;
};

const TAB_META: Record<string, TabMeta> = {
  Home: { label: 'Home', icon: 'home-outline', iconFocused: 'home' },
  Homework: { label: 'Homework', icon: 'book-outline', iconFocused: 'book' },
  FeesStack: { label: 'Fees', icon: 'card-outline', iconFocused: 'card' },
  Profile: { label: 'Profile', icon: 'person-outline', iconFocused: 'person' },
};

/** Hide bar inside chat / deep screens (like WhatsApp chat view) */
const HIDE_TAB_ROUTES = new Set([
  'Chat',
  'NewCommunication',
  'HomeworkDetail',
  'StaffHomework',
  'SwitchUser',
]);

function getDeepestRouteName(navState: any): string {
  let current = navState;
  let name = '';
  while (current?.routes?.length) {
    const index = typeof current.index === 'number' ? current.index : current.routes.length - 1;
    const route = current.routes[index];
    if (!route) break;
    name = route.name || name;
    current = route.state;
  }
  return name;
}

function WhatsAppTabItem({
  routeName,
  focused,
  onPress,
  onLongPress,
  isTablet,
  accent,
}: {
  routeName: string;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  isTablet: boolean;
  accent: string;
}) {
  const meta = TAB_META[routeName] || {
    label: routeName,
    icon: 'ellipse-outline' as const,
    iconFocused: 'ellipse' as const,
  };

  const press = useRef(new Animated.Value(1)).current;
  const tint = focused ? accent : '#54656F';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        Animated.timing(press, {
          toValue: 0.94,
          duration: 80,
          useNativeDriver: true,
        }).start();
      }}
      onPressOut={() => {
        Animated.timing(press, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }).start();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={meta.label}
      android_ripple={{ color: 'rgba(66, 78, 121, 0.12)', borderless: true, radius: 36 }}
      style={styles.tabPressable}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale: press }] }]}>
        <Icon
          name={focused ? meta.iconFocused : meta.icon}
          size={isTablet ? 26 : 24}
          color={tint}
        />
        <Text
          style={[
            styles.tabLabel,
            isTablet && styles.tabLabelTablet,
            { color: tint, fontWeight: focused ? '700' : '500' },
          ]}
          numberOfLines={1}
        >
          {meta.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function WhatsAppTabBar({ state, navigation, keyboardVisible }: BottomTabBarProps & { keyboardVisible: boolean }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const brand = useRoleColors();
  const isTablet = Math.min(width, height) >= 600;
  const contentHeight = isTablet ? TAB_CONTENT_HEIGHT.tablet : TAB_CONTENT_HEIGHT.phone;
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 8);

  const nestedName = getDeepestRouteName(state);
  const shouldHide = HIDE_TAB_ROUTES.has(nestedName) || keyboardVisible;

  const hideAnim = useRef(new Animated.Value(shouldHide ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(hideAnim, {
      toValue: shouldHide ? 0 : 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [shouldHide, hideAnim]);

  const barHeight = contentHeight + bottomInset;

  // Must collapse layout height (not only fade). A translated bar still
  // reserves space, so the chat composer sits above an empty gap and the
  // keyboard covers it — especially on the student tab navigator.
  if (shouldHide) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          height: barHeight,
          paddingBottom: bottomInset,
          opacity: hideAnim,
        },
      ]}
    >
      <View style={[styles.row, { height: contentHeight }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <WhatsAppTabItem
              key={route.key}
              routeName={route.name}
              focused={focused}
              onPress={onPress}
              onLongPress={onLongPress}
              isTablet={isTablet}
              accent={brand.primary}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

export default function BottomTabs() {
  const { user } = useUser();
  const staffMode = isEmployee(user);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const contentHeight = isTablet ? TAB_CONTENT_HEIGHT.tablet : TAB_CONTENT_HEIGHT.phone;
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 8);
  const barHeight = contentHeight + bottomInset;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const screenOptions = ({ route }: { route: any }) => {
    const nestedName =
      getFocusedRouteNameFromRoute(route) ||
      getDeepestRouteName(route.state) ||
      '';
    const hideBar = HIDE_TAB_ROUTES.has(nestedName) || keyboardVisible;
    return {
      headerShown: false,
      tabBarShowLabel: false,
      tabBarHideOnKeyboard: true,
      safeAreaInsets: { bottom: 0 },
      tabBarStyle: hideBar
        ? { height: 0, display: 'none' as const, position: 'absolute' as const, opacity: 0 }
        : {
            height: barHeight,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            elevation: 0,
          },
    };
  };

  return (
    <Tab.Navigator
      tabBar={(props) => <WhatsAppTabBar {...props} keyboardVisible={keyboardVisible} />}
      screenOptions={screenOptions}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      {!staffMode && (
        <>
          <Tab.Screen name="Homework" component={HomeworkScreen} />
          <Tab.Screen
            name="FeesStack"
            component={FeesStack}
            options={{ title: 'Fees' }}
          />
        </>
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E9EDEF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -0.5 },
        shadowOpacity: 0.06,
        shadowRadius: 0,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabPressable: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 64,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.1,
    marginTop: 1,
  },
  tabLabelTablet: {
    fontSize: 12,
  },
});
