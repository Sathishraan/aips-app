import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../components/common/ModuleHeader';
import { useHomework, Homework } from '../hooks/useHomework';
import { useNavigation } from '@react-navigation/native';
import { colors, radii, shadows, space } from '../theme/appTheme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (value?: string | null) => {
  if (!value || value === 'N/A') return 'N/A';
  const raw = String(value).trim().split('T')[0].split(' ')[0];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return raw;
  return `${match[3]} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
};

const titleCase = (value?: string) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const splitSubjects = (item: Homework) => {
  const fromArray = Array.isArray(item.subjects)
    ? item.subjects
    : Array.isArray(item.subject_names)
      ? item.subject_names
      : [];
  if (fromArray.length) {
    return fromArray.map((name) => titleCase(String(name))).filter(Boolean);
  }
  const raw = String(item.subject || item.subject_name || '').trim();
  if (!raw) return [];
  return raw
    .split(/[,|]/)
    .map((name) => titleCase(name.trim()))
    .filter(Boolean);
};

export default function HomeworkScreen() {
  const navigation = useNavigation<any>();
  const { data: homeworkList = [], isLoading, isFetching, refetch } = useHomework();

  const cards = useMemo(
    () =>
      homeworkList.map((item, index) => {
        const displayId = String(item.id || item.homework_id || index);
        const subjects = splitSubjects(item);
        const title = item.title || item.homework_title || 'Homework';
        const dueDate = formatDate(
          item.submission_date || item.submit_date || item.dueDate || item.homework_date
        );
        return { displayId, subjects, title, dueDate, item, index };
      }),
    [homeworkList]
  );

  const openDetails = (item: Homework, index: number) => {
    const id = item.id || item.homework_id || index.toString();
    navigation.navigate('HomeworkDetail', {
      homeworkId: id,
      title: item.title || item.homework_title,
      subject: item.subject || item.subject_name,
      issueDate: item.homework_date,
      submitDate: item.submission_date || item.submit_date || item.dueDate,
      description: item.description || item.homework_description,
      status: item.status,
    });
  };

  const renderItem = ({ item }: { item: (typeof cards)[number] }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.85}
      onPress={() => openDetails(item.item, item.index)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, due ${item.dueDate}`}
    >
      <View style={styles.rowIcon}>
        <Icon name="document-text-outline" size={18} color={colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {item.subjects.length > 0 && (
          <View style={styles.chipWrap}>
            {item.subjects.slice(0, 3).map((subject) => (
              <View key={subject} style={styles.chip}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {subject}
                </Text>
              </View>
            ))}
            {item.subjects.length > 3 && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>+{item.subjects.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.rowMeta}>
          <Icon name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText} numberOfLines={1}>
            Due {item.dueDate}
          </Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ModuleHeader
        title="Homework"
        subtitle={`${cards.length} assignment${cards.length === 1 ? '' : 's'}`}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>Loading homework…</Text>
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.displayId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <View style={styles.emptyIcon}>
                <Icon name="document-text-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No homework yet</Text>
              <Text style={styles.muted}>New assignments from teachers will appear here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: space.md,
    paddingBottom: 40,
    flexGrow: 1,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 20,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '70%',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    flexShrink: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  muted: {
    marginTop: space.sm,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
});
