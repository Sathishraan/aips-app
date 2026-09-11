import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ModuleHeader from '../../components/common/ModuleHeader';
import Screen from '../../components/common/Screen';
import CustomDropdown from '../../components/common/CustomDropdown';
import {
  StaffCard,
  StaffEmpty,
  StaffLabel,
  StaffSaveButton,
  staffUi,
} from '../../components/staff/StaffUi';
import {
  useClassStudents,
  useExamMarks,
  useExamSubjects,
  useExamTerms,
  useSaveExamMarks,
  useStaffFilterOptions,
} from '../../hooks/useStaffErp';
import { staffColors as colors, radii, space } from '../../theme/appTheme';

const StaffMarkEntryScreen = () => {
  const navigation = useNavigation<any>();
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('all');
  const [termId, setTermId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [marks, setMarks] = useState<Record<string, string>>({});

  const { classItems, sectionItems } = useStaffFilterOptions(true);
  const { data: terms = [] } = useExamTerms();
  const { data: subjects = [] } = useExamSubjects(classId);
  const { data: students = [], isFetching } = useClassStudents(classId, sectionId);
  const { data: existing = [] } = useExamMarks({
    class: classId,
    section: sectionId,
    term_id: termId,
    subject_id: subjectId,
  });
  const saveMutation = useSaveExamMarks();

  const rosterKey = students.map((s) => String(s.stud_no)).join('|');
  const existingKey = existing
    .map((row: any) => `${row.student_id}:${row.written_marks ?? row.total_marks ?? ''}`)
    .join('|');

  useEffect(() => {
    setMarks((prev) => {
      const next: Record<string, string> = {};
      students.forEach((s) => {
        const id = String(s.stud_no);
        const found = existing.find((row: any) => String(row.student_id) === id);
        next[id] = found ? String(found.written_marks ?? found.total_marks ?? '') : prev[id] || '';
      });
      const nextIds = Object.keys(next);
      const prevIds = Object.keys(prev);
      if (prevIds.length !== nextIds.length) return next;
      for (const id of nextIds) {
        if (prev[id] !== next[id]) return next;
      }
      return prev;
    });
  }, [rosterKey, existingKey]);

  const termItems = useMemo(
    () =>
      terms.map((t: any) => ({
        label: t.terms_name || t.term_name || `Term ${t.terms_id}`,
        value: String(t.terms_id || t.term_id || t.id),
      })),
    [terms]
  );
  const subjectItems = useMemo(
    () =>
      subjects.map((s: any) => ({
        label: s.subject_name || s.name,
        value: String(s.subject_id || s.id),
      })),
    [subjects]
  );

  const handleSave = async () => {
    if (!classId || !termId || !subjectId) {
      Alert.alert('Missing fields', 'Select class, term and subject.');
      return;
    }
    try {
      await saveMutation.mutateAsync({
        class: classId,
        section: sectionId,
        term_id: termId,
        subject_id: subjectId,
        students: students.map((s) => ({
          student_id: s.stud_no as string,
          written_marks: Number(marks[String(s.stud_no)] || 0),
          student_name: s.student_name,
        })),
      });
      Alert.alert('Saved', 'Exam marks saved. Students can see subject marks in Result.', [
        {
          text: 'OK',
          onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('HomeMain');
            }
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not save marks');
    }
  };

  const ready = !!(classId && termId && subjectId);

  return (
    <View style={staffUi.root}>
      <ModuleHeader title="Mark Entry" subtitle="Staff entry · exam marks" />
      <Screen scroll keyboard edges={['left', 'right', 'bottom']}>
        <StaffCard title="Exam details">
          <View style={staffUi.row}>
            <View style={staffUi.rowItem}>
              <StaffLabel required>Class</StaffLabel>
              <CustomDropdown
                value={classId}
                onValueChange={(v) => {
                  setClassId(v);
                  setSubjectId('');
                }}
                items={classItems}
                placeholder="Class"
              />
            </View>
            <View style={staffUi.rowItem}>
              <StaffLabel>Section</StaffLabel>
              <CustomDropdown value={sectionId} onValueChange={setSectionId} items={sectionItems} placeholder="All sections" />
            </View>
          </View>
          <View style={{ height: space.md }} />
          <StaffLabel required>Term / Exam</StaffLabel>
          <CustomDropdown value={termId} onValueChange={setTermId} items={termItems} placeholder="Term / Exam" />
          <View style={{ height: space.md }} />
          <StaffLabel required>Subject</StaffLabel>
          <CustomDropdown value={subjectId} onValueChange={setSubjectId} items={subjectItems} placeholder="Subject" />
        </StaffCard>

        {isFetching ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : !ready ? (
          <StaffEmpty
            icon="create-outline"
            title="Complete the filters"
            text="Select class, term and subject to enter marks."
          />
        ) : !students.length ? (
          <StaffEmpty
            icon="person-remove-outline"
            title="No students"
            text="No students found for this class and section."
          />
        ) : (
          students.map((student) => {
            const id = String(student.stud_no);
            return (
              <View key={id} style={styles.studentCard}>
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(student.student_name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{student.student_name}</Text>
                    <Text style={styles.meta}>{student.admission_no || id}</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    value={marks[id] || ''}
                    onChangeText={(v) => setMarks((prev) => ({ ...prev, [id]: v.replace(/[^0-9.]/g, '') }))}
                  />
                </View>
              </View>
            );
          })
        )}

        <StaffSaveButton
          label="Save marks"
          loading={saveMutation.isPending}
          onPress={handleSave}
          disabled={!ready || !students.length}
        />
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
  studentCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  input: {
    width: 72,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontWeight: '800',
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.background,
  },
});

export default StaffMarkEntryScreen;
