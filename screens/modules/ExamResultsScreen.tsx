import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import BackButton from '../../components/common/BackButton';
import { useExamList } from '../../hooks/useExam';
import { Exam } from '../../types/exams.type';
import { Ionicons as Icon } from '@expo/vector-icons';
import { Platform } from 'react-native';
import ModuleHeader from '../../components/common/ModuleHeader';

const { width, height } = Dimensions.get('window');

const ExamResultsScreen = ({ navigation }: any) => {
  const slideAnim = useRef(new Animated.Value(width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { data: exams, isLoading, isError, refetch, isFetching } = useExamList();

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (exams) {
      console.log('--- ExamResultsScreen Raw Data ---');
      console.log(JSON.stringify(exams, null, 2));
    }
  }, [exams]);

  const allExams = exams ? Object.values(exams).flat() : [];

  const handleExamClick = (exam: any) => {
    setSelectedExam(exam);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedExam(null);
  };

  const getExamStatus = (dateStr: string) => {
    const examDate = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (examDate < now) return 'completed';
    return 'upcoming';
  };

  const renderExamDetail = (label: string, value: string | number | undefined, icon: string) => {
    if (!value) return null;
    return (
      <View style={styles.detailItem}>
        <View style={styles.detailIconContainer}>
          <Icon name={icon as any} size={20} color="#424e79" />
        </View>
        <View>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{value}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#424e79" />
      </View>
    );
  }

  const termNames = exams ? Object.keys(exams) : [];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <ModuleHeader
        title="Exam & Results"
        subtitle="📝 Schedule & Status"
        actionIcon="refresh-outline"
        onActionPress={() => refetch()}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor="#424e79"
          />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {allExams.filter(e => getExamStatus(e.exam_date) === 'upcoming').length}
            </Text>
            <Text style={styles.statLabel}>Upcoming Exams</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {allExams.filter(e => getExamStatus(e.exam_date) === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{allExams.length}</Text>
            <Text style={styles.statLabel}>Total Exams</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exam Schedule</Text>
          <TouchableOpacity onPress={() => refetch()}>
            <Icon name="refresh" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {isError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load exams. Please try again.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {termNames.length > 0 ? (
          termNames.map((termName) => (
            <View key={termName} style={styles.termSection}>
              <View style={styles.termHeader}>
                <Icon name="bookmark" size={18} color="#424e79" />
                <Text style={styles.termTitle}>{termName}</Text>
              </View>
              {exams && exams[termName] && exams[termName].map((exam: any, index: number) => {
                const status = getExamStatus(exam.exam_date);
                return (
                  <Animated.View
                    key={exam.exam_id || `${termName}-${index}`}
                    style={[
                      styles.examCard,
                      {
                        opacity: fadeAnim,
                      }
                    ]}
                  >
                    <View style={styles.examInfo}>
                      <Text style={styles.examSubject}>{exam.subjectName || 'Unknown Subject'}</Text>
                      <View style={styles.examMeta}>
                        <Text style={styles.examDate}>{exam.exam_date}</Text>
                        <Text style={[styles.examStatus, { color: getStatusColor(status) }]}>
                          {status}
                        </Text>
                      </View>
                      <Text style={styles.examAverage}>Total Marks: {exam.total_mark}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => handleExamClick(exam)}
                    >
                      <Text style={styles.viewButtonText}>Details</Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          ))
        ) : (
          !isLoading && <Text style={styles.emptyText}>No exams found.</Text>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Exam Details</Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedExam ? (
                <View style={styles.modalBody}>
                  <View style={styles.examBadge}>
                    <Text style={[styles.examStatusBadge, { color: getStatusColor(getExamStatus(selectedExam.exam_date)) }]}>
                      {getExamStatus(selectedExam.exam_date).toUpperCase()}
                    </Text>
                  </View>

                  <Text style={styles.modalSubject}>
                    {selectedExam.subjectName || selectedExam.subject_name}
                  </Text>

                  <View style={styles.detailsGrid}>
                    {renderExamDetail('Date', selectedExam.exam_date, 'calendar-outline')}
                    {renderExamDetail('Start Time', selectedExam.exam_start, 'time-outline')}
                    {renderExamDetail('End Time', selectedExam.exam_end, 'time-outline')}
                    {renderExamDetail('Class', selectedExam.class_name, 'school-outline')}
                    {renderExamDetail('WaitTime', selectedExam.exam_session, 'hourglass-outline')}
                    {renderExamDetail('Total Marks', selectedExam.total_mark, 'ribbon-outline')}
                    {renderExamDetail('Pass Mark', selectedExam.pass_mark, 'checkmark-circle-outline')}
                    {renderExamDetail('Academic Year', selectedExam.academic_year, 'calendar-number-outline')}
                  </View>

                  {selectedExam.subjectDetails && (
                    <View style={styles.subjectDetailsSection}>
                      <View style={styles.subjectDetailsHeader}>
                        <Text style={styles.subjectDetailsTitle}>Subject-wise details</Text>
                        <Icon name="bar-chart-outline" size={18} color="#424e79" />
                      </View>
                      {selectedExam.subjectDetails.map((subject: any) => (
                        <View key={subject.subject_name} style={styles.subjectDetailRow}>
                          <View style={styles.subjectDetailName}>
                            <Text style={styles.subjectNameText}>{subject.subject_name}</Text>
                            <Text style={styles.subjectStatusText}>{subject.result_status}</Text>
                          </View>
                          <View style={styles.subjectMarks}>
                            <Text style={styles.subjectMarksText}>{subject.marks_obtained}/{subject.total_marks}</Text>
                            <Text style={styles.subjectGradeText}>{subject.grade} · {subject.percentage}%</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedExam.instructions && selectedExam.instructions.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.detailLabel}>Instructions</Text>
                      {(selectedExam.instructions as string[]).map((inst, i) => (
                        <Text key={i} style={styles.listItem}>• {inst}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.emptyText}>No details found.</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeModal}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed': return '#10b981';
    case 'upcoming': return '#3b82f6';
    case 'ongoing': return '#f59e0b';
    case 'cancelled': return '#ef4444';
    default: return '#64748b';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#424e79',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  examCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  examInfo: {
    flex: 1,
  },
  examSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  examMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  examDate: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 10,
  },
  examStatus: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  examAverage: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#424e79',
  },
  viewButtonText: {
    color: '#424e79',
    fontSize: 12,
    fontWeight: '700',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#424e79',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 50,
    fontSize: 16,
    fontWeight: '600',
  },
  termSection: {
    marginBottom: 25,
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#eef0f8',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#eef0f8',
  },
  termTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2d3660',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalBody: {
    paddingBottom: 20,
  },
  examBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  examStatusBadge: {
    fontSize: 12,
    fontWeight: '800',
  },
  modalSubject: {
    fontSize: 24,
    fontWeight: '800',
    color: '#424e79',
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  subjectDetailsSection: {
    marginTop: 8,
    padding: 14,
    backgroundColor: '#eef0f8',
    borderRadius: 15,
  },
  subjectDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subjectDetailsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#424e79',
  },
  subjectDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#d9dced',
  },
  subjectDetailName: {
    flex: 1,
  },
  subjectNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  subjectStatusText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
    marginTop: 2,
  },
  subjectMarks: {
    alignItems: 'flex-end',
  },
  subjectMarksText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  subjectGradeText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  detailItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '700',
  },
  section: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 15,
  },
  listItem: {
    fontSize: 14,
    color: '#475569',
    marginTop: 5,
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#424e79',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#424e79',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ExamResultsScreen;
