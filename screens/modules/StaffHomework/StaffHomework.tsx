import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../../components/common/ModuleHeader';
import CustomDropdown from '../../../components/common/CustomDropdown';
import { useHomeworkForm, useCreateHomework, useStaffHomeworkList, useSubjectList } from '../../../hooks/useStaffHomework';
import { canonicalizeSection, localDateYmd, sectionLabel, useStaffFilterOptions } from '../../../hooks/useStaffErp';
import {
  AVAILABLE_SUBJECTS,
  CLASSES,
  SubjectType,
} from '../../../types/staffHomework.type';
import { materializeHomeworkFile } from '../../../utils/homeworkImage';
import SubjectHomeworkCard from './SubjectHomeworkCard';
import SuccessModal from './SuccessModal';
import AttachFileSheet from './AttachFileSheet';
import { staffColors as colors, radii, shadows, space } from '../../../theme/appTheme';

const ensureFileName = (fileName: string | null | undefined, mime: string) => {
  const raw = fileName || `homework-${Date.now()}`;
  if (/\.[a-z0-9]+$/i.test(raw)) return raw;
  const ext = mime.includes('pdf')
    ? 'pdf'
    : mime.includes('png')
      ? 'png'
      : mime.includes('gif')
        ? 'gif'
        : mime.includes('webp')
          ? 'webp'
          : mime.includes('heic')
            ? 'heic'
            : mime.includes('heif')
              ? 'heif'
              : mime.includes('bmp')
                ? 'bmp'
                : 'jpg';
  return `${raw}.${ext}`;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseYmd = (value?: string) => {
  const raw = String(value || '').trim().split('T')[0].split(' ')[0];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const fallback = raw ? new Date(raw) : new Date();
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Select date';
  const date = parseYmd(dateString);
  if (Number.isNaN(date.getTime())) return String(dateString);
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const fallbackSectionItems = ['A', 'B'].map((sec) => ({ label: sectionLabel(sec), value: sec }));

const StaffHomework: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'create'>('home');

  const {
    formData,
    subjectHomework,
    updateField,
    toggleSubject,
    updateSubjectDescription,
    addSubjectImages,
    removeSubjectImage,
    toggleSubmissionMethod,
    resetForm,
    validateForm,
  } = useHomeworkForm();

  const createHomeworkMutation = useCreateHomework();
  const { data: homeworkList, isLoading: isLoadingList, refetch } = useStaffHomeworkList();
  const { data: apiSubjects, isLoading: isLoadingSubjects } = useSubjectList();

  const { classItems, sectionItems } = useStaffFilterOptions(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [attachSubject, setAttachSubject] = useState<SubjectType | null>(null);

  const availableSubjects =
    apiSubjects && apiSubjects.length > 0 ? (apiSubjects as SubjectType[]) : AVAILABLE_SUBJECTS;

  const filteredSubjects = availableSubjects.filter((subject: SubjectType) =>
    String(subject || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event?.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    setShowDatePicker(false);
    if (selectedDate && !Number.isNaN(selectedDate.getTime())) {
      updateField('submissionDate', localDateYmd(selectedDate));
    }
  };

  const attachRemaining = attachSubject
    ? 5 - (subjectHomework[attachSubject]?.images?.length || 0)
    : 0;

  const handleFilePick = (subject: SubjectType) => {
    setShowDatePicker(false);
    const remaining = 5 - (subjectHomework[subject]?.images?.length || 0);
    if (remaining <= 0) return;
    setAttachSubject(subject);
  };

  const closeAttachSheet = () => setAttachSubject(null);

  const handleAttachChoice = (kind: 'image' | 'pdf') => {
    if (!attachSubject) return;
    const subject = attachSubject;
    const remaining = 5 - (subjectHomework[subject]?.images?.length || 0);
    setAttachSubject(null);
    setTimeout(() => {
      if (kind === 'image') pickFromPhotos(subject, remaining);
      else pickFromFiles(subject, remaining);
    }, 250);
  };

  const attachPickedFiles = async (
    subject: SubjectType,
    assets: Array<{ uri?: string; name?: string | null; fileName?: string | null; mimeType?: string | null; size?: number | null; fileSize?: number | null }>
  ) => {
    const picked = [];
    for (const asset of assets) {
      const uri = String(asset.uri || '');
      if (!uri) continue;
      const mime = String(asset.mimeType || '');
      const name = ensureFileName(asset.name || asset.fileName || `homework-${Date.now()}`, mime);
      if (/\.(php|phtml|exe|js|bat|cmd|sh)$/i.test(name)) continue;
      const copied = await materializeHomeworkFile({
        uri,
        name,
        type: mime,
        size: typeof asset.size === 'number' ? asset.size : (typeof asset.fileSize === 'number' ? asset.fileSize : 0),
      });
      if (copied) picked.push(copied);
    }

    if (!picked.length) {
      Alert.alert('File error', 'Could not read that file. Try Photos, another image, or a PDF.');
      return;
    }

    if (picked.some((file) => file.size > 10 * 1024 * 1024)) {
      Alert.alert('File Size Error', 'Some files exceed the 10MB limit');
      return;
    }

    addSubjectImages(subject, picked);
  };

  const pickFromPhotos = async (subject: SubjectType, remaining: number) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo access to attach images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: remaining > 1,
        selectionLimit: remaining,
        quality: 1,
        exif: false,
        allowsEditing: false,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode?.Current,
      });

      if (result.canceled || !result.assets?.length) return;
      await attachPickedFiles(subject, result.assets.slice(0, remaining));
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to pick photos');
    }
  };

  const pickFromFiles = async (subject: SubjectType, remaining: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: remaining > 1,
      });

      if (result.canceled || !result.assets?.length) return;
      await attachPickedFiles(subject, result.assets.slice(0, remaining));
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to pick files');
    }
  };

  const handleSubmit = async () => {
    const { isValid, errors } = validateForm();
    if (!isValid) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    setShowDatePicker(false);

    try {
      await createHomeworkMutation.mutateAsync({
        formData: {
          title: formData.title,
          submissionDate: formData.submissionDate,
          class: formData.class,
          section: formData.section,
          subjects: formData.subjects,
          submissionMethods: formData.submissionMethods,
          homeworkData: subjectHomework,
          status: '1',
        },
        subjectHomeworkData: subjectHomework,
      });

      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        resetForm();
        setActiveTab('home');
        refetch();
      }, 1800);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create homework');
    }
  };

  const renderHomeworkItem = ({ item }: { item: any }) => {
    const status = String(item.status || '').toLowerCase();
    const sent = ['1', 'sent', 'published', 'active'].includes(status);
    const subjects: string[] = Array.isArray(item.subjects)
      ? item.subjects
      : item.subject_name
        ? [item.subject_name]
        : [];

    return (
      <View style={styles.listCard}>
        <View style={styles.listCardTop}>
          <Text style={styles.listTitle} numberOfLines={2}>
            {item.title || 'Untitled homework'}
          </Text>
          <View style={[styles.badge, sent ? styles.badgeSent : styles.badgeDraft]}>
            <Text style={[styles.badgeText, sent ? styles.badgeSentText : styles.badgeDraftText]}>
              {sent ? 'Sent' : 'Draft'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Icon name="school-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>
            {item.class_id || item.class || '—'} ·{' '}
            {item.section_id || item.section ? sectionLabel(item.section_id || item.section) : '—'}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>Due {formatDate(item.submission_date || item.submissionDate)}</Text>
        </View>

        {subjects.length > 0 && (
          <View style={styles.chipWrap}>
            {subjects.slice(0, 4).map((subject, index) => (
              <View key={`${subject}-${index}`} style={styles.miniChip}>
                <Text style={styles.miniChipText}>{subject}</Text>
              </View>
            ))}
            {subjects.length > 4 && (
              <View style={styles.miniChip}>
                <Text style={styles.miniChipText}>+{subjects.length - 4}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderHomeTab = () => {
    if (isLoadingList) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>Loading homework…</Text>
        </View>
      );
    }

    if (!homeworkList?.length) {
      return (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <Icon name="document-text-outline" size={36} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No homework yet</Text>
          <Text style={styles.emptyText}>Create an assignment for a class and section.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setActiveTab('create')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Create homework</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={homeworkList}
        renderItem={renderHomeworkItem}
        keyExtractor={(item, index) => String(item.homework_id || item.id || index)}
        contentContainerStyle={styles.listPad}
        showsVerticalScrollIndicator={false}
        refreshing={isLoadingList}
        onRefresh={refetch}
      />
    );
  };

  const methods: Array<{ key: 'whatsapp' | 'email' | 'mobileApp'; label: string; hint: string; icon: keyof typeof Icon.glyphMap }> = [
    { key: 'whatsapp', label: 'WhatsApp', hint: 'Parent message', icon: 'logo-whatsapp' },
    { key: 'email', label: 'Email', hint: 'Email notice', icon: 'mail-outline' },
    { key: 'mobileApp', label: 'Mobile app', hint: 'In-app list', icon: 'phone-portrait-outline' },
  ];

  const renderCreateTab = () => (
    <ScrollView
      style={styles.flex}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.formPad}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Details</Text>
        <Text style={styles.label}>
          Title <Text style={styles.req}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Chapter 5 exercise"
          placeholderTextColor={colors.textMuted}
          value={formData.title}
          onChangeText={(text) => updateField('title', text)}
        />

        <Text style={[styles.label, { marginTop: space.md }]}>
          Due date <Text style={styles.req}>*</Text>
        </Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
          <Icon name="calendar-outline" size={18} color={colors.primary} />
          <Text style={formData.submissionDate ? styles.dateValue : styles.placeholder}>
            {formatDate(formData.submissionDate)}
          </Text>
        </TouchableOpacity>
        {showDatePicker ? (
          <DateTimePicker
            value={parseYmd(formData.submissionDate)}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={startOfToday()}
          />
        ) : null}

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <Text style={styles.label}>
              Class <Text style={styles.req}>*</Text>
            </Text>
            <CustomDropdown
              value={formData.class}
              onValueChange={(value) => updateField('class', value)}
              items={classItems.length ? classItems : CLASSES.map((cls) => ({ label: cls, value: cls }))}
              placeholder="Class"
            />
          </View>
          <View style={styles.rowItem}>
            <Text style={styles.label}>
              Section <Text style={styles.req}>*</Text>
            </Text>
            <CustomDropdown
              value={formData.section}
              onValueChange={(value) => updateField('section', canonicalizeSection(value) || value)}
              items={sectionItems.length ? sectionItems : fallbackSectionItems}
              placeholder="Section"
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>Subjects</Text>
          {formData.subjects.length > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{formData.subjects.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.searchBox}>
          <Icon name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subjects"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.chipWrap}>
          {isLoadingSubjects ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject: SubjectType) => {
              const selected = formData.subjects.includes(subject);
              return (
                <TouchableOpacity
                  key={subject}
                  style={[styles.chip, selected && styles.chipOn]}
                  onPress={() => toggleSubject(subject)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextOn]}>{subject}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.muted}>No subjects found</Text>
          )}
        </View>
      </View>

      {formData.subjects.map((subject) => (
        <SubjectHomeworkCard
          key={subject}
          subject={subject}
          description={subjectHomework[subject]?.description || ''}
          images={subjectHomework[subject]?.images || []}
          onDescriptionChange={(text) => updateSubjectDescription(subject, text)}
          onImagePick={() => handleFilePick(subject)}
          onImageRemove={(index) => removeSubjectImage(subject, index)}
          onRemove={() => toggleSubject(subject)}
        />
      ))}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notify via</Text>
        {methods.map((method) => {
          const on = formData.submissionMethods[method.key];
          return (
            <TouchableOpacity
              key={method.key}
              style={[styles.methodRow, on && styles.methodRowOn]}
              onPress={() => toggleSubmissionMethod(method.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.check, on && styles.checkOn]}>
                {on && <Icon name="checkmark" size={14} color="#fff" />}
              </View>
              <View style={styles.flex}>
                <Text style={styles.methodLabel}>{method.label}</Text>
                <Text style={styles.methodHint}>{method.hint}</Text>
              </View>
              <Icon name={method.icon} size={20} color={on ? colors.primary : colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, createHomeworkMutation.isPending && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={createHomeworkMutation.isPending}
        activeOpacity={0.85}
      >
        {createHomeworkMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Send homework</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.ghostBtn}
        onPress={resetForm}
        disabled={createHomeworkMutation.isPending}
      >
        <Text style={styles.ghostBtnText}>Reset form</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.root}>
      <ModuleHeader
        title="Homework"
        subtitle={activeTab === 'home' ? 'Staff entry · assigned work' : 'Staff entry · create assignment'}
      />

      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'home' && styles.segmentBtnOn]}
            onPress={() => setActiveTab('home')}
          >
            <Text style={[styles.segmentText, activeTab === 'home' && styles.segmentTextOn]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'create' && styles.segmentBtnOn]}
            onPress={() => setActiveTab('create')}
          >
            <Text style={[styles.segmentText, activeTab === 'create' && styles.segmentTextOn]}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'home' ? renderHomeTab() : renderCreateTab()}

      <SuccessModal visible={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
      <AttachFileSheet
        visible={!!attachSubject}
        remaining={attachRemaining}
        onClose={closeAttachSheet}
        onChoose={handleAttachChoice}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  segmentWrap: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.full,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radii.full,
  },
  segmentBtnOn: {
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  segmentTextOn: { color: colors.primary },
  listPad: { paddingHorizontal: space.md, paddingBottom: 32 },
  formPad: { paddingHorizontal: space.md, paddingBottom: 40 },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
    ...shadows.card,
  },
  listCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  listTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  badgeSent: { backgroundColor: '#DCFCE7' },
  badgeDraft: { backgroundColor: '#FEF3C7' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  badgeSentText: { color: '#166534' },
  badgeDraftText: { color: '#92400E' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  miniChip: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  miniChipText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyText: {
    marginTop: 6,
    marginBottom: space.lg,
    textAlign: 'center',
    color: colors.textMuted,
    fontWeight: '600',
  },
  muted: { color: colors.textMuted, fontWeight: '600', marginTop: 10 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.md,
    ...shadows.card,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: space.sm },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: space.sm,
  },
  countPill: {
    backgroundColor: colors.primary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countPillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  req: { color: colors.danger },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  placeholder: { fontSize: 15, color: colors.textMuted },
  row: { flexDirection: 'row', gap: 12, marginTop: space.md },
  rowItem: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    marginBottom: space.sm,
    backgroundColor: colors.background,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: colors.text },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  chipTextOn: { color: '#fff' },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  methodRowOn: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  methodHint: { fontSize: 12, color: colors.textMuted, marginTop: 1, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  ghostBtn: { alignItems: 'center', paddingVertical: 14 },
  ghostBtnText: { color: colors.textMuted, fontWeight: '700' },
});

export default StaffHomework;
