import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import BackButton from '../../components/common/BackButton';
import { useAttendanceReport, useAttendanceDetails, useLateComers } from '../../hooks/useAttendance';
import { AttendanceAction, AttendanceDetail } from '../../types/attendance.type';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors, radii, shadows, space, touch } from '../../theme/appTheme';

const STATUS_META: Record<
  AttendanceAction,
  { label: string; color: string; icon: keyof typeof Icon.glyphMap }
> = {
  Present: { label: 'Present', color: '#10B981', icon: 'checkmark-circle' },
  Absent: { label: 'Absent', color: '#EF4444', icon: 'close-circle' },
  'On Duty': { label: 'On Duty', color: '#F59E0B', icon: 'briefcase' },
  'Later Comers': { label: 'Late', color: '#8B5CF6', icon: 'time' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const parseYmd = (value?: string) => {
  const raw = String(value || '').trim().split('T')[0].split(' ')[0];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
  };
};

const formatLongDate = (value?: string) => {
  const parts = parseYmd(value);
  if (!parts) return value || '';
  return `${String(parts.day).padStart(2, '0')} ${MONTHS_LONG[parts.month]} ${parts.year}`;
};

const formatShortDate = (value?: string) => {
  const parts = parseYmd(value);
  if (!parts) return value || '';
  return `${String(parts.day).padStart(2, '0')} ${MONTHS[parts.month]}`;
};

const parentMessage = (item: AttendanceDetail | any, fallbackLabel: string) => {
  const text = String(item?.message || '').trim();
  if (text) return text;
  const name = String(item?.student_name || 'Your child').trim() || 'Your child';
  const reason = String(item?.reason || '').trim();
  const status = String(item?.action || item?.status || fallbackLabel);
  if (reason) return `${name} is ${status}. Reason: ${reason}`;
  return `${name} is marked ${status}.`;
};

const ParentAlertCard = ({
  item,
  status,
}: {
  item: AttendanceDetail | any;
  status: AttendanceAction;
}) => {
  const meta = STATUS_META[status] || STATUS_META.Absent;

  return (
    <View style={[styles.alertCard, { borderLeftColor: meta.color }]}>
      <View style={[styles.alertIcon, { backgroundColor: `${meta.color}18` }]}>
        <Icon name={meta.icon} size={18} color={meta.color} />
      </View>
      <View style={styles.alertBody}>
        <View style={styles.alertHeader}>
          <Text style={[styles.alertStatus, { color: meta.color }]} numberOfLines={1}>
            {meta.label}
          </Text>
          <Text style={styles.alertDate} numberOfLines={1}>
            {formatShortDate(item.date)}
          </Text>
        </View>
        <Text style={styles.alertMessage} numberOfLines={2}>
          {parentMessage(item, meta.label)}
        </Text>
        <Text style={styles.alertHint} numberOfLines={1}>
          Parent notified
        </Text>
      </View>
    </View>
  );
};

const AttendanceScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedStatus, setSelectedStatus] = useState<AttendanceAction | null>(null);
  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useAttendanceReport();
  const { data: lateComers = [] } = useLateComers({});
  const { horizontalPadding, contentMaxWidth, isTablet, scale, gap } = useResponsiveLayout();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStatusPress = (status: AttendanceAction) => {
    setSelectedStatus((prev) => (prev === status ? null : status));
  };

  const calculatePercentage = (present: string, total: string) => {
    const p = parseInt(present, 10) || 0;
    const t = parseInt(total, 10) || 1;
    return Math.round((p / t) * 100);
  };

  if (isSummaryLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading attendance data...</Text>
      </View>
    );
  }

  if (summaryError || !summary) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={60} color={colors.danger} />
        <Text style={styles.errorText}>Failed to load attendance report</Text>
        <BackButton />
      </View>
    );
  }

  const attendancePercentage = calculatePercentage(summary.present_days, summary.total_working_days);
  const statusCards: { status: AttendanceAction; value: string }[] = [
    { status: 'Present', value: summary.present_days },
    { status: 'Absent', value: summary.absent_days },
    { status: 'On Duty', value: summary.on_duty_days },
    { status: 'Later Comers', value: String(summary.late_days || lateComers.length || '0') },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <ModuleHeader
        title="Attendance"
        subtitle={`${attendancePercentage}% Present`}
        actionIcon="notifications-outline"
        onActionPress={() => navigation.navigate('Notifications')}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            alignItems: isTablet ? 'center' : 'stretch',
          },
        ]}
      >
        <Animated.View
          style={{
            width: '100%',
            maxWidth: contentMaxWidth,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroAccent}>
              <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.heroIcon}>
                <Icon name="calendar" size={26} color="#fff" />
              </LinearGradient>
            </View>
            <View style={styles.heroBody}>
              <Text style={styles.heroEyebrow} numberOfLines={1} adjustsFontSizeToFit>
                Overall
              </Text>
              <Text style={[styles.heroTitle, { fontSize: scale(22) }]} numberOfLines={1}>
                {attendancePercentage}% Present
              </Text>
              <View style={styles.heroFooter}>
                <View style={styles.totalChip}>
                  <Icon name="calendar-outline" size={14} color={colors.primary} />
                  <Text style={styles.totalChipText} numberOfLines={1} adjustsFontSizeToFit>
                    {summary.total_working_days} days
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.ringWrap}>
              <View style={styles.ring}>
                <Text style={styles.ringValue}>{attendancePercentage}</Text>
                <Text style={styles.ringLabel}>%</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Status</Text>
          {[statusCards.slice(0, 2), statusCards.slice(2, 4)].map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.cardRow, { gap, marginBottom: gap }]}>
              {row.map(({ status, value }) => {
                const meta = STATUS_META[status];
                const selected = selectedStatus === status;

                return (
                  <TouchableOpacity
                    key={status}
                    style={[styles.statusCard, selected && { borderColor: meta.color }]}
                    onPress={() => handleStatusPress(status)}
                    activeOpacity={0.9}
                    accessibilityRole="button"
                    accessibilityLabel={`${meta.label}: ${value} days`}
                  >
                    <View style={[styles.statusIcon, { backgroundColor: meta.color }]}>
                      <Icon name={meta.icon} size={18} color="#fff" />
                    </View>
                    <Text
                      style={[styles.statusValue, { color: meta.color }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {value}
                    </Text>
                    <Text
                      style={styles.statusLabel}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {selectedStatus && <AttendanceDetailsList status={selectedStatus} />}

          {!selectedStatus && (summary.alerts?.length || lateComers.length) > 0 && (
            <View style={styles.historyBlock}>
              <Text style={styles.sectionLabel}>Recent alerts</Text>
              {(summary.alerts?.length
                ? summary.alerts.slice(0, 5)
                : lateComers.slice(0, 5).map((item, index) => ({
                    id: `${item.stud_no}-${item.date}-${index}`,
                    student_name: item.student_name,
                    Class: item.class,
                    section: item.section,
                    action: item.action,
                    status: item.status || item.action,
                    date: item.date,
                    stud_no: item.stud_no,
                    reason: item.reason,
                    message: item.message,
                  }))
              ).map((item, index) => {
                const status: AttendanceAction = /absent/i.test(String(item.action || item.status))
                  ? 'Absent'
                  : 'Later Comers';
                return (
                  <ParentAlertCard
                    key={`${item.id || item.date}-${index}`}
                    item={item}
                    status={status}
                  />
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const AttendanceDetailsList = ({ status }: { status: AttendanceAction }) => {
  const { data: details, isLoading, error } = useAttendanceDetails(status);
  const fade = useRef(new Animated.Value(0)).current;
  const meta = STATUS_META[status];
  const showsParentNote = status === 'Absent' || status === 'Later Comers';

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [status]);

  if (isLoading) {
    return (
      <View style={styles.detailsLoader}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.detailsLoaderText}>Loading {meta.label} days...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.detailsError}>
        <Text style={styles.errorText}>Failed to load details</Text>
      </View>
    );
  }

  if (!details || details.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Icon name="happy-outline" size={40} color={colors.textMuted} />
        <Text style={styles.emptyText}>No {meta.label} days recorded</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.historyBlock, { opacity: fade }]}>
      <Text style={styles.sectionLabel}>{meta.label} history</Text>
      {details.map((item, index) =>
        showsParentNote ? (
          <ParentAlertCard key={item.id || `${item.date}-${index}`} item={item} status={status} />
        ) : (
          <View key={item.id || `${item.date}-${index}`} style={styles.historyCard}>
            <View style={[styles.dateCard, { backgroundColor: `${meta.color}18` }]}>
              <Text style={[styles.dateDay, { color: meta.color }]}>
                {parseYmd(item.date)?.day ?? '--'}
              </Text>
              <Text style={[styles.dateMonth, { color: meta.color }]}>
                {parseYmd(item.date) ? MONTHS[parseYmd(item.date)!.month] : ''}
              </Text>
            </View>
            <View style={styles.historyBody}>
              <Text style={styles.historyTitle} numberOfLines={1}>
                {item.student_name || meta.label}
              </Text>
              <Text style={styles.historyMeta} numberOfLines={1}>
                {meta.label}
                {item.Class ? ` · ${item.Class} ${item.section || ''}` : ''}
              </Text>
              <Text style={styles.historyDate}>{formatLongDate(item.date)}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: meta.color }]}>
              <Icon name={meta.icon} size={12} color="#fff" />
            </View>
          </View>
        )
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: space.lg,
    paddingBottom: space.xl,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  loadingText: {
    marginTop: space.md,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.lg,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: touch.min * 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: space.lg,
    ...shadows.card,
  },
  heroAccent: {
    padding: space.md,
    justifyContent: 'flex-start',
    backgroundColor: colors.primarySoft,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBody: {
    flex: 1,
    paddingVertical: space.md,
    minWidth: 0,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  heroTitle: {
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  heroFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: space.sm,
  },
  totalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  totalChipText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  ringWrap: {
    justifyContent: 'center',
    paddingRight: space.md,
  },
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  ringLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginBottom: space.sm,
    letterSpacing: 0.2,
  },
  cardRow: {
    flexDirection: 'row',
  },
  statusCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.sm,
    minHeight: 108,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
    textAlign: 'center',
    width: '100%',
  },
  statusLabel: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    width: '100%',
  },
  historyBlock: {
    marginBottom: space.md,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    marginBottom: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: touch.min,
    ...shadows.card,
  },
  historyBody: {
    flex: 1,
    paddingVertical: space.md,
    paddingRight: space.md,
    minWidth: 0,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginBottom: space.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 4,
    ...shadows.card,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBody: {
    flex: 1,
    minWidth: 0,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  alertStatus: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  alertDate: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  alertMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  alertHint: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  dateCard: {
    width: 56,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '900',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: space.md,
  },
  detailsLoader: {
    padding: space.xl,
    alignItems: 'center',
  },
  detailsLoaderText: {
    marginTop: space.sm,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    padding: space.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  emptyText: {
    marginTop: space.sm,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  detailsError: {
    padding: space.lg,
    alignItems: 'center',
  },
});

export default AttendanceScreen;
