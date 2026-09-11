import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import CustomDropdown from '../../components/common/CustomDropdown';
import {
  StaffCard,
  StaffEmpty,
  StaffLabel,
  staffUi,
} from '../../components/staff/StaffUi';
import {
  AttendanceHistoryDay,
  localDateYmd,
  useAttendanceHistory,
  useStaffFilterOptions,
} from '../../hooks/useStaffErp';
import { staffColors as colors, radii, shadows, space } from '../../theme/appTheme';

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

const StaffAttendanceScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialClass = String(route.params?.classId || '');
  const initialSection = String(route.params?.sectionId || 'all');

  const [classId, setClassId] = React.useState(initialClass);
  const [sectionId, setSectionId] = React.useState(initialSection || 'all');

  React.useEffect(() => {
    if (route.params?.classId) setClassId(String(route.params.classId));
    if (route.params?.sectionId) setSectionId(String(route.params.sectionId));
  }, [route.params?.classId, route.params?.sectionId, route.params?.saved]);

  const { classItems, sectionItems } = useStaffFilterOptions(true);
  const { data, isFetching, refetch } = useAttendanceHistory(classId, sectionId);
  const days = data?.days || [];
  const today = data?.today || localDateYmd();
  const todayEntry = days.find((d) => d.date === today);

  const openMark = (date: string, mode: 'mark' | 'edit' | 'view') => {
    if ((mode === 'mark' || mode === 'edit') && !classId) {
      Alert.alert('Select class', 'Choose a class before marking or editing attendance.');
      return;
    }
    navigation.navigate('StaffAttendanceMark', {
      classId,
      sectionId,
      date,
      mode,
    });
  };

  const renderDay = (item: AttendanceHistoryDay) => {
    const isToday = item.date === today || item.is_today;
    const canEdit = isToday && item.can_edit !== false;

    return (
      <View key={item.date} style={[styles.dayCard, isToday && styles.dayCardToday]}>
        <View style={styles.dayTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.dateRow}>
              <Text style={styles.dateTitle}>{displayDate(item.date)}</Text>
              {isToday ? (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>Today</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.totalText}>{item.total} students marked</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: '#10B981' }]}>{item.present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: '#EF4444' }]}>{item.absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: '#8B5CF6' }]}>{item.late}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: '#F59E0B' }]}>{item.on_duty}</Text>
            <Text style={styles.statLabel}>OD</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => openMark(item.date, 'view')}
            activeOpacity={0.85}
          >
            <Icon name="eye-outline" size={16} color={colors.primary} />
            <Text style={styles.viewText}>View</Text>
          </TouchableOpacity>
          {canEdit ? (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => openMark(item.date, 'edit')}
              activeOpacity={0.85}
            >
              <Icon name="create-outline" size={16} color="#fff" />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.lockedBtn}>
              <Icon name="lock-closed-outline" size={14} color={colors.textMuted} />
              <Text style={styles.lockedText}>No edit</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={staffUi.root}>
      <ModuleHeader title="Attendance" subtitle="Staff entry · date-wise history" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        <StaffCard title="Class">
          <View style={staffUi.row}>
            <View style={staffUi.rowItem}>
              <StaffLabel required>Class</StaffLabel>
              <CustomDropdown value={classId} onValueChange={setClassId} items={classItems} placeholder="Class" />
            </View>
            <View style={staffUi.rowItem}>
              <StaffLabel>Section</StaffLabel>
              <CustomDropdown
                value={sectionId}
                onValueChange={setSectionId}
                items={sectionItems}
                placeholder="All sections"
              />
            </View>
          </View>
        </StaffCard>

        {classId ? (
          <TouchableOpacity
            style={styles.markToday}
            onPress={() => openMark(today, todayEntry ? 'edit' : 'mark')}
            activeOpacity={0.85}
          >
            <Icon name={todayEntry ? 'create-outline' : 'add-circle-outline'} size={20} color="#fff" />
            <Text style={styles.markTodayText}>
              {todayEntry ? "Edit today's attendance" : "Mark today's attendance"}
            </Text>
          </TouchableOpacity>
        ) : null}

        {isFetching && !days.length ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : !days.length ? (
          <StaffEmpty
            icon="clipboard-outline"
            title="No history yet"
            text="Mark today's attendance to start the date-wise list."
          />
        ) : (
          days.map(renderDay)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  content: { padding: space.md, paddingBottom: 40 },
  markToday: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: space.md,
  },
  markTodayText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  dayCardToday: {
    borderColor: colors.primaryBorder,
    backgroundColor: '#f7f8fd',
  },
  dayTop: { flexDirection: 'row', alignItems: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  dateTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  todayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  todayBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  totalText: { marginTop: 4, color: colors.textMuted, fontWeight: '600', fontSize: 12 },
  stats: { flexDirection: 'row', marginTop: 12, gap: 8 },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  viewBtn: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
  },
  viewText: { color: colors.primary, fontWeight: '800' },
  editBtn: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
  },
  editText: { color: '#fff', fontWeight: '800' },
  lockedBtn: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedText: { color: colors.textMuted, fontWeight: '800', fontSize: 12 },
});

export default StaffAttendanceScreen;
