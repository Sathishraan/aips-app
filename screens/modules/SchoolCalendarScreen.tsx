import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ModuleHeader from '../../components/common/ModuleHeader';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import {
  SCHOOL_CALENDAR,
  getHighlightEvents,
} from '../../data/schoolCalendar';
import { colors, radii, shadows, space } from '../../theme/appTheme';

const MONTH_COLORS = [
  '#424e79',
  '#2563EB',
  '#059669',
  '#7C3AED',
  '#DB2777',
  '#0891B2',
  '#D97706',
  '#4F46E5',
  '#16A34A',
  '#E11D48',
  '#0D9488',
];

export default function SchoolCalendarScreen() {
  const navigation = useNavigation<any>();
  const { horizontalPadding, contentMaxWidth, isTablet, scale, listColumns, gap } =
    useResponsiveLayout();

  const months = useMemo(() => SCHOOL_CALENDAR, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ModuleHeader
        title="School Calendar"
        subtitle="Academic Year 2026 – 2027"
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
        <View style={{ width: '100%', maxWidth: contentMaxWidth }}>
          <Text style={[styles.intro, { fontSize: scale(13) }]}>
            Tap a month to view holidays, exams, PTMs and special events.
          </Text>

          <View
            style={[
              styles.grid,
              {
                flexDirection: listColumns > 1 ? 'row' : 'column',
                flexWrap: 'wrap',
                gap,
              },
            ]}
          >
            {months.map((month, index) => {
              const highlights = getHighlightEvents(month);
              const accent = MONTH_COLORS[index % MONTH_COLORS.length];
              const cardWidth =
                listColumns > 1
                  ? ({ flexGrow: 1, flexBasis: '47%', maxWidth: '48.5%' } as const)
                  : ({ width: '100%' } as const);

              return (
                <TouchableOpacity
                  key={month.id}
                  activeOpacity={0.88}
                  style={[styles.card, cardWidth]}
                  onPress={() =>
                    navigation.navigate('SchoolCalendarMonth', {
                      monthId: month.id,
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${month.month} ${month.year}`}
                >
                  <View style={[styles.accentBar, { backgroundColor: accent }]} />
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <View
                        style={[
                          styles.monthBadge,
                          { backgroundColor: `${accent}18` },
                        ]}
                      >
                        <Icon name="calendar-outline" size={18} color={accent} />
                      </View>
                      <View style={styles.monthTitles}>
                        <Text style={[styles.monthName, { fontSize: scale(18) }]}>
                          {month.month}
                        </Text>
                        <Text style={styles.monthYear}>{month.year}</Text>
                      </View>
                      <Icon name="chevron-forward" size={18} color={colors.textMuted} />
                    </View>

                    {!!month.theme && (
                      <Text style={styles.theme} numberOfLines={2}>
                        {month.theme}
                      </Text>
                    )}

                    <View style={styles.footer}>
                      <View style={[styles.countChip, { backgroundColor: `${accent}14` }]}>
                        <Text style={[styles.countText, { color: accent }]}>
                          {highlights.length} event{highlights.length === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <Text style={styles.viewText}>View</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  scrollContent: {
    paddingTop: space.md,
    paddingBottom: space.xxl,
  },
  intro: {
    color: colors.textSecondary,
    marginBottom: space.md,
    lineHeight: 20,
  },
  grid: {
    width: '100%',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: 'row',
    ...shadows.card,
  },
  accentBar: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    padding: space.md,
    minWidth: 0,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitles: {
    flex: 1,
    minWidth: 0,
  },
  monthName: {
    fontWeight: '800',
    color: colors.text,
  },
  monthYear: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  theme: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
  },
  viewText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
