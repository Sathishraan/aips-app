import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    TextInput,
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    Platform,
    Modal,
    Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import ModuleHeader from '../../components/common/ModuleHeader';
import { useLeaveList, useApplyLeave, useRevokeLeave } from '../../hooks/useLeave';
import { getAuthenticatedUrl } from '../../api/generic.api';
import { LeaveItem } from '../../types/leave.type';

const { width, height } = Dimensions.get('window');

const LeaveRequestScreen = () => {
    const [activeTab, setActiveTab] = useState<'quick' | 'apply' | 'history'>('quick');

    // Standard Leave Form State
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [reason, setReason] = useState('');
    const [attachment, setAttachment] = useState<any>(null);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    // Quick Apply Form State
    const [quickDate, setQuickDate] = useState(new Date());
    const [quickReason, setQuickReason] = useState('');
    const [quickAttachment, setQuickAttachment] = useState<any>(null);
    const [showQuickDatePicker, setShowQuickDatePicker] = useState(false);

    // Common Attachment Picker State
    const [showSourcePicker, setShowSourcePicker] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<'standard' | 'quick'>('standard');

    const [selectedLeave, setSelectedLeave] = useState<LeaveItem | null>(null);
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

    const navigation = useNavigation();
    const { data: leaveList, isLoading, isError, refetch, isFetching } = useLeaveList();
    const applyLeaveMutation = useApplyLeave();
    const revokeLeaveMutation = useRevokeLeave();

    const slideAnim = useRef(new Animated.Value(20)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, [activeTab]);

    const openSourcePicker = (target: 'standard' | 'quick') => {
        setPickerTarget(target);
        setShowSourcePicker(true);
    };

    const pickAttachment = async (source: 'gallery' | 'docs') => {
        setShowSourcePicker(false);
        let pickedFile: any = null;

        if (source === 'gallery') {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            if (!result.canceled) {
                pickedFile = result.assets[0];
            }
        } else {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true
            });
            if (!result.canceled) {
                pickedFile = result.assets[0];
            }
        }

        if (pickedFile) {
            if (pickerTarget === 'quick') {
                setQuickAttachment(pickedFile);
            } else {
                setAttachment(pickedFile);
            }
        }
    };

    const formatDate = (date: Date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    };

    const handleViewFile = async (item: any) => {
        if (!item) return;
        const uri = typeof item === 'string'
            ? getAuthenticatedUrl(item)
            : item.uri;

        try {
            if (typeof item !== 'string' && item.uri) {
                const canShare = await Sharing.isAvailableAsync();
                if (canShare) {
                    await Sharing.shareAsync(item.uri);
                } else {
                    await Linking.openURL(item.uri);
                }
            } else {
                const supported = await Linking.canOpenURL(uri);
                if (supported) {
                    await Linking.openURL(uri);
                } else {
                    Alert.alert('Error', 'Unable to open file. Please copy the link or try another browser.');
                }
            }
        } catch (error) {
            console.error('File view error:', error);
            Alert.alert('Error', 'Could not open the file.');
        }
    };

    const handleApply = async () => {
        console.log('📝 [LeaveRequest] handleApply pressed', {
            from: formatDate(fromDate),
            to: formatDate(toDate),
            reason,
            hasAttachment: !!attachment,
        });

        if (!reason) {
            Alert.alert('Error', 'Please enter a reason for the leave.');
            return;
        }

        try {
            await applyLeaveMutation.mutateAsync({
                from_date: formatDate(fromDate),
                to_date: formatDate(toDate),
                reason: reason,
                attachment: attachment,
            });

            setShowSuccessOverlay(true);
            setTimeout(() => setShowSuccessOverlay(false), 3000);

            setFromDate(new Date());
            setToDate(new Date());
            setReason('');
            setAttachment(null);
            setTimeout(() => setActiveTab('history'), 2000);
        } catch (error: any) {
            console.error('[LeaveRequest] Submission failed:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to submit leave application.';
            Alert.alert('Error', errorMsg);
        }
    };

    const handleQuickApply = async () => {
        const formattedSingleDate = formatDate(quickDate);
        console.log('📝 [LeaveRequest] handleQuickApply pressed', {
            date: formattedSingleDate,
            reason: quickReason.trim() || 'Leave',
            hasAttachment: !!quickAttachment,
        });

        try {
            await applyLeaveMutation.mutateAsync({
                from_date: formattedSingleDate,
                to_date: formattedSingleDate,
                reason: quickReason.trim() || 'Leave',
                attachment: quickAttachment,
            });

            setShowSuccessOverlay(true);
            setTimeout(() => setShowSuccessOverlay(false), 3000);

            setQuickDate(new Date());
            setQuickReason('');
            setQuickAttachment(null);
            setTimeout(() => setActiveTab('history'), 2000);
        } catch (error: any) {
            console.error('[LeaveRequest] Quick application failed:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to submit quick leave application.';
            Alert.alert('Error', errorMsg);
        }
    };

    const getStatusInfo = (approved: string | null) => {
        switch (String(approved ?? '')) {
            case '0': return { label: 'PENDING', color: '#f59e0b' };
            case '1': return { label: 'APPROVED', color: '#10b981' };
            case '2': return { label: 'REJECTED', color: '#ef4444' };
            case '3': return { label: 'REVOKED', color: '#64748b' };
            default: return { label: 'PENDING', color: '#94a3b8' };
        }
    };

    const isPendingLeave = (approved: string | null) => {
        const value = String(approved ?? '0');
        return value === '0' || value === '';
    };

    const handleRevoke = (item: LeaveItem) => {
        if (!item?.id || !isPendingLeave(item.approved) || revokeLeaveMutation.isPending) {
            return;
        }
        Alert.alert(
            'Revoke leave?',
            'This will cancel your pending leave request. You can apply again later.',
            [
                { text: 'Keep', style: 'cancel' },
                {
                    text: 'Revoke',
                    style: 'destructive',
                    onPress: () => {
                        revokeLeaveMutation.mutate(item.id, {
                            onSuccess: () => {
                                if (selectedLeave?.id === item.id) {
                                    setIsDetailsVisible(false);
                                    setSelectedLeave(null);
                                }
                                Alert.alert('Revoked', 'Your leave request has been cancelled.');
                            },
                            onError: (error: any) => {
                                Alert.alert('Error', error?.message || 'Could not revoke this leave request.');
                            },
                        });
                    },
                },
            ]
        );
    };

    const renderQuickApplyForm = () => {
        const isToday = formatDate(quickDate) === formatDate(new Date());
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = formatDate(quickDate) === formatDate(tomorrow);

        return (
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                {showSuccessOverlay && (
                    <View style={styles.inlineSuccess}>
                        <Icon name="checkmark-circle" size={24} color="#fff" />
                        <Text style={styles.inlineSuccessText}>1-Day Leave Request Sent!</Text>
                    </View>
                )}

                <View style={styles.card}>
                    <View style={styles.quickHeaderBanner}>
                        <LinearGradient colors={['#eef0f8', '#eef0f8']} style={styles.quickBannerGradient}>
                            <Icon name="flash" size={22} color="#5a6898" />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.quickBannerTitle}>Single-Day Quick Leave</Text>
                                <Text style={styles.quickBannerSubtitle}>Fast 1-click leave submission with optional reason</Text>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Quick Date Presets */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Select Date*</Text>
                        <View style={styles.presetContainer}>
                            <TouchableOpacity
                                style={[styles.presetBadge, isToday && styles.presetBadgeActive]}
                                onPress={() => setQuickDate(new Date())}
                            >
                                <Text style={[styles.presetText, isToday && styles.presetTextActive]}>Today</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.presetBadge, isTomorrow && styles.presetBadgeActive]}
                                onPress={() => setQuickDate(tomorrow)}
                            >
                                <Text style={[styles.presetText, isTomorrow && styles.presetTextActive]}>Tomorrow</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.dateSelector}
                            onPress={() => setShowQuickDatePicker(true)}
                        >
                            <Icon name="calendar" size={20} color="#5a6898" />
                            <Text style={styles.dateSelectorText}>{formatDate(quickDate)}</Text>
                            <Icon name="chevron-down" size={18} color="#94a3b8" style={{ marginLeft: 'auto' }} />
                        </TouchableOpacity>
                        {showQuickDatePicker && (
                            <DateTimePicker
                                value={quickDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, selectedDate) => {
                                    setShowQuickDatePicker(false);
                                    if (selectedDate) setQuickDate(selectedDate);
                                }}
                            />
                        )}
                    </View>

                    {/* Optional Reason Input */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Reason</Text>
                            <Text style={styles.optionalBadge}>Optional</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea, { height: 80 }]}
                            placeholder="Reason for leave (Optional, e.g. Personal Work)"
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={3}
                            value={quickReason}
                            onChangeText={setQuickReason}
                        />
                    </View>

                    {/* Optional Attachment */}
                    <View style={styles.formGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Attachment</Text>
                            <Text style={styles.optionalBadge}>Optional</Text>
                        </View>
                        <TouchableOpacity style={styles.attachButton} onPress={() => openSourcePicker('quick')}>
                            <Icon name="attach" size={20} color="#64748b" />
                            <Text style={styles.attachButtonText}>
                                {quickAttachment ? 'Change Attachment' : 'Upload Image/Document'}
                            </Text>
                        </TouchableOpacity>
                        {quickAttachment && (
                            <View style={styles.attachmentPreview}>
                                <TouchableOpacity
                                    style={{ flex: 1 }}
                                    onPress={() => handleViewFile(quickAttachment)}
                                    activeOpacity={0.7}
                                >
                                    {quickAttachment.mimeType?.startsWith('image/') || !quickAttachment.mimeType ? (
                                        <Image source={{ uri: quickAttachment.uri }} style={styles.previewImage} />
                                    ) : (
                                        <View style={styles.filePreview}>
                                            <Icon name="document-text" size={40} color="#64748b" />
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.fileNameText} numberOfLines={1}>
                                                    {quickAttachment.name || 'document'}
                                                </Text>
                                                <Text style={styles.fileSizeText}>
                                                    {quickAttachment.size ? (quickAttachment.size / 1024).toFixed(1) + ' KB' : ''}
                                                </Text>
                                            </View>
                                            <Icon name="eye-outline" size={20} color="#94a3b8" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setQuickAttachment(null)} style={styles.removeAttach}>
                                    <Icon name="close-circle" size={24} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, applyLeaveMutation.isPending && styles.disabledButton]}
                        onPress={handleQuickApply}
                        disabled={applyLeaveMutation.isPending}
                    >
                        {applyLeaveMutation.isPending ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Icon name="flash" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Quick Apply (1-Day Leave)</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };

    const renderApplyForm = () => (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {showSuccessOverlay && (
                <View style={styles.inlineSuccess}>
                    <Icon name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.inlineSuccessText}>Application Submitted Successfully!</Text>
                </View>
            )}

            <View style={styles.card}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>From Date*</Text>
                    <TouchableOpacity
                        style={styles.dateSelector}
                        onPress={() => setShowFromPicker(true)}
                    >
                        <Icon name="calendar-outline" size={20} color="#64748b" />
                        <Text style={styles.dateSelectorText}>{formatDate(fromDate)}</Text>
                    </TouchableOpacity>
                    {showFromPicker && (
                        <DateTimePicker
                            value={fromDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedDate) => {
                                setShowFromPicker(false);
                                if (selectedDate) setFromDate(selectedDate);
                            }}
                        />
                    )}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>To Date*</Text>
                    <TouchableOpacity
                        style={styles.dateSelector}
                        onPress={() => setShowToPicker(true)}
                    >
                        <Icon name="calendar-outline" size={20} color="#64748b" />
                        <Text style={styles.dateSelectorText}>{formatDate(toDate)}</Text>
                    </TouchableOpacity>
                    {showToPicker && (
                        <DateTimePicker
                            value={toDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedDate) => {
                                setShowToPicker(false);
                                if (selectedDate) setToDate(selectedDate);
                            }}
                        />
                    )}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Reason*</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Enter reason for leave"
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={4}
                        value={reason}
                        onChangeText={setReason}
                    />
                </View>

                <View style={styles.formGroup}>
                    <View style={styles.labelRow}>
                        <Text style={styles.label}>Attachment</Text>
                        <Text style={styles.optionalBadge}>Optional</Text>
                    </View>
                    <TouchableOpacity style={styles.attachButton} onPress={() => openSourcePicker('standard')}>
                        <Icon name="attach" size={20} color="#64748b" />
                        <Text style={styles.attachButtonText}>
                            {attachment ? 'Change Attachment' : 'Upload Image/Document'}
                        </Text>
                    </TouchableOpacity>
                    {attachment && (
                        <View style={styles.attachmentPreview}>
                            <TouchableOpacity
                                style={{ flex: 1 }}
                                onPress={() => handleViewFile(attachment)}
                                activeOpacity={0.7}
                            >
                                {attachment.mimeType?.startsWith('image/') || !attachment.mimeType ? (
                                    <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
                                ) : (
                                    <View style={styles.filePreview}>
                                        <Icon name="document-text" size={40} color="#64748b" />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.fileNameText} numberOfLines={1}>
                                                {attachment.name || 'document'}
                                            </Text>
                                            <Text style={styles.fileSizeText}>
                                                {attachment.size ? (attachment.size / 1024).toFixed(1) + ' KB' : ''}
                                            </Text>
                                        </View>
                                        <Icon name="eye-outline" size={20} color="#94a3b8" />
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setAttachment(null)} style={styles.removeAttach}>
                                <Icon name="close-circle" size={24} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, applyLeaveMutation.isPending && styles.disabledButton]}
                    onPress={handleApply}
                    disabled={applyLeaveMutation.isPending}
                >
                    {applyLeaveMutation.isPending ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Application</Text>
                    )}
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderHistory = () => (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#5a6898" />
                    <Text style={styles.loadingText}>Fetching leave records...</Text>
                </View>
            ) : leaveList && leaveList.length > 0 ? (
                leaveList.map((item, index) => {
                    const status = getStatusInfo(item.approved);
                    const canRevoke = isPendingLeave(item.approved);
                    const isRevoking = revokeLeaveMutation.isPending && revokeLeaveMutation.variables === item.id;
                    return (
                        <View key={item.id || index} style={styles.leaveCard}>
                            <View style={[styles.statusIndicator, { backgroundColor: status.color }]} />
                            <View style={styles.leaveCardContent}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedLeave(item);
                                        setIsDetailsVisible(true);
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.leaveCardHeader}>
                                        <View style={styles.leaveDateColumn}>
                                            <View style={styles.dateRow}>
                                                <Text style={styles.dateLabelMini}>FROM:</Text>
                                                <Text style={styles.leaveDates}>{item.fromDate}</Text>
                                            </View>
                                            <View style={styles.dateRow}>
                                                <Text style={styles.dateLabelMini}>TO:    </Text>
                                                <Text style={styles.leaveDates}>{item.toDate}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
                                            <Text style={[styles.badgeText, { color: status.color }]}>
                                                {status.label}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.leaveReason} numberOfLines={1}>
                                        {item.reason || 'No reason specified'}
                                    </Text>
                                </TouchableOpacity>
                                <View style={styles.cardFooter}>
                                    <Text style={styles.createdAt}>Applied: {item.created_at?.split(' ')[0]}</Text>
                                    {canRevoke ? (
                                        <TouchableOpacity
                                            style={[styles.revokeButton, isRevoking && styles.disabledButton]}
                                            onPress={() => handleRevoke(item)}
                                            disabled={isRevoking}
                                            activeOpacity={0.8}
                                        >
                                            {isRevoking ? (
                                                <ActivityIndicator size="small" color="#ef4444" />
                                            ) : (
                                                <>
                                                    <Icon name="close-circle-outline" size={14} color="#ef4444" />
                                                    <Text style={styles.revokeButtonText}>Revoke</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedLeave(item);
                                                setIsDetailsVisible(true);
                                            }}
                                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        >
                                            <Icon name="chevron-forward" size={16} color="#cbd5e1" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                })
            ) : (
                <View style={styles.emptyContainer}>
                    <Icon name="calendar-outline" size={60} color="#cbd5e1" />
                    <Text style={styles.emptyText}>No leave records found.</Text>
                </View>
            )}
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <ModuleHeader
                title="Leave Requests"
                subtitle="📅 Leave Management"
                actionIcon="calendar-outline"
                onActionPress={() => { }}
            />

            <View style={styles.tabSection}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'quick' && styles.activeTab]}
                        onPress={() => setActiveTab('quick')}
                    >
                        <Text style={[styles.tabText, activeTab === 'quick' && styles.activeTabText]}>Quick Apply ⚡</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'apply' && styles.activeTab]}
                        onPress={() => setActiveTab('apply')}
                    >
                        <Text style={[styles.tabText, activeTab === 'apply' && styles.activeTabText]}>Apply Leave</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                        onPress={() => setActiveTab('history')}
                    >
                        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor="#5a6898" />
                }
            >
                {activeTab === 'quick' ? renderQuickApplyForm() : activeTab === 'apply' ? renderApplyForm() : renderHistory()}
            </ScrollView>

            {/* Leave Details Modal */}
            <Modal
                visible={isDetailsVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsDetailsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Leave Details</Text>
                            <TouchableOpacity
                                onPress={() => setIsDetailsVisible(false)}
                                style={styles.closeButton}
                            >
                                <Icon name="close" size={24} color="#1e293b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            {selectedLeave && (
                                <>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Duration</Text>
                                        <Text style={styles.detailValue}>
                                            {selectedLeave.fromDate} to {selectedLeave.toDate}
                                        </Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Total Days</Text>
                                        <Text style={styles.detailValue}>{selectedLeave.totalDays} Days</Text>
                                    </View>
                                    <View style={styles.divider} />

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Reason</Text>
                                        <Text style={styles.detailValue}>{selectedLeave.reason || 'N/A'}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Status</Text>
                                        <View style={[styles.badge, { backgroundColor: getStatusInfo(selectedLeave.approved).color + '20', alignSelf: 'flex-start' }]}>
                                            <Text style={[styles.badgeText, { color: getStatusInfo(selectedLeave.approved).color }]}>
                                                {getStatusInfo(selectedLeave.approved).label}
                                            </Text>
                                        </View>
                                    </View>

                                    {selectedLeave.approvedOn && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Actioned On</Text>
                                            <Text style={styles.detailValue}>{selectedLeave.approvedOn}</Text>
                                        </View>
                                    )}

                                    {selectedLeave.approver_name && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Processed By</Text>
                                            <Text style={styles.detailValue}>{selectedLeave.approver_name}</Text>
                                        </View>
                                    )}

                                    <View style={styles.divider} />

                                    <View style={styles.attachmentSection}>
                                        <Text style={styles.attachmentLabel}>Attachment</Text>
                                        {selectedLeave.attachment ? (
                                            <TouchableOpacity
                                                onPress={() => handleViewFile(selectedLeave.attachment)}
                                                activeOpacity={0.8}
                                                style={styles.attachmentContainer}
                                            >
                                                {selectedLeave.attachment.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                                                    <Image
                                                        source={{ uri: selectedLeave.attachmentFullUrl || getAuthenticatedUrl(selectedLeave.attachment) }}
                                                        style={styles.attachmentImage}
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <View style={styles.documentPreviewContainer}>
                                                        <Icon name="document-text" size={60} color="#5a6898" />
                                                        <Text style={styles.documentTitle}>View Document</Text>
                                                        <Text style={styles.documentSubtitle}>Tap to view document</Text>
                                                    </View>
                                                )}
                                                <View style={styles.viewBadge}>
                                                    <Icon name="eye" size={16} color="#fff" />
                                                    <Text style={styles.viewBadgeText}>View Document</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            <Text style={styles.noAttachment}>No document attached</Text>
                                        )}
                                    </View>

                                    {isPendingLeave(selectedLeave.approved) && (
                                        <TouchableOpacity
                                            style={[
                                                styles.revokeModalButton,
                                                revokeLeaveMutation.isPending && styles.disabledButton,
                                            ]}
                                            onPress={() => handleRevoke(selectedLeave)}
                                            disabled={revokeLeaveMutation.isPending}
                                            activeOpacity={0.85}
                                        >
                                            {revokeLeaveMutation.isPending ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <>
                                                    <Icon name="close-circle-outline" size={18} color="#fff" />
                                                    <Text style={styles.revokeModalButtonText}>Revoke Request</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal
                visible={showSuccessOverlay}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSuccessOverlay(false)}
            >
                <View style={styles.successModalOverlay}>
                    <View style={styles.successModalContent}>
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            style={styles.successIconCircle}
                        >
                            <Icon name="checkmark" size={50} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.successTitle}>Request Sent!</Text>
                        <Text style={styles.successSubtitle}>
                            Your leave application has been submitted successfully.
                        </Text>
                        <TouchableOpacity
                            style={styles.successDoneButton}
                            onPress={() => setShowSuccessOverlay(false)}
                        >
                            <Text style={styles.successDoneText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Source Picker Modal */}
            <Modal
                visible={showSourcePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSourcePicker(false)}
            >
                <TouchableOpacity
                    style={styles.sourceOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSourcePicker(false)}
                >
                    <View style={styles.sourceContent}>
                        <View style={styles.sourceHeader}>
                            <Text style={styles.sourceTitle}>Select Attachment Source</Text>
                            <View style={styles.sourceIndicator} />
                        </View>

                        <View style={styles.sourceGrid}>
                            <TouchableOpacity
                                style={styles.sourceItem}
                                onPress={() => pickAttachment('gallery')}
                            >
                                <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.sourceIcon}>
                                    <Icon name="images" size={24} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.sourceText}>Photo Gallery</Text>
                                <Text style={styles.sourceSubtext}>Select from photos</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.sourceItem}
                                onPress={() => pickAttachment('docs')}
                            >
                                <LinearGradient colors={['#10b981', '#059669']} style={styles.sourceIcon}>
                                    <Icon name="document-attach" size={24} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.sourceText}>Documents</Text>
                                <Text style={styles.sourceSubtext}>PDF, Docs, etc.</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.cancelSource}
                            onPress={() => setShowSourcePicker(false)}
                        >
                            <Text style={styles.cancelSourceText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },

    tabSection: {
        padding: 12,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 15,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        color: '#64748b',
        fontWeight: '700',
        fontSize: 12,
    },
    activeTabText: {
        color: '#5a6898',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        marginBottom: 30,
    },
    quickHeaderBanner: {
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 20,
    },
    quickBannerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 15,
    },
    quickBannerTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#2d3660',
    },
    quickBannerSubtitle: {
        fontSize: 11,
        color: '#424e79',
        fontWeight: '600',
        marginTop: 2,
    },
    presetContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    presetBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    presetBadgeActive: {
        backgroundColor: '#eef0f8',
        borderColor: '#c5cae8',
    },
    presetText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
    },
    presetTextActive: {
        color: '#5a6898',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    optionalBadge: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 15,
        fontSize: 15,
        color: '#1e293b',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 12,
    },
    dateSelectorText: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '600',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    attachButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        padding: 15,
        borderRadius: 12,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        gap: 10,
    },
    attachButtonText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
    attachmentPreview: {
        marginTop: 15,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#e2e8f0',
    },
    removeAttach: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
    },
    submitButton: {
        backgroundColor: '#5a6898',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#5a6898',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    centerContainer: {
        padding: 50,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        color: '#64748b',
        fontWeight: '600',
    },
    leaveCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 15,
        flexDirection: 'row',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    statusIndicator: {
        width: 6,
    },
    leaveCardContent: {
        flex: 1,
        padding: 18,
    },
    leaveCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    leaveDates: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1e293b',
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    leaveReason: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 12,
    },
    createdAt: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 50,
        marginTop: 30,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '600',
    },
    filePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 15,
        borderRadius: 15,
        gap: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    fileNameText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    fileSizeText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
    },
    inlineSuccess: {
        backgroundColor: '#10b981',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        gap: 10,
    },
    inlineSuccessText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    leaveDateColumn: {
        flex: 1,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    dateLabelMini: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        width: 40,
    },
    leaveDateRange: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    revokeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        minHeight: 32,
        minWidth: 78,
        justifyContent: 'center',
    },
    revokeButtonText: {
        color: '#ef4444',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    revokeModalButton: {
        marginTop: 18,
        backgroundColor: '#ef4444',
        borderRadius: 14,
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    revokeModalButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 25,
        maxHeight: height * 0.8,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
    },
    closeButton: {
        padding: 5,
    },
    modalBody: {
        padding: 20,
    },
    detailRow: {
        marginBottom: 18,
    },
    detailLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '600',
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 15,
    },
    attachmentSection: {
        marginBottom: 20,
    },
    attachmentLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    attachmentImage: {
        width: '100%',
        height: 200,
        borderRadius: 15,
        backgroundColor: '#f8fafc',
    },
    noAttachment: {
        fontSize: 14,
        color: '#cbd5e1',
        fontStyle: 'italic',
    },
    attachmentContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    documentPreviewContainer: {
        height: 200,
        backgroundColor: '#eef0f8',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#c5cae8',
    },
    documentTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
        marginTop: 10,
    },
    documentSubtitle: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 4,
    },
    sourceOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sourceContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    },
    sourceHeader: {
        alignItems: 'center',
        marginBottom: 25,
    },
    sourceIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        marginTop: 10,
    },
    sourceTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
    },
    sourceGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    sourceItem: {
        alignItems: 'center',
        width: width * 0.4,
    },
    sourceIcon: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sourceText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    sourceSubtext: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
    },
    cancelSource: {
        backgroundColor: '#f1f5f9',
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    cancelSourceText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748b',
    },
    successModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    successModalContent: {
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 30,
        width: '100%',
        alignItems: 'center',
        elevation: 10,
    },
    successIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: 10,
    },
    successSubtitle: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 20,
    },
    successDoneButton: {
        backgroundColor: '#10b981',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 15,
        width: '100%',
        alignItems: 'center',
    },
    successDoneText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
    },
    viewBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    viewBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
});

export default LeaveRequestScreen;
