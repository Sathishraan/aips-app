import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors } from '../../theme/appTheme';

type Edges = ('top' | 'right' | 'bottom' | 'left')[];

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** Scrollable body (default true for form/list screens) */
  scroll?: boolean;
  /** Skip bottom safe area when a tab bar is present */
  edges?: Edges;
  keyboard?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  statusBarStyle?: 'light-content' | 'dark-content';
  statusBarColor?: string;
  /** Center & cap width on tablet */
  constrain?: boolean;
  backgroundColor?: string;
}

/**
 * Standard screen shell: SafeArea + flex + optional scroll/keyboard + tablet max-width.
 * Does not change navigation or business logic.
 */
const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  contentStyle,
  scroll = false,
  edges = ['top', 'left', 'right'],
  keyboard = false,
  refreshing,
  onRefresh,
  statusBarStyle = 'dark-content',
  statusBarColor = colors.background,
  constrain = true,
  backgroundColor = colors.background,
}) => {
  const { horizontalPadding, contentMaxWidth, isTablet, insets } = useResponsiveLayout();

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingHorizontal: horizontalPadding,
          paddingBottom: Math.max(insets.bottom, 16) + 8,
          alignItems: constrain && isTablet ? 'center' : 'stretch',
        },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      <View style={constrain ? { width: '100%', maxWidth: contentMaxWidth } : undefined}>
        {children}
      </View>
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        {
          paddingHorizontal: horizontalPadding,
          alignItems: constrain && isTablet ? 'center' : 'stretch',
        },
        contentStyle,
      ]}
    >
      <View style={[styles.flex, constrain && { width: '100%', maxWidth: contentMaxWidth }]}>
        {children}
      </View>
    </View>
  );

  const wrapped = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor }, style]} edges={edges}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarColor} />
      {wrapped}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});

export default Screen;
