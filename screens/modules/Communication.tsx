import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
    SafeAreaView,
    Alert,
    KeyboardAvoidingView,
    Modal,
    FlatList,
    Image
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '../../components/common/BackButton';
import { useUser, isAdmin, isEmployee, isPrincipal } from '../../hooks/useUser';
import { useRoleColors } from '../../hooks/useRoleColors';
import { useMetadata, useStudents, useEmployees, useSendCommunication } from '../../hooks/useStudentData';
import { useChatCache, ChatCacheItem } from '../../hooks/useChatCache';

// Helper to safely extract keys/labels
const extractId = (item: any) => item?.emp_id || item?.employee_id || item?.id || item?.class_id || item?.section_id || item?.student_id?.toString() || item?.stud_no?.toString() || item?.class_name || item?.section_name;
const extractName = (item: any) => {
    const fromParts = `${item?.stud_firstname || ''} ${item?.stud_lastname || ''}`.trim();
    return fromParts || item?.student_name || item?.staff_name || item?.emp_name || item?.name || item?.class_name || item?.section_name || 'Unknown';
};
const extractStaffName = (item: any) =>
    item?.staff_name || item?.emp_name || item?.name || 'Staff';

// Reusable Modal Picker for Class/Section/Student
const SelectionModal = ({ visible, onClose, title, data, onSelect, searchable, searchValue, onSearchChange, loading, renderItem, emptyText }: any) => {
    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    {searchable && (
                        <View style={styles.modalSearchWrapper}>
                            <Icon name="search" size={20} color="#64748b" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder="Search here..."
                                value={searchValue}
                                onChangeText={onSearchChange}
                                autoCorrect={false}
                            />
                        </View>
                    )}

                    {loading ? (
                        null
                    ) : (!data || data.length === 0) ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>{emptyText || "No options available"}</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={data}
                            keyExtractor={(item, index) => extractId(item) || index.toString()}
                            renderItem={({ item }) => {
                                if (renderItem) return renderItem(item, () => { onSelect(item); onClose(); });
                                return (
                                    <TouchableOpacity
                                        style={styles.optionItem}
                                        onPress={() => { onSelect(item); onClose(); }}
                                    >
                                        <Text style={styles.optionText}>{extractName(item)}</Text>
                                        <Icon name="chevron-forward" size={18} color="#cbd5e1" />
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const NewCommunicationScreen = ({ navigation }: any) => {
    const { user } = useUser();
    const brand = useRoleColors();
    const isPrincipalUser = isPrincipal(user);
    const isStaff = isAdmin(user) || isEmployee(user) || isPrincipalUser;
    const userId = (user as any)?.studentId || (user as any)?.employeeId || (user as any)?.adminId;
    const { addChat } = useChatCache(userId);

    // Toggle between Individual vs Group vs Broadcast (for Principal)
    const [communicationType, setCommunicationType] = useState<'individual' | 'group' | 'broadcast'>('individual');
    const [individualAudience, setIndividualAudience] = useState<'student' | 'staff'>('student');

    // Input States
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);

    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [selectedSection, setSelectedSection] = useState<any>(null);
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [staffSearchQuery, setStaffSearchQuery] = useState('');

    // Modals visibility
    const [showClassModal, setShowClassModal] = useState(false);
    const [showSectionModal, setShowSectionModal] = useState(false);
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);

    // Clear selections when switching tabs
    useEffect(() => {
        setSelectedStudent(null);
        setSelectedStaff(null);
        setSelectedClass(null);
        setSelectedSection(null);
        setStudentSearchQuery('');
        setStaffSearchQuery('');
        setInitialMessage('');
        setIndividualAudience('student');
    }, [communicationType]);

    // Data Hooks
    const { data: metadata } = useMetadata();
    const classes = metadata?.classes || [];
    const sections = metadata?.sections || [];

    const classIdFilter = selectedClass ? extractId(selectedClass) : null;
    const sectionIdFilter = selectedSection ? extractId(selectedSection) : null;

    console.log('UI Filter State:', { classIdFilter, sectionIdFilter });

    const { data: searchedStudents, isLoading: isSearching, error: studentsError } = useStudents(
        classIdFilter,
        sectionIdFilter
    );
    const { data: employees, isLoading: isLoadingStaff } = useEmployees(isStaff);

    // Local filter for fast search within fetched students
    const filteredStudents = useMemo(() => {
        if (!searchedStudents) return [];
        if (!studentSearchQuery.trim()) return searchedStudents;

        const query = studentSearchQuery.toLowerCase().trim();
        return searchedStudents.filter((student: any) => {
            const fullName = extractName(student).toLowerCase();
            const rollNo = (student.stud_no || '').toString().toLowerCase();
            return fullName.includes(query) || rollNo.includes(query);
        });
    }, [searchedStudents, studentSearchQuery]);

    const myEmpId = String((user as any)?.employeeId || (user as any)?.emp_id || '').trim();
    const filteredStaff = useMemo(() => {
        const list = (employees || []).filter((emp: any) => {
            const empId = String(emp?.emp_id || emp?.employee_id || emp?.id || '').trim();
            return empId && empId !== myEmpId;
        });
        if (!staffSearchQuery.trim()) return list;
        const query = staffSearchQuery.toLowerCase().trim();
        return list.filter((emp: any) => {
            const name = extractStaffName(emp).toLowerCase();
            const code = `${emp.emp_no || ''} ${emp.employee_work_id || ''} ${emp.emp_designation || ''}`.toLowerCase();
            return name.includes(query) || code.includes(query);
        });
    }, [employees, staffSearchQuery, myEmpId]);


    const [initialMessage, setInitialMessage] = useState('');
    const sendCommunication = useSendCommunication();

    const handleCreate = async () => {
        console.log('🚀 [Communication] handleCreate started. User Role:', isStaff ? 'Staff' : 'Student');
        if (!isStaff) {
            // Logic for students contacting school support
            try {
                const receiverId = '23';
                const clientId = Math.random().toString(36).substring(7);
                console.log('📬 [Communication] Student sending support message to receiverId:', receiverId);
                await sendCommunication.mutateAsync({
                    message: initialMessage,
                    receiverId: receiverId,
                    type: 'individual',
                    clientId: clientId,
                    sender_name: `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || undefined,
                });
                console.log('✅ [Communication] Student support message sent successfully');

                await addChat({
                    id: receiverId,
                    name: 'School Support',
                    lastMessage: initialMessage,
                    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                    type: 'individual',
                    data: {
                        receiverId,
                        emp_id: receiverId,
                        staff_name: 'School Support',
                        isStaff: true,
                        type: 'individual',
                        cacheChatId: receiverId,
                    }
                });

                navigation.navigate('Chat', {
                    recipient: 'staff',
                    chatId: receiverId,
                    data: {
                        receiverId,
                        emp_id: receiverId,
                        staff_name: 'School Support',
                        isStaff: true,
                        type: 'individual',
                        cacheChatId: receiverId,
                    }
                });
            } catch (error) {
                console.error('Failed to start student chat:', error);
                Alert.alert('Error', 'Could not send message. Please try again.');
            }
            return;
        }

        if (!initialMessage.trim()) {
            Alert.alert('Message Required', 'Please enter a message to start the conversation.');
            return;
        }

        console.log('--- ATTEMPTING START CHAT ---', {
            type: communicationType,
            student: selectedStudent,
            class: selectedClass,
            section: selectedSection
        });

        try {
            if (communicationType === 'broadcast') {
                const clientId = Math.random().toString(36).substring(7);
                await sendCommunication.mutateAsync({
                    message: initialMessage,
                    type: 'group',
                    class_id: 'all',
                    section_id: 'all',
                    receiverId: 'all',
                    isBroadcast: true,
                    clientId: clientId
                });

                await addChat({
                    id: 'broadcast_all_school',
                    name: '📢 School-Wide Principal Broadcast',
                    lastMessage: initialMessage,
                    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                    type: 'group',
                    data: {
                        classId: 'all',
                        className: 'Entire School',
                        sectionId: 'all',
                        sectionName: 'All Chat IDs',
                        type: 'group',
                        isBroadcast: true
                    }
                });

                navigation.navigate('Chat', {
                    recipient: 'group',
                    data: {
                        classId: 'all',
                        className: 'Entire School',
                        sectionId: 'all',
                        sectionName: 'All Chat IDs',
                        type: 'group',
                        isBroadcast: true,
                    }
                });
                return;
            }

            if (communicationType === 'individual') {
                const myStaffName = `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim();

                if (individualAudience === 'staff') {
                    if (!selectedStaff) {
                        Alert.alert('Selection Required', 'Please select a staff member.');
                        return;
                    }
                    const staffId = (
                        selectedStaff.emp_id ||
                        selectedStaff.employee_id ||
                        selectedStaff.id ||
                        selectedStaff.emp_no ||
                        selectedStaff.employee_work_id
                    )?.toString();
                    if (!staffId) {
                        Alert.alert('Error', 'Selected staff has no valid identifier.');
                        return;
                    }
                    if (myEmpId && staffId === myEmpId) {
                        Alert.alert('Invalid recipient', 'You cannot message yourself.');
                        return;
                    }

                    const staffName = extractStaffName(selectedStaff);
                    const clientId = Math.random().toString(36).substring(7);
                    const payload: any = {
                        message: initialMessage,
                        receiverId: staffId,
                        emp_id: staffId,
                        type: 'individual',
                        clientId,
                        sender_name: myStaffName || undefined,
                        receiver_name: staffName,
                        receiver_role: 'staff',
                        isStaffChat: true,
                    };

                    console.log('📬 [Communication] Staff-to-staff payload:', JSON.stringify(payload, null, 2));
                    await sendCommunication.mutateAsync(payload);

                    await addChat({
                        id: staffId,
                        name: staffName,
                        lastMessage: initialMessage,
                        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                        type: 'individual',
                        data: {
                            emp_id: staffId,
                            receiverId: staffId,
                            staff_name: staffName,
                            emp_designation: selectedStaff.emp_designation,
                            emp_department: selectedStaff.emp_department,
                            type: 'individual',
                            cacheChatId: staffId,
                            isStaff: true,
                            peerRole: 'staff',
                        }
                    });

                    navigation.navigate('Chat', {
                        recipient: 'staff',
                        chatId: staffId,
                        chatTitle: staffName,
                        data: {
                            emp_id: staffId,
                            receiverId: staffId,
                            staff_name: staffName,
                            emp_designation: selectedStaff.emp_designation,
                            emp_department: selectedStaff.emp_department,
                            type: 'individual',
                            cacheChatId: staffId,
                            isStaff: true,
                            peerRole: 'staff',
                        }
                    });
                    return;
                }

                if (!selectedStudent) {
                    Alert.alert('Selection Required', 'Please select a student.');
                    return;
                }

                // 🚨 CRITICAL: Use the database primary key (stud_id/emp_id) for E2EE and socket rooms
                // Do NOT use stud_no (roll number) as it doesn't match the registration ID
                const targetReceiverId = selectedStudent.stud_id ||
                    selectedStudent.employee_id ||
                    selectedStudent.student_id ||
                    selectedStudent.emp_id ||
                    selectedStudent.id;

                if (!targetReceiverId) {
                    console.warn('⚠️ [Communication] No primary ID found, falling back to stud_no:', selectedStudent.stud_no);
                }

                const receiverIdStr = (targetReceiverId || selectedStudent.stud_no || '').toString();
                const studentNoStr = (selectedStudent.stud_no || selectedStudent.admission_no || '').toString();

                if (!receiverIdStr) {
                    Alert.alert('Error', 'Selected student has no valid identifier.');
                    return;
                }

                const clientId = Math.random().toString(36).substring(7);
                const payload: any = {
                    message: initialMessage,
                    receiverId: receiverIdStr,
                    stud_id: receiverIdStr,
                    stud_no: studentNoStr || undefined,
                    type: 'individual',
                    clientId: clientId,
                    sender_name: myStaffName || undefined,
                    receiver_name: extractName(selectedStudent),
                };

                // Only add chatId if it's not null/undefined
                if (selectedStudent.chatId) {
                    payload.chatId = selectedStudent.chatId;
                }

                console.log('📬 [Communication] Sending NEW Chat Payload:', JSON.stringify(payload, null, 2));

                await sendCommunication.mutateAsync(payload);
                console.log('✅ [Communication] Staff individual message sent successfully');

                const targetName = extractName(selectedStudent);

                await addChat({
                    id: receiverIdStr,
                    name: targetName,
                    lastMessage: initialMessage,
                    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                    type: 'individual',
                    data: {
                        stud_id: receiverIdStr,
                        stud_no: studentNoStr || selectedStudent.stud_no,
                        receiverId: receiverIdStr,
                        student_name: targetName,
                        stud_firstname: selectedStudent.stud_firstname,
                        stud_lastname: selectedStudent.stud_lastname,
                        stud_class: selectedStudent.stud_class || selectedStudent.class,
                        stud_section: selectedStudent.stud_section || selectedStudent.section,
                        type: 'individual',
                        cacheChatId: receiverIdStr,
                        isStaff: false,
                    }
                });

                navigation.navigate('Chat', {
                    recipient: 'student',
                    chatId: receiverIdStr,
                    chatTitle: targetName,
                    data: {
                        stud_id: receiverIdStr,
                        stud_no: studentNoStr || selectedStudent.stud_no,
                        receiverId: receiverIdStr,
                        student_name: targetName,
                        stud_firstname: selectedStudent.stud_firstname,
                        stud_lastname: selectedStudent.stud_lastname,
                        stud_class: selectedStudent.stud_class || selectedStudent.class,
                        stud_section: selectedStudent.stud_section || selectedStudent.section,
                        type: 'individual',
                        cacheChatId: receiverIdStr,
                        isStaff: false,
                    }
                });
            } else {
                if (!selectedClass) {
                    Alert.alert('Selection Required', 'Please select a class.');
                    return;
                }

                const clientId = Math.random().toString(36).substring(7);
                await sendCommunication.mutateAsync({
                    message: initialMessage,
                    type: 'group',
                    class_id: extractId(selectedClass),
                    section_id: selectedSection ? extractId(selectedSection) : undefined,
                    clientId: clientId
                });

                const groupCacheId = `group_${extractId(selectedClass)}_${selectedSection ? extractId(selectedSection) : 'all'}`;

                // Save to cache
                await addChat({
                    id: groupCacheId,
                    name: `${extractName(selectedClass)}${selectedSection ? ` - ${extractName(selectedSection)}` : ''}`,
                    lastMessage: initialMessage,
                    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                    type: 'group',
                    data: {
                        classId: extractId(selectedClass),
                        className: extractName(selectedClass),
                        sectionId: selectedSection ? extractId(selectedSection) : null,
                        sectionName: selectedSection ? extractName(selectedSection) : 'All Sections',
                        type: 'group',
                        cacheChatId: groupCacheId,
                    }
                });

                navigation.navigate('Chat', {
                    recipient: 'group',
                    chatId: groupCacheId,
                    data: {
                        classId: extractId(selectedClass),
                        className: extractName(selectedClass),
                        sectionId: selectedSection ? extractId(selectedSection) : null,
                        sectionName: selectedSection ? extractName(selectedSection) : 'All Sections',
                        type: 'group',
                        cacheChatId: groupCacheId,
                    }
                });
            }
        } catch (error) {
            console.error('Failed to start chat:', error);
            Alert.alert('Error', 'Failed to start conversation. Please try again.');
        }
    };

    const individualMissing = isStaff && communicationType === 'individual' && (
        individualAudience === 'staff' ? !selectedStaff : !selectedStudent
    );
    const groupMissing = communicationType === 'group' && isStaff && !selectedClass;
    const cannotStart = individualMissing || groupMissing || !initialMessage.trim() || sendCommunication.isPending;

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={brand.headerGradient} start={brand.headerStart} end={brand.headerEnd} style={styles.header}>
                <View style={styles.headerContent}>
                    <BackButton />
                    <Text style={styles.headerTitle}>New Message</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {isStaff && (
                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[styles.typeBtn, communicationType === 'individual' && styles.typeBtnActive]}
                            onPress={() => setCommunicationType('individual')}
                        >
                            <Icon name="person" size={16} color={communicationType === 'individual' ? '#fff' : '#64748b'} />
                            <Text style={[styles.typeText, communicationType === 'individual' && styles.typeTextActive]}>Individual</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeBtn, communicationType === 'group' && styles.typeBtnActive]}
                            onPress={() => setCommunicationType('group')}
                        >
                            <Icon name="people" size={16} color={communicationType === 'group' ? '#fff' : '#64748b'} />
                            <Text style={[styles.typeText, communicationType === 'group' && styles.typeTextActive]}>Group</Text>
                        </TouchableOpacity>
                        {isPrincipalUser && (
                            <TouchableOpacity
                                style={[styles.typeBtn, communicationType === 'broadcast' && styles.typeBtnActive]}
                                onPress={() => setCommunicationType('broadcast')}
                            >
                                <Icon name="megaphone" size={16} color={communicationType === 'broadcast' ? '#fff' : '#64748b'} />
                                <Text style={[styles.typeText, communicationType === 'broadcast' && styles.typeTextActive]}>Broadcast</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {isStaff ? (
                        <>
                            {communicationType === 'broadcast' ? (
                                <View style={styles.broadcastInfoCard}>
                                    <Icon name="megaphone" size={36} color="#424e79" />
                                    <Text style={styles.broadcastTitle}>School-Wide Principal Broadcast</Text>
                                    <Text style={styles.broadcastDesc}>
                                        Send an official message directly to all chat IDs, students, parents, and staff members across the school.
                                    </Text>
                                </View>
                            ) : communicationType === 'individual' ? (
                                <>
                                    <View style={styles.formSection}>
                                        <Text style={styles.label}>Chat With</Text>
                                        <View style={styles.typeSelector}>
                                            <TouchableOpacity
                                                style={[styles.typeBtn, individualAudience === 'student' && styles.typeBtnActive]}
                                                onPress={() => {
                                                    setIndividualAudience('student');
                                                    setSelectedStaff(null);
                                                }}
                                            >
                                                <Icon name="school" size={16} color={individualAudience === 'student' ? '#fff' : '#64748b'} />
                                                <Text style={[styles.typeText, individualAudience === 'student' && styles.typeTextActive]}>Student</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.typeBtn, individualAudience === 'staff' && styles.typeBtnActive]}
                                                onPress={() => {
                                                    setIndividualAudience('staff');
                                                    setSelectedStudent(null);
                                                    setSelectedClass(null);
                                                    setSelectedSection(null);
                                                }}
                                            >
                                                <Icon name="briefcase" size={16} color={individualAudience === 'staff' ? '#fff' : '#64748b'} />
                                                <Text style={[styles.typeText, individualAudience === 'staff' && styles.typeTextActive]}>Staff</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {individualAudience === 'staff' ? (
                                        <View style={styles.formSection}>
                                            <Text style={styles.label}>Select Staff</Text>
                                            <TouchableOpacity
                                                style={styles.dropdown}
                                                onPress={() => setShowStaffModal(true)}
                                            >
                                                {selectedStaff ? (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#424e79', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{extractStaffName(selectedStaff)?.[0]}</Text>
                                                        </View>
                                                        <Text style={[styles.dropdownText, { maxWidth: '85%' }]} numberOfLines={1}>
                                                            {extractStaffName(selectedStaff)}
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <Text style={[styles.dropdownText, { color: '#94a3b8' }]}>
                                                        Choose staff member
                                                    </Text>
                                                )}
                                                <Icon name="chevron-down" size={20} color="#64748b" />
                                            </TouchableOpacity>

                                            {selectedStaff && (
                                                <View style={styles.selectedCard}>
                                                    <View style={[styles.selectedAvatar, { backgroundColor: '#424e79' }]}>
                                                        <Text style={styles.avatarText}>{extractStaffName(selectedStaff)?.[0]}</Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.selectedName}>{extractStaffName(selectedStaff)}</Text>
                                                        <Text style={styles.selectedMeta}>
                                                            {selectedStaff.emp_designation || 'Staff'}
                                                            {selectedStaff.emp_department ? ` • ${selectedStaff.emp_department}` : ''}
                                                            {selectedStaff.emp_no || selectedStaff.employee_work_id
                                                                ? ` • ${selectedStaff.employee_work_id || selectedStaff.emp_no}`
                                                                : ''}
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity onPress={() => setSelectedStaff(null)}>
                                                        <Icon name="close-circle" size={24} color="#ef4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    ) : (
                                        <>
                                    {/* Class & Section Selection */}
                                    <View style={styles.formSection}>
                                        <Text style={styles.label}>Select Class & Section</Text>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity
                                                style={[styles.dropdown, { flex: 1 }]}
                                                onPress={() => setShowClassModal(true)}
                                            >
                                                <Text style={[styles.dropdownText, !selectedClass && { color: '#94a3b8' }]} numberOfLines={1}>
                                                    {selectedClass ? extractName(selectedClass) : 'Class'}
                                                </Text>
                                                <Icon name="chevron-down" size={18} color="#64748b" />
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.dropdown, { flex: 1, backgroundColor: !selectedClass ? '#f8fafc' : '#fff' }]}
                                                onPress={() => selectedClass && setShowSectionModal(true)}
                                                disabled={!selectedClass}
                                            >
                                                <Text style={[styles.dropdownText, !selectedSection && { color: '#94a3b8' }]} numberOfLines={1}>
                                                    {selectedSection ? extractName(selectedSection) : 'Section'}
                                                </Text>
                                                <Icon name="chevron-down" size={18} color="#64748b" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Student Selection (Dropdown Style) */}
                                    {selectedClass && (
                                        <View style={styles.formSection}>
                                            <Text style={styles.label}>Select Student</Text>
                                            <TouchableOpacity
                                                style={styles.dropdown}
                                                onPress={() => setShowStudentModal(true)}
                                            >
                                                {selectedStudent ? (
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#5a6898', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{extractName(selectedStudent)?.[0]}</Text>
                                                        </View>
                                                        <Text style={[styles.dropdownText, { maxWidth: '85%' }]} numberOfLines={1}>
                                                            {extractName(selectedStudent)}
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <Text style={[styles.dropdownText, { color: '#94a3b8' }]}>
                                                        Choose Student
                                                    </Text>
                                                )}
                                                <Icon name="chevron-down" size={20} color="#64748b" />
                                            </TouchableOpacity>

                                            {/* Selected Student Summary Card */}
                                            {selectedStudent && (
                                                <View style={styles.selectedCard}>
                                                    <View style={styles.selectedAvatar}>
                                                        <Text style={styles.avatarText}>{extractName(selectedStudent)?.[0]}</Text>
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.selectedName}>{extractName(selectedStudent)}</Text>
                                                        <Text style={styles.selectedMeta}>
                                                            Roll No: {selectedStudent.stud_no || 'N/A'} • {selectedClass ? extractName(selectedClass) : ''}
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            setSelectedStudent(null);
                                                        }}
                                                    >
                                                        <Icon name="close-circle" size={24} color="#ef4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                        </>
                                    )}
                                </>
                            ) : (
                                <View style={styles.formSection}>
                                    <Text style={styles.label}>Select Class</Text>
                                    <TouchableOpacity style={styles.dropdown} onPress={() => setShowClassModal(true)}>
                                        <Text style={[styles.dropdownText, !selectedClass && { color: '#94a3b8' }]}>
                                            {selectedClass ? extractName(selectedClass) : 'Choose Class'}
                                        </Text>
                                        <Icon name="chevron-down" size={20} color="#64748b" />
                                    </TouchableOpacity>

                                    {selectedClass && (
                                        <>
                                            <Text style={[styles.label, { marginTop: 20 }]}>Select Section (Optional)</Text>
                                            <TouchableOpacity style={styles.dropdown} onPress={() => setShowSectionModal(true)}>
                                                <Text style={[styles.dropdownText, !selectedSection && { color: '#94a3b8' }]}>
                                                    {selectedSection ? extractName(selectedSection) : 'All Sections'}
                                                </Text>
                                                <Icon name="chevron-down" size={20} color="#64748b" />
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            )}
                        </>
                    ) : (
                        <Text style={styles.instruction}>Select a teacher below to start a conversation.</Text>
                    )}

                    {/* Message Input - ALWAYS SHOW */}
                    <View style={styles.formSection}>
                        <Text style={styles.label}>Message</Text>
                        <View style={[styles.inputWrapper, { height: 100, alignItems: 'flex-start', paddingVertical: 10 }]}>
                            <TextInput
                                style={[styles.input, { textAlignVertical: 'top' }]}
                                placeholder="Type your message here..."
                                multiline={true}
                                numberOfLines={4}
                                value={initialMessage}
                                onChangeText={setInitialMessage}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.createButton, cannotStart && styles.disabledBtn]}
                        onPress={handleCreate}
                        disabled={cannotStart}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={brand.headerGradient}
                            start={brand.headerStart}
                            end={brand.headerEnd}
                            style={styles.buttonGradient}
                        >
                            <Text style={styles.buttonText}>
                                {communicationType === 'broadcast' ? 'SEND BROADCAST TO ALL' : 'START CHAT'}
                            </Text>
                            <Icon name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                        </LinearGradient>
                    </TouchableOpacity>


                </ScrollView>
            </View>

            {/* Modals */}
            <SelectionModal
                visible={showClassModal}
                title="Select Class"
                data={classes}
                onClose={() => setShowClassModal(false)}
                onSelect={(cls: any) => {
                    console.log('Selected Class:', cls);
                    setSelectedClass(cls);
                    setSelectedSection(null);
                    setSelectedStudent(null);
                }}
            />
            <SelectionModal
                visible={showSectionModal}
                title="Select Section"
                data={sections}
                onClose={() => setShowSectionModal(false)}
                onSelect={(sec: any) => {
                    setSelectedSection(sec);
                    setSelectedStudent(null);
                }}
            />

            {/* Student Selection Modal */}
            <SelectionModal
                visible={showStudentModal}
                title="Select Student"
                data={filteredStudents}
                loading={isSearching}
                searchable={true}
                searchValue={studentSearchQuery}
                onSearchChange={setStudentSearchQuery}
                emptyText={
                    studentsError
                        ? "Unable to load students. Please check your connection or contact support."
                        : studentSearchQuery
                            ? "No matching students found"
                            : "No students found for this class/section"
                }
                onClose={() => setShowStudentModal(false)}
                onSelect={(student: any) => {
                    setSelectedStudent(student);
                }}
                renderItem={(item: any, onSelect: any) => (
                    <TouchableOpacity
                        style={styles.resultItem}
                        onPress={onSelect}
                        activeOpacity={0.7}
                    >
                        <LinearGradient
                            colors={['#3B82F6', '#1D4ED8']}
                            style={styles.resultAvatar}
                        >
                            <Text style={styles.resultAvatarText}>{extractName(item)?.[0]?.toUpperCase() || 'S'}</Text>
                        </LinearGradient>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.resultName} numberOfLines={1}>{extractName(item)}</Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.studentBadge}>
                                    <Icon name="school" size={9} color="#1D4ED8" style={{ marginRight: 3 }} />
                                    <Text style={styles.studentBadgeText}>STUDENT</Text>
                                </View>
                                {item.stud_no ? (
                                    <View style={styles.rollBadge}>
                                        <Text style={styles.rollBadgeText}>Roll #{item.stud_no}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                        <Icon name="chevron-forward" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                )}
            />

            <SelectionModal
                visible={showStaffModal}
                title="Select Staff"
                data={filteredStaff}
                loading={isLoadingStaff}
                searchable={true}
                searchValue={staffSearchQuery}
                onSearchChange={setStaffSearchQuery}
                emptyText={
                    staffSearchQuery
                        ? 'No matching staff found'
                        : 'No staff members available'
                }
                onClose={() => setShowStaffModal(false)}
                onSelect={(staff: any) => {
                    setSelectedStaff(staff);
                }}
                renderItem={(item: any, onSelect: any) => (
                    <TouchableOpacity
                        style={styles.resultItem}
                        onPress={onSelect}
                        activeOpacity={0.7}
                    >
                        <LinearGradient
                            colors={['#5a6898', '#424e79']}
                            style={styles.resultAvatar}
                        >
                            <Text style={styles.resultAvatarText}>{extractStaffName(item)?.[0]?.toUpperCase() || 'S'}</Text>
                        </LinearGradient>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.resultName} numberOfLines={1}>{extractStaffName(item)}</Text>
                            <View style={styles.badgeRow}>
                                <View style={styles.studentBadge}>
                                    <Icon name="briefcase" size={9} color="#1D4ED8" style={{ marginRight: 3 }} />
                                    <Text style={styles.studentBadgeText}>STAFF</Text>
                                </View>
                                {item.emp_designation ? (
                                    <View style={styles.rollBadge}>
                                        <Text style={styles.rollBadgeText}>{item.emp_designation}</Text>
                                    </View>
                                ) : null}
                            </View>
                            {item.emp_department || item.employee_work_id || item.emp_no ? (
                                <Text style={styles.selectedMeta} numberOfLines={1}>
                                    {[item.emp_department, item.employee_work_id || item.emp_no].filter(Boolean).join(' • ')}
                                </Text>
                            ) : null}
                        </View>
                        <Icon name="chevron-forward" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    content: { flex: 1 },
    scrollContent: { padding: 20 },
    typeSelector: { flexDirection: 'row', backgroundColor: '#fff', padding: 4, borderRadius: 14, marginHorizontal: 20, marginTop: 16, marginBottom: 0, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
    typeBtnActive: { backgroundColor: '#5a6898' },
    typeText: { fontWeight: '700', color: '#64748b', fontSize: 13 },
    typeTextActive: { color: '#fff' },
    broadcastInfoCard: { backgroundColor: '#eef0f8', borderWidth: 1, borderColor: '#c5cae8', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 15 },
    broadcastTitle: { fontSize: 15, fontWeight: '800', color: '#9a3412', marginTop: 8, textAlign: 'center' },
    broadcastDesc: { fontSize: 13, color: '#2d3660', textAlign: 'center', marginTop: 4, lineHeight: 18 },
    formSection: { marginTop: 20 },
    label: { fontSize: 13, fontWeight: '800', color: '#334155', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: '#E2E8F0' },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 15, color: '#1E293B' },
    dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: '#E2E8F0' },
    dropdownText: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
    createButton: { borderRadius: 16, overflow: 'hidden', marginTop: 32, elevation: 6, shadowColor: '#5a6898', shadowOpacity: 0.35, shadowRadius: 10 },
    disabledBtn: { opacity: 0.5 },
    buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54 },
    buttonText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.8 },

    // Search Results UI
    resultsList: { marginTop: 10, backgroundColor: '#fff', borderRadius: 14, padding: 5, elevation: 3, maxHeight: 250 },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 6,
    },
    resultAvatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    resultAvatarText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
    resultName: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 3 },
    resultMeta: { fontSize: 12, color: '#64748B' },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    studentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    studentBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#1D4ED8',
        letterSpacing: 0.3,
    },
    rollBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
    },
    rollBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
    },
    noResults: { padding: 20, textAlign: 'center', color: '#94A3B8' },

    // Selected Card UI
    selectedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eef0f8',
        padding: 14,
        borderRadius: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#c5cae8',
    },
    selectedAvatar: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#5a6898', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    selectedName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    selectedMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },

    // Modal UI
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    optionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    optionText: { fontSize: 15, color: '#334155', fontWeight: '600' },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#94A3B8', fontSize: 14 },
    instruction: { fontSize: 15, color: '#64748B', textAlign: 'center', marginTop: 20 },
    modalSearchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 14,
        height: 44,
    },
    modalSearchInput: { flex: 1, fontSize: 15, color: '#1E293B' }
});

export default NewCommunicationScreen;
