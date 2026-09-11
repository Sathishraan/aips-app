import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import ModuleHeader from '../../components/common/ModuleHeader';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import {
  getMonthById,
  getHighlightEvents,
  EVENT_TYPE_META,
  CalendarEventType,
  SchoolCalendarEvent,
} from '../../data/schoolCalendar';
import { colors, radii, shadows, space } from '../../theme/appTheme';

const FILTERS: Array<{ key: 'all' | CalendarEventType; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'event', label: 'Events' },
  { key: 'exam', label: 'Exams' },
  { key: 'ptm', label: 'PTM' },
  { key: 'holiday', label: 'Holidays' },
  { key: 'value', label: 'Value' },
];

const formatDay = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit' });
};

const formatMonthShort = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { month: 'short' });
};

export default function SchoolCalendarMonthScreen() {
  const route = useRoute<any>();
  const monthId = route.params?.monthId as string;
  const month = getMonthById(monthId);
  const { horizontalPadding, contentMaxWidth, scale } = useResponsiveLayout();
  const [filter, setFilter] = useState<'all' | CalendarEventType>('all');

  const events = useMemo(() => {
    if (!month) return [] as SchoolCalendarEvent[];
    const base = getHighlightEvents(month);
    if (filter === 'all') return base;
    return base.filter((e) => e.type === filter);
  }, [month, filter]);

  if (!month) {
    return (
      <View style={styles.container}>
        <ModuleHeader title="Month" subtitle="Not found" />
        <View style={styles.empty}>
          <Icon name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Month not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ModuleHeader
        title={`${month.month} ${month.year}`}
        subtitle={month.theme || 'Monthly planner'}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: space.md,
          paddingBottom: space.xxl,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: contentMaxWidth }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setFilter(f.key)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {events.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="calendar-outline" size={52} color="#cbd5e1" />
              <Text style={styles.emptyText}>No events in this filter</Text>
            </View>
          ) : (
            events.map((item, index) => {
              const meta = EVENT_TYPE_META[item.type] || EVENT_TYPE_META.event;
              return (
                <View key={`${item.date}-${index}`} style={styles.eventCard}>
                  <View style={[styles.dateBox, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.dateDay, { color: meta.color, fontSize: scale(18) }]}>
                      {formatDay(item.date)}
                    </Text>
                    <Text style={[styles.dateMon, { color: meta.color }]}>
                      {formatMonthShort(item.date)}
                    </Text>
                  </View>
                  <View style={styles.eventBody}>
                    <View style={styles.eventTop}>
                      <View style={[styles.typeChip, { backgroundColor: meta.bg }]}>
                        <Icon name={meta.icon as any} size={12} color={meta.color} />
                        <Text style={[styles.typeText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                      <Text style={styles.weekday}>{item.day}</Text>
                    </View>
                    <Text style={[styles.eventTitle, { fontSize: scale(15) }]}>
                      {item.title}
                    </Text>
                  </View>
                </View>
              );
            })
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
  filters: {
    gap: 8,
    paddingBottom: space.md,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 10,
    overflow: 'hidden',
    ...shadows.card,
  },
  dateBox: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  dateDay: {
    fontWeight: '800',
  },
  dateMon: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  eventBody: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 10,
    minWidth: 0,
  },
  eventTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  weekday: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  eventTitle: {
    color: colors.text,
    fontWeight: '700',
    lineHeight: 21,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
