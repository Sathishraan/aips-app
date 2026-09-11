import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import { StaffEmpty, staffUi } from '../../components/staff/StaffUi';
import { useStudentRemarks } from '../../hooks/useStaffErp';
import { colors, radii, shadows, space } from '../../theme/appTheme';

const formatWhen = (value?: string) => {
  if (!value) return '';
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const RemarksScreen = () => {
  const { data: remarks = [], isFetching, refetch } = useStudentRemarks();

  return (
    <View style={staffUi.root}>
      <ModuleHeader title="Remarks" subtitle="From staff to parent" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {isFetching && !remarks.length ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : !remarks.length ? (
          <StaffEmpty
            icon="chatbox-ellipses-outline"
            title="No remarks yet"
            text="When a teacher sends a remark, it will appear here."
          />
        ) : (
          remarks.map((item: any, index: number) => (
            <View key={String(item.id || index)} style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.remark_for || 'Remark'}</Text>
                </View>
                <Text style={styles.date}>{formatWhen(item.inserted_date)}</Text>
              </View>

              <Text style={styles.body}>{item.behaviour_remarks}</Text>
              {!!item.action_desc && <Text style={styles.action}>Action: {item.action_desc}</Text>}

              <View style={styles.metaRow}>
                <Icon name="person-outline" size={14} color={colors.primary} />
                <Text style={styles.meta}>
                  Staff: {item.remark_by || item.action_taken_by || 'Teacher'}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Icon name="people-outline" size={14} color={colors.success} />
                <Text style={styles.meta}>
                  Parent: {item.parent_name || 'Parent'}
                  {item.parent_mobile ? ` · ${item.parent_mobile}` : ''}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 40, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
    ...shadows.card,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  badgeText: { color: colors.primary, fontWeight: '800', fontSize: 11 },
  date: { color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  body: { marginTop: 10, color: colors.text, fontWeight: '600', fontSize: 15, lineHeight: 22 },
  action: { marginTop: 6, color: colors.textSecondary, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  meta: { color: colors.textSecondary, fontWeight: '600', fontSize: 13, flex: 1 },
});

export default RemarksScreen;
