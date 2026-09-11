import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import { StaffEmpty, staffUi } from '../../components/staff/StaffUi';
import {
  sectionLabel,
  useApproveLeave,
  useLeaveHistory,
  usePendingLeaves,
} from '../../hooks/useStaffErp';
import { staffColors as colors, radii, shadows, space } from '../../theme/appTheme';

type HistoryFilter = 'all' | 'approved' | 'rejected';

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const raw = String(value).split(' ')[0];
  const d = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StaffLeaveApproveScreen = () => {
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const { data: pending = [], isFetching: pendingFetching, refetch: refetchPending } = usePendingLeaves();
  const { data: history = [], isFetching: historyFetching, refetch: refetchHistory } = useLeaveHistory('all');
  const approveMutation = useApproveLeave();

  const approved = useMemo(
    () => history.filter((item: any) => String(item.approved) === '1'),
    [history]
  );
  const rejected = useMemo(
    () => history.filter((item: any) => String(item.approved) === '2'),
    [history]
  );
  const historyList =
    historyFilter === 'approved' ? approved : historyFilter === 'rejected' ? rejected : history;

  const isFetching = pendingFetching || historyFetching;

  const handleRefresh = () => {
    refetchPending();
    refetchHistory();
  };

  const handleAction = (id: string | number, status: 1 | 2) => {
    const label = status === 1 ? 'approve' : 'reject';
    Alert.alert('Confirm', `Do you want to ${label} this leave?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: status === 1 ? 'Approve' : 'Reject',
        style: status === 1 ? 'default' : 'destructive',
        onPress: async () => {
          try {
            await approveMutation.mutateAsync({ id, status });
            setHistoryFilter(status === 1 ? 'approved' : 'rejected');
            Alert.alert('Done', `Leave ${label}d successfully.`);
          } catch (e: any) {
            Alert.alert('Failed', e?.message || 'Could not update leave');
          }
        },
      },
    ]);
  };

  const classLine = (leave: any) =>
    [leave.class, sectionLabel(leave.section || '')]
      .filter((part) => part && part !== 'All sections')
      .join(' · ');

  const renderPendingCard = (leave: any) => (
    <View key={String(leave.id)} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(leave.student_name || 'S').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{leave.student_name || 'Student'}</Text>
          <Text style={styles.meta}>
            {classLine(leave) || 'Class'} · Adm {leave.admission_no || leave.stud_id}
          </Text>
        </View>
        <View style={styles.daysPill}>
          <Text style={styles.daysText}>{leave.totalDays}d</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Icon name="calendar-outline" size={14} color={colors.textMuted} />
        <Text style={styles.metaRowText}>
          {formatDate(leave.fromDate)} → {formatDate(leave.toDate)}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <Icon name="document-text-outline" size={14} color={colors.textMuted} />
        <Text style={styles.reason}>{leave.reason || 'No reason given'}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.reject]}
          onPress={() => handleAction(leave.id, 2)}
          disabled={approveMutation.isPending}
        >
          <Icon name="close" size={16} color={colors.danger} />
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.approve]}
          onPress={() => handleAction(leave.id, 1)}
          disabled={approveMutation.isPending}
        >
          <Icon name="checkmark" size={16} color="#fff" />
          <Text style={styles.approveText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHistoryCard = (leave: any) => {
    const isApproved = String(leave.approved) === '1';
    return (
      <View key={String(leave.id)} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(leave.student_name || 'S').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{leave.student_name || 'Student'}</Text>
            <Text style={styles.meta}>
              {classLine(leave) || 'Class'} · Adm {leave.admission_no || leave.stud_id}
            </Text>
          </View>
          <View style={[styles.statusBadge, isApproved ? styles.approvedBadge : styles.rejectedBadge]}>
            <Text style={[styles.statusText, { color: isApproved ? colors.success : colors.danger }]}>
              {isApproved ? 'Approved' : 'Rejected'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Icon name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaRowText}>
            {formatDate(leave.fromDate)} → {formatDate(leave.toDate)} · {leave.totalDays}d
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="document-text-outline" size={14} color={colors.textMuted} />
          <Text style={styles.reason}>{leave.reason || 'No reason given'}</Text>
        </View>
        <Text style={styles.historyMeta}>
          {leave.approver_name || leave.approvedBy || 'Staff'}
          {leave.approvedOn ? ` · ${formatDateTime(leave.approvedOn)}` : ''}
        </Text>
      </View>
    );
  };

  return (
    <View style={staffUi.root}>
      <ModuleHeader title="Leave Approve" subtitle="Staff entry · pending & history" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={styles.sectionTitle}>Pending ({pending.length})</Text>
        {pendingFetching && !pending.length ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : !pending.length ? (
          <StaffEmpty
            icon="calendar-outline"
            title="No pending leave"
            text="Student leave applications will appear here for approval."
          />
        ) : (
          pending.map(renderPendingCard)
        )}

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>History ({history.length})</Text>
        </View>
        <View style={styles.filterRow}>
          {(
            [
              { key: 'all', label: 'All', count: history.length },
              { key: 'approved', label: 'Approved', count: approved.length },
              { key: 'rejected', label: 'Rejected', count: rejected.length },
            ] as const
          ).map((item) => {
            const active = historyFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setHistoryFilter(item.key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {item.label} {item.count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {historyFetching && !historyList.length ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : !historyList.length ? (
          <StaffEmpty
            icon="time-outline"
            title="No leave history"
            text="Approved and rejected applications will show here."
          />
        ) : (
          historyList.map(renderHistoryCard)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 40, flexGrow: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: space.sm,
  },
  historyHeader: {
    marginTop: space.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: space.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  filterTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
    ...shadows.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '800', color: colors.primary, fontSize: 16 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  meta: { color: colors.textMuted, marginTop: 2, fontWeight: '600', fontSize: 12 },
  daysPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  daysText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaRowText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  reason: { flex: 1, fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: 11,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  reject: { backgroundColor: '#FEE2E2' },
  approve: { backgroundColor: colors.primary },
  rejectText: { color: colors.danger, fontWeight: '800' },
  approveText: { color: '#fff', fontWeight: '800' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  approvedBadge: { backgroundColor: '#D1FAE5' },
  rejectedBadge: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: '800' },
  historyMeta: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 8 },
});

export default StaffLeaveApproveScreen;
