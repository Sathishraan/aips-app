import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Animated,
    Dimensions,
    Platform,
    ActivityIndicator,
    RefreshControl,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../components/common/ModuleHeader';
import BackButton from '../components/common/BackButton';
import { useResultList, useResultDetails } from '../hooks/useResult';

const { width, height } = Dimensions.get('window');

export default function ResultScreen() {
    const { data: results = [], isLoading: listLoading, isFetching: listFetching, refetch: refetchList } = useResultList();
    const [selectedExamId, setSelectedExamId] = useState<string | number | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const { data: details = [], isLoading: detailsLoading } = useResultDetails(selectedExamId);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        if (results) {
            console.log('--- ResultScreen Results Raw Data ---');
            console.log(JSON.stringify(results, null, 2));
        }
    }, [results]);

    useEffect(() => {
        if (selectedExamId && details) {
            console.log(`--- ResultScreen Details Raw Data for Exam ID: ${selectedExamId} ---`);
            console.log(JSON.stringify(details, null, 2));
        }
    }, [selectedExamId, details]);

    const handleExamPress = (exam: any) => {
        const examId = exam.exam_id || exam.examId || exam.id;
        if (examId) {
            setSelectedExamId(examId);
            setModalVisible(true);
        } else {
            console.warn('Could not find Exam ID in:', exam);
        }
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedExamId(null);
    };

    const getStatusColor = (status: string) => {
        return status?.toLowerCase() === 'pass' ? '#10b981' : '#ef4444';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ModuleHeader
                title="Academic Results"
                subtitle="📊 Performance Overview"
                actionIcon="refresh-outline"
                onActionPress={() => refetchList()}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={listFetching && !listLoading}
                        onRefresh={refetchList}
                        colors={['#7c3aed']}
                    />
                }
            >
                {listLoading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#7c3aed" />
                        <Text style={styles.loadingText}>Fetching your performance...</Text>
                    </View>
                ) : (
                    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                        {results && Array.isArray(results) && results.length > 0 ? (
                            results.map((result: any, index: number) => {
                                const examId = result.exam_id || result.id || index;
                                const percentage = parseFloat(result.percentage || '0').toFixed(1);
                                const isPass = (result.result_status || '').toLowerCase() === 'pass';

                                return (
                                    <TouchableOpacity
                                        key={examId}
                                        style={styles.resultCard}
                                        activeOpacity={0.9}
                                        onPress={() => handleExamPress(result)}
                                    >
                                        <View style={styles.cardHeader}>
                                            <View>
                                                <Text style={styles.termTitleText}>{result.termName || result.name || 'Examination'}</Text>
                                                <Text style={styles.academicYear}>{result.academic_year}</Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: isPass ? '#dcfce7' : '#fee2e2' }]}>
                                                <Text style={[styles.statusText, { color: isPass ? '#166534' : '#991b1b' }]}>
                                                    {(result.result_status || 'N/A').toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.cardBody}>
                                            <View style={styles.scoreSection}>
                                                <View style={styles.percentageCircle}>
                                                    <Text style={styles.percentageText}>{percentage}%</Text>
                                                    <Text style={styles.gradeLabel}>Grade: {result.overall_grade}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.detailsSection}>
                                                <View style={styles.infoRow}>
                                                    <View style={styles.infoItem}>
                                                        <Icon name="trophy-outline" size={16} color="#5a6898" />
                                                        <Text style={styles.infoLabel}>Rank</Text>
                                                        <Text style={styles.infoValue}>#{result.rank || 'N/A'}</Text>
                                                    </View>
                                                    <View style={styles.infoItem}>
                                                        <Icon name="checkmark-circle-outline" size={16} color="#7c3aed" />
                                                        <Text style={styles.infoLabel}>Passed</Text>
                                                        <Text style={styles.infoValue}>{result.subjects_passed}/{result.total_subjects}</Text>
                                                    </View>
                                                </View>

                                                <View style={styles.scoreBarContainer}>
                                                    <View style={styles.scoreBarLabels}>
                                                        <Text style={styles.scoreLabel}>Total Marks</Text>
                                                        <Text style={styles.scoreValue}>{result.total_marks_obtained} / {result.total_max_marks}</Text>
                                                    </View>
                                                    <View style={styles.scoreBarBg}>
                                                        <View style={[styles.scoreBarFill, { width: (percentage + '%') as any, backgroundColor: getStatusColor(result.result_status) }]} />
                                                    </View>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={styles.cardFooter}>
                                            <Text style={styles.tapPrompt}>Tap for subject-wise details</Text>
                                            <Icon name="arrow-forward" size={16} color="#7c3aed" />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Icon name="document-text-outline" size={80} color="#cbd5e1" />
                                <Text style={styles.emptyText}>No results published yet!</Text>
                                <Text style={styles.emptySubText}>Keep up the hard work, results will appear here soon.</Text>
                            </View>
                        )}
                    </Animated.View>
                )}
            </ScrollView>


            {/* Details Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Subject Details</Text>
                                <Text style={styles.modalSubtitle}>In-depth score breakdown</Text>
                            </View>
                            <TouchableOpacity onPress={closeModal} style={styles.closeButtonContainer}>
                                <Icon name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            {detailsLoading ? (
                                <View style={styles.modalLoader}>
                                    <ActivityIndicator size="large" color="#7c3aed" />
                                    <Text style={styles.loadingText}>Fetching subject data...</Text>
                                </View>
                            ) : details.length > 0 ? (
                                details.map((item: any, idx: number) => {
                                    const subject = item.subjectName || item.subject_name || 'Subject';
                                    const status = item.status || item.result_status || 'N/A';
                                    const isPass = String(status).toLowerCase() === 'pass';
                                    const obtained = Number(
                                        item.marks_obtained ??
                                        item.total_marks ??
                                        item.written_marks ??
                                        0
                                    );
                                    const maxMarks = Number(item.max_marks ?? item.total_mark ?? 100) || 100;
                                    const percentageValue =
                                        parseFloat(String(item.percentage || '0')) ||
                                        (maxMarks > 0 ? (obtained / maxMarks) * 100 : 0);

                                    return (
                                        <View key={idx} style={styles.subjectCard}>
                                            <View style={styles.subjectHeader}>
                                                <View style={styles.subjectTitleContainer}>
                                                    <View style={[styles.subjectIcon, { backgroundColor: isPass ? '#f0fdf4' : '#fef2f2' }]}>
                                                        <Icon name="book-outline" size={20} color={isPass ? '#16a34a' : '#dc2626'} />
                                                    </View>
                                                    <Text style={styles.subjectNameText}>{subject}</Text>
                                                </View>
                                                <View style={[styles.miniBadge, { backgroundColor: isPass ? '#10b98120' : '#ef444420' }]}>
                                                    <Text style={[styles.miniBadgeText, { color: isPass ? '#10b981' : '#ef4444' }]}>{status}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.subjectMarksRow}>
                                                <View style={styles.subjectMarkItem}>
                                                    <Text style={styles.subjectMarkLabel}>Obtained</Text>
                                                    <Text style={styles.subjectMarkValue}>{obtained}</Text>
                                                </View>
                                                <View style={styles.subjectMarkItem}>
                                                    <Text style={styles.subjectMarkLabel}>Total</Text>
                                                    <Text style={styles.subjectMarkValue}>{maxMarks}</Text>
                                                </View>
                                                <View style={styles.subjectMarkItem}>
                                                    <Text style={styles.subjectMarkLabel}>Grade</Text>
                                                    <Text style={styles.subjectMarkValue}>{item.grade || 'N/A'}</Text>
                                                </View>
                                                <View style={styles.subjectMarkItem}>
                                                    <Text style={styles.subjectMarkLabel}>Points</Text>
                                                    <Text style={styles.subjectMarkValue}>{item.points ?? item.grade_point ?? 'N/A'}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.miniScoreBarBg}>
                                                <View style={[styles.miniScoreBarFill, { width: (Math.min(100, percentageValue) + '%') as any, backgroundColor: isPass ? '#10b981' : '#ef4444' }]} />
                                            </View>
                                        </View>
                                    );
                                })
                            ) : (
                                <View style={styles.modalEmpty}>
                                    <Icon name="alert-circle-outline" size={50} color="#cbd5e1" />
                                    <Text style={styles.noDetails}>No subject breakdown found.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    content: { flex: 1 },
    scrollContent: { padding: 20 },
    loaderContainer: { padding: 100, alignItems: 'center' },
    loadingText: { marginTop: 15, color: '#64748b', fontWeight: '500' },

    // Result Card Styling
    resultCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    termTitleText: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
    academicYear: { fontSize: 13, color: '#64748b', marginTop: 2, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

    cardBody: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    scoreSection: {
        width: 100,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: '#f1f5f9',
        paddingRight: 15,
    },
    percentageCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f5f3ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ddd6fe',
    },
    percentageText: { fontSize: 18, fontWeight: '900', color: '#7c3aed' },
    gradeLabel: { fontSize: 10, color: '#7c3aed', fontWeight: '700', marginTop: 2 },

    detailsSection: {
        flex: 1,
        paddingLeft: 20,
        justifyContent: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    infoItem: {
        alignItems: 'center',
    },
    infoLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    infoValue: { fontSize: 14, fontWeight: '800', color: '#1e293b' },

    scoreBarContainer: {
        marginTop: 5,
    },
    scoreBarLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    scoreLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
    scoreValue: { fontSize: 11, color: '#1e293b', fontWeight: '700' },
    scoreBarBg: {
        height: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    scoreBarFill: {
        height: '100%',
        borderRadius: 4,
    },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    tapPrompt: { fontSize: 12, color: '#7c3aed', fontWeight: '700' },

    // Modal Styling
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        height: height * 0.8,
        paddingTop: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginBottom: 25,
    },
    modalTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
    modalSubtitle: { fontSize: 14, color: '#64748b', marginTop: 2, fontWeight: '500' },
    closeButtonContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalScroll: { paddingHorizontal: 25, paddingBottom: 50 },
    modalLoader: { padding: 50, alignItems: 'center' },

    subjectCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    subjectTitleContainer: { flexDirection: 'row', alignItems: 'center' },
    subjectIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    subjectNameText: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
    miniBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    miniBadgeText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },

    subjectMarksRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 14,
        marginBottom: 12,
    },
    subjectMarkItem: { alignItems: 'center' },
    subjectMarkLabel: { fontSize: 9, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
    subjectMarkValue: { fontSize: 14, fontWeight: '800', color: '#1e293b' },

    miniScoreBarBg: { height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' },
    miniScoreBarFill: { height: '100%', borderRadius: 2 },

    modalEmpty: { padding: 50, alignItems: 'center' },
    noDetails: { textAlign: 'center', color: '#94a3b8', marginTop: 15, fontWeight: '600' },

    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
    emptyText: { marginTop: 20, color: '#1e293b', fontWeight: '800', fontSize: 18, textAlign: 'center' },
    emptySubText: { marginTop: 10, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
});
