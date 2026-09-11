import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import { useDiary, DiaryEntry } from '../../hooks/useDiary';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors, radii, shadows, space } from '../../theme/appTheme';

/**
 * Student Diary — VIEW ONLY (no add / edit / delete)
 */
export default function DiaryScreen({ embedded }: { embedded?: boolean }) {
  const { data, isLoading, isFetching, refetch, isError } = useDiary();
  const { horizontalPadding, contentMaxWidth, scale } = useResponsiveLayout();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const groups = data?.groups || [];
  const formatDateLabel = data?.formatDateLabel || ((d: string) => d);

  const renderEntry = (entry: DiaryEntry) => {
    const open = expandedId === entry.id;
    const isRemark = entry.type === 'remark';

    return (
      <TouchableOpacity
        key={entry.id}
        activeOpacity={0.9}
        style={styles.entryCard}
        onPress={() => setExpandedId(open ? null : entry.id)}
      >
        <View style={styles.entryHeader}>
          <View
            style={[
              styles.subjectIcon,
              { backgroundColor: isRemark ? '#FEE2E2' : colors.primarySoft },
            ]}
          >
            <Icon
              name={isRemark ? 'chatbubble-ellipses-outline' : 'book-outline'}
              size={18}
              color={isRemark ? '#DC2626' : colors.primary}
            />
          </View>
          <View style={styles.entryTitles}>
            <Text style={[styles.entrySubject, { fontSize: scale(12) }]} numberOfLines={1}>
              {entry.subject}
            </Text>
            <Text style={[styles.entryTitle, { fontSize: scale(15) }]} numberOfLines={open ? undefined : 2}>
              {entry.title}
            </Text>
          </View>
          <Icon
            name={open ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
          />
        </View>

        {open && (
          <View style={styles.entryBody}>
            {!!entry.description && (
              <Text style={styles.entryDesc}>{entry.description}</Text>
            )}
            <View style={styles.metaRow}>
              {!!entry.teacher && (
                <View style={styles.metaChip}>
                  <Icon name="person-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{entry.teacher}</Text>
                </View>
              )}
              {!!entry.due_date && (
                <View style={styles.metaChip}>
                  <Icon name="alarm-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.metaText}>Due {entry.due_date}</Text>
                </View>
              )}
              <View style={[styles.metaChip, styles.viewOnlyChip]}>
                <Icon name="eye-outline" size={12} color={colors.primary} />
                <Text style={[styles.metaText, { color: colors.primary }]}>View only</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {!embedded && (
        <>
          <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
          <ModuleHeader
            title="Diary"
            subtitle="View only · Daily school notes"
          />
        </>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: space.md,
          paddingBottom: space.xxl,
          alignItems: 'center',
        }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ width: '100%', maxWidth: contentMaxWidth }}>
          <View style={styles.infoBanner}>
            <Icon name="lock-closed-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.infoText}>
              This diary is read-only. Parents can view homework and teacher remarks.
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading diary...</Text>
            </View>
          ) : isError ? (
            <View style={styles.centerBox}>
              <Icon name="alert-circle-outline" size={48} color={colors.danger} />
              <Text style={styles.emptyText}>Unable to load diary</Text>
            </View>
          ) : groups.length === 0 ? (
            <View style={styles.centerBox}>
              <Icon name="journal-outline" size={56} color="#cbd5e1" />
              <Text style={styles.emptyText}>No diary entries yet</Text>
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.date} style={styles.dayBlock}>
                <View style={styles.dayHeader}>
                  <Icon name="calendar-outline" size={16} color={colors.primary} />
                  <Text style={styles.dayLabel}>{formatDateLabel(group.date)}</Text>
                  <Text style={styles.dayCount}>
                    {group.entries.length} note{group.entries.length === 1 ? '' : 's'}
                  </Text>
                </View>
                {group.entries.map(renderEntry)}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: space.md,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.primaryDark,
    fontWeight: '600',
    lineHeight: 17,
  },
  dayBlock: {
    marginBottom: space.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dayLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  dayCount: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: space.md,
    marginBottom: 8,
    ...shadows.card,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subjectIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTitles: {
    flex: 1,
    minWidth: 0,
  },
  entrySubject: {
    color: colors.primary,
    fontWeight: '800',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  entryTitle: {
    color: colors.text,
    fontWeight: '700',
    lineHeight: 20,
  },
  entryBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  entryDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewOnlyChip: {
    backgroundColor: colors.primarySoft,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
  },
  emptyText: {
    marginTop: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
