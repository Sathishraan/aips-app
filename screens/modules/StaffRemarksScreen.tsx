import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
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
  useSaveRemark,
  useStaffFilterOptions,
  useStudentRemarks,
} from '../../hooks/useStaffErp';
import { staffColors as colors, radii, shadows, space } from '../../theme/appTheme';

const REMARK_FOR = [
  { label: 'Academic', value: 'Academic' },
  { label: 'Behaviour', value: 'Behaviour' },
  { label: 'General', value: 'General' },
];

const StaffRemarksScreen = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'history'>('add');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('all');
  const [studId, setStudId] = useState('');
  const [remarkFor, setRemarkFor] = useState('Academic');
  const [remark, setRemark] = useState('');
  const [actionDesc, setActionDesc] = useState('');

  const { classItems, sectionItems } = useStaffFilterOptions(true);
  const { data: students = [] } = useClassStudents(classId, sectionId);
  const { data: remarks = [], isFetching, refetch } = useStudentRemarks(studId);
  const saveMutation = useSaveRemark();

  const studentItems = useMemo(
    () =>
      students.map((s) => ({
        label: `${s.student_name}${s.admission_no ? ` (${s.admission_no})` : ''}${s.stud_section || s.section ? ` · ${s.stud_section || s.section}` : ''}`,
        value: String(s.stud_no),
      })),
    [students]
  );

  const handleSave = async () => {
    if (!studId || !remark.trim()) {
      Alert.alert('Missing fields', 'Select a student and enter a remark.');
      return;
    }
    try {
      await saveMutation.mutateAsync({
        stud_id: studId,
        behaviour_remarks: remark.trim(),
        remark_for: remarkFor,
        action_desc: actionDesc.trim(),
      });
      setRemark('');
      setActionDesc('');
      setActiveTab('history');
      refetch();
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not save remark');
    }
  };

  return (
    <View style={staffUi.root}>
      <ModuleHeader
        title="Student Remarks"
        subtitle={activeTab === 'history' ? 'Staff entry · remark history' : 'Staff entry · add remark'}
      />

      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'add' && styles.segmentBtnOn]}
            onPress={() => setActiveTab('add')}
          >
            <Text style={[styles.segmentText, activeTab === 'add' && styles.segmentTextOn]}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'history' && styles.segmentBtnOn]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.segmentText, activeTab === 'history' && styles.segmentTextOn]}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Screen scroll keyboard edges={['left', 'right', 'bottom']}>
        <StaffCard title="Student">
          <View style={staffUi.row}>
            <View style={staffUi.rowItem}>
              <StaffLabel required>Class</StaffLabel>
              <CustomDropdown
                value={classId}
                onValueChange={(v) => {
                  setClassId(v);
                  setStudId('');
                }}
                items={classItems}
                placeholder="Class"
              />
            </View>
            <View style={staffUi.rowItem}>
              <StaffLabel>Section</StaffLabel>
              <CustomDropdown
                value={sectionId}
                onValueChange={(v) => {
                  setSectionId(v);
                  setStudId('');
                }}
                items={sectionItems}
                placeholder="All sections"
              />
            </View>
          </View>
          <View style={{ height: space.md }} />
          <StaffLabel required>Student</StaffLabel>
          <CustomDropdown value={studId} onValueChange={setStudId} items={studentItems} placeholder="Student" />
        </StaffCard>

        {activeTab === 'add' ? (
          <StaffCard title="New remark">
            <StaffLabel>Remark for</StaffLabel>
            <CustomDropdown value={remarkFor} onValueChange={setRemarkFor} items={REMARK_FOR} placeholder="Remark for" />
            <TextInput
              style={styles.textarea}
              placeholder="Write the remark"
              placeholderTextColor={colors.textMuted}
              value={remark}
              onChangeText={setRemark}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Action taken (optional)"
              placeholderTextColor={colors.textMuted}
              value={actionDesc}
              onChangeText={setActionDesc}
            />
            <StaffSaveButton
              label="Save remark"
              loading={saveMutation.isPending}
              onPress={handleSave}
              disabled={!studId}
            />
          </StaffCard>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Remark history</Text>
            {!studId ? (
              <StaffEmpty
                icon="chatbox-ellipses-outline"
                title="Select a student"
                text="Choose class, section and student to view remarks."
              />
            ) : isFetching ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
            ) : !remarks.length ? (
              <StaffEmpty
                icon="document-text-outline"
                title="No remarks yet"
                text="Saved remarks for this student will appear here."
              />
            ) : (
              remarks.map((item: any, index: number) => (
                <View key={String(item.id || index)} style={styles.historyCard}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.remark_for || 'Remark'}</Text>
                  </View>
                  <Text style={styles.cardBody}>{item.behaviour_remarks}</Text>
                  {!!item.action_desc && <Text style={styles.meta}>Action: {item.action_desc}</Text>}
                  <Text style={styles.meta}>
                    Staff: {item.remark_by || 'Staff'} · {item.inserted_date || ''}
                  </Text>
                  {!!item.parent_name && (
                    <Text style={styles.meta}>
                      Parent: {item.parent_name}
                      {item.parent_mobile ? ` · ${item.parent_mobile}` : ''}
                    </Text>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </Screen>
    </View>
  );
};

const styles = StyleSheet.create({
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
  textarea: {
    marginTop: space.md,
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: space.md,
    backgroundColor: colors.background,
    color: colors.text,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  input: {
    marginTop: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: space.md,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 15,
  },
  sectionTitle: {
    marginBottom: space.sm,
    fontWeight: '800',
    color: colors.text,
    fontSize: 16,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginBottom: 8,
  },
  badgeText: { fontWeight: '800', color: colors.primary, fontSize: 11 },
  cardBody: { color: colors.text, fontWeight: '600' },
  meta: { color: colors.textMuted, marginTop: 6, fontSize: 12, fontWeight: '600' },
});

export default StaffRemarksScreen;
