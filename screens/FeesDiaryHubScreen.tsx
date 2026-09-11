import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../components/common/ModuleHeader';
import FeesScreen from './FeesScreen';
import DiaryScreen from './modules/DiaryScreen';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { colors, radii, space } from '../theme/appTheme';

type HubTab = 'fees' | 'diary';

/**
 * Fees + Diary hub — Diary is view-only (read-only).
 */
export default function FeesDiaryHubScreen() {
  const [tab, setTab] = useState<HubTab>('fees');
  const { horizontalPadding, contentMaxWidth } = useResponsiveLayout();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ModuleHeader
        title={tab === 'fees' ? 'Fees' : 'Diary'}
        subtitle={
          tab === 'fees'
            ? 'Fee summary & receipts'
            : 'View only · Daily notes'
        }
      />

      <View style={[styles.segmentWrap, { paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.segment, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'fees' && styles.segmentBtnActive]}
            onPress={() => setTab('fees')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === 'fees' }}
          >
            <Icon
              name="card-outline"
              size={18}
              color={tab === 'fees' ? colors.primaryDark : colors.textMuted}
            />
            <Text style={[styles.segmentText, tab === 'fees' && styles.segmentTextActive]}>
              Fees
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'diary' && styles.segmentBtnActive]}
            onPress={() => setTab('diary')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === 'diary' }}
          >
            <Icon
              name="journal-outline"
              size={18}
              color={tab === 'diary' ? colors.primaryDark : colors.textMuted}
            />
            <Text style={[styles.segmentText, tab === 'diary' && styles.segmentTextActive]}>
              Diary
            </Text>
            <View style={styles.viewBadge}>
              <Text style={styles.viewBadgeText}>View</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        {tab === 'fees' ? (
          <FeesScreen embedded />
        ) : (
          <DiaryScreen embedded />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentWrap: {
    paddingTop: space.sm,
    paddingBottom: space.sm,
    backgroundColor: colors.background,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.md,
  },
  segmentBtnActive: {
    backgroundColor: colors.primarySoft,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  viewBadge: {
    backgroundColor: colors.primaryBorder,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  viewBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.2,
  },
  body: {
    flex: 1,
  },
});
