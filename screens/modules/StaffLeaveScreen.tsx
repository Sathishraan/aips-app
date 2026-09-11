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
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import CustomDropdown from '../../components/common/CustomDropdown';
import { StaffEmpty, StaffSaveButton, staffUi } from '../../components/staff/StaffUi';
import {
  STAFF_LEAVE_TYPES,
  sectionLabel,
  useApplyStaffLeave,
  useApproveLeave,
  useLeaveHistory,
  usePendingLeaves,
  useStaffLeaveBalance,
  useStaffLeaveList,
} from '../../hooks/useStaffErp';
import { staffColors as colors, radii, shadows, space } from '../../theme/appTheme';

type TabKey = 'apply' | 'mine' | 'students';
type HistoryFilter = 'all' | 'approved' | 'rejected';

const toYmd = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

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

const statusColor = (status?: string) => {
  const value = String(status || '').toLowerCase();
  if (value === 'approved') return { bg: '#D1FAE5', fg: '#047857' };
  if (value === 'rejected') return { bg: '#FEE2E2', fg: '#B91C1C' };
  return { bg: '#FEF3C7', fg: '#B45309' };
};

const StaffLeaveScreen = () => {
  const [tab, setTab] = useState<TabKey>('apply');
  const [leaveType, setLeaveType] = useState('Casual');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

  const { data: myLeaves = [], isFetching: listFetching, refetch: refetchList } = useStaffLeaveList();
  const { data: balance, isFetching: balanceFetching, refetch: refetchBalance } = useStaffLeaveBalance();
  const { data: studentPending = [], isFetching: studentPendingFetching, refetch: refetchStudentPending } = usePendingLeaves();
  const { data: studentHistory = [], isFetching: studentHistoryFetching, refetch: refetchStudentHistory } = useLeaveHistory('all');
  const applyMutation = useApplyStaffLeave();
  const approveStudentMutation = useApproveLeave();

  const leaveTypeItems = STAFF_LEAVE_TYPES.map((item) => ({ label: item, value: item }));
  const availableForType = useMemo(() => {
    if (leaveType === 'Casual') return balance?.casual_available;
    if (leaveType === 'Sick') return balance?.sick_available;
    if (leaveType === 'Earned') return balance?.earned_available;
    return null;
  }, [balance, leaveType]);

  const studentApproved = useMemo(
    () => studentHistory.filter((item: any) => String(item.approved) === '1'),
    [studentHistory]
  );
  const studentRejected = useMemo(
    () => studentHistory.filter((item: any) => String(item.approved) === '2'),
    [studentHistory]
  );
  const studentHistoryList =
    historyFilter === 'approved' ? studentApproved : historyFilter === 'rejected' ? studentRejected : studentHistory;

  const isFetching =
    listFetching || balanceFetching || studentPendingFetching || studentHistoryFetching;

  const handleRefresh = () => {
    refetchList();
    refetchBalance();
    refetchStudentPending();
    refetchStudentHistory();
  };

  const onPickDate = (_event: any, selected?: Date) => {
    const which = picker;
    if (Platform.OS === 'android') setPicker(null);
    if (!selected || !which) return;
    if (which === 'from') {
      setFromDate(selected);
      if (selected > toDate) setToDate(selected);
    } else {
      setToDate(selected < fromDate ? fromDate : selected);
    }
    if (Platform.OS === 'ios') setPicker(null);
  };

  const handleApply = () => {
    if (!reason.trim()) {
      Alert.alert('Reason required', 'Please enter a reason for leave.');
      return;
    }
    applyMutation.mutate(
      {
        leave_type: leaveType,
        leave_from: toYmd(fromDate),
        leave_to: toYmd(toDate),
        leave_reason: reason.trim(),
      },
      {
        onSuccess: () => {
          setReason('');
          setTab('mine');
          Alert.alert('Submitted', 'Your leave application was sent for approval.');
        },
        onError: (error: any) => {
          Alert.alert('Could not apply', error?.message || 'Please try again.');
        },
      }
    );
  };

  const handleStudentAction = (id: string | number, status: 1 | 2) => {
    const label = status === 1 ? 'approve' : 'reject';
    Alert.alert('Confirm', `Do you want to ${label} this student leave?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: status === 1 ? 'Approve' : 'Reject',
        style: status === 1 ? 'default' : 'destructive',
        onPress: () =>
          approveStudentMutation.mutate(
            { id, status },
            { onError: (e: any) => Alert.alert('Failed', e?.message || 'Could not update leave') }
          ),
      },
    ]);
  };

  const renderStaffCard = (leave: any) => {
    const tone = statusColor(leave.leave_status);
    return (
      <View key={String(leave.leave_id || leave.id)} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(leave.emp_name || 'S').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{leave.emp_name || 'Staff'}</Text>
            <Text style={styles.meta}>
              {leave.leave_type || 'Leave'}
              {leave.emp_designation ? ` · ${leave.emp_designation}` : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.statusText, { color: tone.fg }]}>{leave.status_label || leave.leave_status}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Icon name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaRowText}>
            {formatDate(leave.leave_from)} → {formatDate(leave.leave_to)} · {leave.total_days || 1}d
          </Text>
        </View>
        <Text style={styles.reason}>{leave.leave_reason || 'No reason given'}</Text>
      </View>
    );
  };

  const classLine = (leave: any) =>
    [leave.class, sectionLabel(leave.section || '')].filter(Boolean).join(' · ');

  return (
    <View style={staffUi.root}>
      <ModuleHeader title="Leave" subtitle="Staff leave · ERP connected" />
      <View style={styles.tabs}>
        {(
          [
            { key: 'apply', label: 'Apply' },
            { key: 'mine', label: 'My Leave' },
            { key: 'students', label: 'Students' },
          ] as const
        ).map((item) => {
          const active = tab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(item.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {tab === 'apply' && (
          <>
            <View style={styles.balanceRow}>
              {[
                { label: 'Casual', used: balance?.casual_used, total: balance?.casual_leave, left: balance?.casual_available },
                { label: 'Sick', used: balance?.sick_used, total: balance?.sick_leave, left: balance?.sick_available },
                { label: 'Earned', used: balance?.earned_used, total: balance?.earned_leave, left: balance?.earned_available },
              ].map((item) => (
                <View key={item.label} style={styles.balanceCard}>
                  <Text style={styles.balanceLabel}>{item.label}</Text>
                  <Text style={styles.balanceValue}>{item.left ?? '--'}</Text>
                  <Text style={styles.balanceHint}>
                    {item.used ?? 0}/{item.total ?? 0} used
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Leave type</Text>
            <CustomDropdown
              value={leaveType}
              onValueChange={setLeaveType}
              items={leaveTypeItems}
              placeholder="Select leave type"
            />
            {availableForType != null && (
              <Text style={styles.availableHint}>{availableForType} days available</Text>
            )}

            <Text style={styles.fieldLabel}>From date</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setPicker('from')}>
              <Icon name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.dateText}>{formatDate(toYmd(fromDate))}</Text>
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>To date</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setPicker('to')}>
              <Icon name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.dateText}>{formatDate(toYmd(toDate))}</Text>
            </TouchableOpacity>

            {picker && (
              <DateTimePicker
                value={picker === 'from' ? fromDate : toDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onPickDate}
              />
            )}

            <Text style={styles.fieldLabel}>Reason</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Why are you applying for leave?"
              placeholderTextColor={colors.textMuted}
              multiline
              value={reason}
              onChangeText={setReason}
            />

            <StaffSaveButton
              label="Submit leave"
              loading={applyMutation.isPending}
              onPress={handleApply}
            />
          </>
        )}

        {tab === 'mine' && (
          <>
            <Text style={styles.sectionTitle}>My applications ({myLeaves.length})</Text>
            {listFetching && !myLeaves.length ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : !myLeaves.length ? (
              <StaffEmpty
                icon="calendar-outline"
                title="No leave yet"
                text="Apply from the Apply tab. Requests are saved in ERP."
              />
            ) : (
              myLeaves.map((leave: any) => renderStaffCard(leave))
            )}
          </>
        )}

        {tab === 'students' && (
          <>
            <Text style={styles.sectionTitle}>Pending students ({studentPending.length})</Text>
            {studentPendingFetching && !studentPending.length ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : !studentPending.length ? (
              <StaffEmpty
                icon="school-outline"
                title="No pending student leave"
                text="Student leave applications will appear here."
              />
            ) : (
              studentPending.map((leave: any) => (
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
                  <Text style={styles.reason}>{leave.reason || 'No reason given'}</Text>
                  <View style={styles.actions}>
                    <TouchableOpacity style={[styles.btn, styles.reject]} onPress={() => handleStudentAction(leave.id, 2)}>
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, styles.approve]} onPress={() => handleStudentAction(leave.id, 1)}>
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <Text style={[styles.sectionTitle, { marginTop: space.lg }]}>History ({studentHistory.length})</Text>
            <View style={styles.filterRow}>
              {(
                [
                  { key: 'all', label: 'All', count: studentHistory.length },
                  { key: 'approved', label: 'Approved', count: studentApproved.length },
                  { key: 'rejected', label: 'Rejected', count: studentRejected.length },
                ] as const
              ).map((item) => {
                const active = historyFilter === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setHistoryFilter(item.key)}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {item.label} {item.count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {studentHistoryList.map((leave: any) => {
              const approved = String(leave.approved) === '1';
              return (
                <View key={String(leave.id)} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{(leave.student_name || 'S').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{leave.student_name || 'Student'}</Text>
                      <Text style={styles.meta}>{formatDate(leave.fromDate)} → {formatDate(leave.toDate)}</Text>
                    </View>
                    <View style={[styles.statusBadge, approved ? styles.approvedBadge : styles.rejectedBadge]}>
                      <Text style={[styles.statusText, { color: approved ? '#047857' : '#B91C1C' }]}>
                        {approved ? 'Approved' : 'Rejected'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reason}>{leave.reason || 'No reason given'}</Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    marginHorizontal: space.md,
    marginTop: space.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.lg,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radii.md },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  tabTextActive: { color: '#fff' },
  content: { padding: space.md, paddingBottom: 40, flexGrow: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: space.sm,
  },
  balanceRow: { flexDirection: 'row', gap: 8, marginBottom: space.md },
  balanceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: space.sm,
    ...shadows.card,
  },
  balanceLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  balanceValue: { fontSize: 20, fontWeight: '800', color: colors.primary, marginTop: 2 },
  balanceHint: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginTop: space.md,
    marginBottom: 8,
  },
  availableHint: { marginTop: 6, color: colors.primary, fontWeight: '700', fontSize: 12 },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: { fontSize: 15, fontWeight: '700', color: colors.text },
  reasonInput: {
    minHeight: 90,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 14,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontWeight: '600',
    marginBottom: space.lg,
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  metaRowText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  reason: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginTop: 8 },
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
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.full },
  approvedBadge: { backgroundColor: '#D1FAE5' },
  rejectedBadge: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 11, fontWeight: '800' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: space.md },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  filterTextActive: { color: '#fff' },
});

export default StaffLeaveScreen;
