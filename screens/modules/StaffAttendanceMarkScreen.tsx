import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import Screen from '../../components/common/Screen';
import {
  StaffEmpty,
  StaffSaveButton,
  staffUi,
} from '../../components/staff/StaffUi';
import {
  localDateYmd,
  useAttendanceDay,
  useClassStudents,
  useMarkAttendance,
} from '../../hooks/useStaffErp';
import { staffColors as colors, radii, space } from '../../theme/appTheme';

const STATUSES = [
  { value: 'Present', label: 'Present', icon: 'checkmark-circle' as const, color: '#10B981' },
  { value: 'Absent', label: 'Absent', icon: 'close-circle' as const, color: '#EF4444' },
  { value: 'Later Comers', label: 'Late', icon: 'time' as const, color: '#8B5CF6' },
  { value: 'On Duty', label: 'OD', icon: 'briefcase' as const, color: '#F59E0B' },
];

const displayDate = (ymd: string) => {
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const StaffAttendanceMarkScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const classId = String(route.params?.classId || '');
  const sectionId = String(route.params?.sectionId || 'all');
  const requestedDate = String(route.params?.date || localDateYmd());
  const requestedMode = String(route.params?.mode || 'mark') as 'mark' | 'edit' | 'view';

  const today = localDateYmd();
  const isToday = requestedDate === today;
  const canEdit = isToday && requestedMode !== 'view';
  const date = requestedDate;

  const { data: students = [], isFetching: loadingStudents } = useClassStudents(classId, sectionId);
  const { data: dayData, isFetching: loadingDay } = useAttendanceDay(date, classId, sectionId);
  const saveMutation = useMarkAttendance();
  const existingRows = dayData?.rows || [];
  const [marks, setMarks] = useState<Record<string, string>>({});

  const roster = canEdit || requestedMode === 'mark'
    ? students
    : existingRows.map((row: any) => ({
        stud_no: row.stud_no,
        student_name: row.student_name,
        admission_no: row.admission_no,
        stud_class: row.class,
        stud_section: row.section,
      }));

  const rosterKey = `${date}|${roster.map((s: any) => String(s.stud_no)).join('|')}|${existingRows
    .map((r: any) => `${r.stud_no}:${r.status}`)
    .join('|')}`;

  useEffect(() => {
    setMarks((prev) => {
      const next: Record<string, string> = {};
      const existingMap: Record<string, string> = {};
      existingRows.forEach((row: any) => {
        existingMap[String(row.stud_no)] = row.status || row.action || 'Present';
      });
      roster.forEach((s: any) => {
        const id = String(s.stud_no);
        next[id] = existingMap[id] || prev[id] || 'Present';
      });
      const nextIds = Object.keys(next);
      const prevIds = Object.keys(prev);
      if (prevIds.length !== nextIds.length) return next;
      for (const id of nextIds) {
        if (prev[id] !== next[id] && existingMap[id]) return next;
        if (!(id in prev)) return next;
      }
      return Object.keys(existingMap).length ? next : prevIds.length ? prev : next;
    });
  }, [rosterKey]);

  const handleSave = async () => {
    if (!isToday) {
      Alert.alert('Not allowed', 'Only today\'s attendance can be edited.');
      return;
    }
    if (!classId) {
      Alert.alert('Select class', 'Please choose a class first.');
      return;
    }
    if (!roster.length) {
      Alert.alert('No students', 'No students found for this class and section.');
      return;
    }
    try {
      await saveMutation.mutateAsync({
        date: today,
        notify: true,
        students: roster.map((s: any) => ({
          stud_no: s.stud_no as string,
          status: marks[String(s.stud_no)] || 'Present',
          name: s.student_name,
          class: String(s.stud_class || s.class || classId),
          section: String(s.stud_section || s.section || (sectionId === 'all' ? '' : sectionId)),
        })),
      });
      navigation.navigate('StaffAttendance', {
        classId,
        sectionId,
        saved: Date.now(),
      });
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not save attendance');
    }
  };

  const presentCount = roster.filter((s: any) => (marks[String(s.stud_no)] || 'Present') === 'Present').length;
  const loading = loadingStudents || loadingDay;
  const title = canEdit ? (requestedMode === 'edit' ? 'Edit attendance' : 'Mark attendance') : 'Attendance';
  const subtitle = `${isToday ? 'Today' : displayDate(date)}${canEdit ? ' · editable' : ' · view only'}`;

  return (
    <View style={staffUi.root}>
      <ModuleHeader title={title} subtitle={subtitle} />
      <Screen scroll edges={['left', 'right', 'bottom']}>
        <View style={styles.banner}>
          <Icon name={canEdit ? 'create-outline' : 'lock-closed-outline'} size={18} color={colors.primary} />
          <Text style={styles.bannerText}>
            {canEdit
              ? 'You can change today\'s attendance, then save.'
              : 'Past dates are locked. Only today can be edited.'}
          </Text>
        </View>

        {roster.length > 0 && (
          <Text style={styles.countText}>
            {presentCount}/{roster.length} present
          </Text>
        )}

        {loading && !roster.length ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : !roster.length ? (
          <StaffEmpty
            icon="person-remove-outline"
            title="No students"
            text={canEdit ? 'No students found for this class and section.' : 'No attendance was saved on this date.'}
          />
        ) : (
          roster.map((student: any) => {
            const id = String(student.stud_no);
            return (
              <View key={id} style={styles.studentCard}>
                <View style={styles.studentTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(student.student_name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{student.student_name}</Text>
                    <Text style={styles.meta}>
                      {student.admission_no || id}
                      {student.stud_section || student.section ? ` · ${student.stud_section || student.section}` : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusRow}>
                  {STATUSES.map((status) => {
                    const active = marks[id] === status.value;
                    return (
                      <TouchableOpacity
                        key={status.value}
                        style={[styles.chip, active && { backgroundColor: status.color, borderColor: status.color }]}
                        onPress={() => canEdit && setMarks((prev) => ({ ...prev, [id]: status.value }))}
                        activeOpacity={canEdit ? 0.8 : 1}
                        disabled={!canEdit}
                      >
                        <Icon
                          name={status.icon}
                          size={14}
                          color={active ? '#fff' : status.color}
                        />
                        <Text style={[styles.chipText, active && styles.chipTextOn]}>{status.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })
        )}

        {canEdit ? (
          <StaffSaveButton
            label="Save attendance"
            loading={saveMutation.isPending}
            onPress={handleSave}
            disabled={!roster.length}
          />
        ) : null}
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    padding: space.md,
    marginBottom: space.md,
  },
  bannerText: { flex: 1, color: colors.primary, fontWeight: '700', fontSize: 13 },
  countText: { fontWeight: '800', color: colors.primary, fontSize: 13, marginBottom: space.sm },
  studentCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  studentTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '800', color: colors.primary, fontSize: 16 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  meta: { color: colors.textMuted, marginTop: 2, fontWeight: '600', fontSize: 12 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  chipTextOn: { color: '#fff' },
});

export default StaffAttendanceMarkScreen;
