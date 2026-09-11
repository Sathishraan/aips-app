import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
    ActivityIndicator,
    Image,
    Linking,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useHomeworkDetail, HomeworkAttachment, resolveHomeworkAttachmentUrl } from '../hooks/useHomeworkDetail';
import ModuleHeader from '../components/common/ModuleHeader';
import { useState } from 'react';
import { Modal, Pressable } from 'react-native';

const isRenderableUri = (uri?: string | null) =>
    !!uri && /^(https?:|file:|content:|data:|ph:|assets-library:)/i.test(uri);

export default function HomeworkDetailScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const params = route.params as { homeworkId: string, title?: string, issueDate?: string, submitDate?: string } | undefined;
    const homeworkId = params?.homeworkId;
    const titleParam = params?.title;
    const issueDateParam = params?.issueDate;
    const submitDateParam = params?.submitDate;

    console.log('--- HomeworkDetailScreen Params:', params, '---');

    const { data: homework, isLoading, error } = useHomeworkDetail(homeworkId || '');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const getAttachmentUrl = (file: HomeworkAttachment | string) => {
        if (typeof file === 'string') {
            return resolveHomeworkAttachmentUrl({ file_path: file });
        }
        return resolveHomeworkAttachmentUrl(file);
    };

    const isImageFile = (file: HomeworkAttachment) => {
        const type = String(file.file_type || '').toLowerCase();
        const name = String(file.file_name || file.file_path || '').toLowerCase();
        return type.includes('image') || /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(name);
    };

    const handleAttachmentPress = (file: HomeworkAttachment) => {
        const url = getAttachmentUrl(file);
        if (isImageFile(file)) {
            setPreviewImage(url);
        } else {
            console.log('Opening file:', url);
            Linking.openURL(url).catch(err => {
                console.error('Error opening file:', err);
                Alert.alert('Error', 'Unable to open file. Please ensure you have a compatible viewer installed.');
            });
        }
    };

    if (isLoading && !issueDateParam) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5a6898" />
                <Text style={styles.loadingText}>Loading homework details...</Text>
            </View>
        );
    }

    if (!homeworkId) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="alert-circle-outline" size={60} color="#ef4444" />
                <Text style={styles.errorText}>No Assignment Selected</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (error && !issueDateParam) {
        return (
            <View style={styles.errorContainer}>
                <Icon name="alert-circle-outline" size={60} color="#ef4444" />
                <Text style={styles.errorText}>Failed to load homework details</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const displayIssueDate = issueDateParam || 'N/A';
    const displaySubmitDate = submitDateParam || 'N/A';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <ModuleHeader
                title={titleParam || 'Assignment'}
                subtitle="📖 Homework Details"
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.infoRow}>
                    <LinearGradient colors={['#fff', '#fff']} style={[styles.infoBox, styles.shadow]}>
                        <View style={[styles.iconCircle, { backgroundColor: '#eef0f8' }]}>
                            <Icon name="calendar" size={20} color="#5a6898" />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Date of Issue</Text>
                            <Text style={styles.infoValue}>{displayIssueDate}</Text>
                        </View>
                    </LinearGradient>

                    <LinearGradient colors={['#fff', '#fff']} style={[styles.infoBox, styles.shadow]}>
                        <View style={[styles.iconCircle, { backgroundColor: '#fef2f2' }]}>
                            <Icon name="alarm" size={20} color="#ef4444" />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Submit Date</Text>
                            <Text style={styles.infoValue}>{displaySubmitDate}</Text>
                        </View>
                    </LinearGradient>
                </View>

                {isLoading ? (
                    <View style={styles.subLoader}>
                        <ActivityIndicator color="#5a6898" />
                        <Text style={styles.subLoaderText}>Fetching details...</Text>
                    </View>
                ) : (
                    <>
                        {homework?.subjects?.map((sub, index) => {
                            const subAttachments = (sub.attachments && sub.attachments.length > 0)
                                ? sub.attachments
                                : (homework.attachments || []).filter(
                                    (a) => String(a.subject_id) === String(sub.subject_id)
                                );

                            return (
                                <View key={sub.id || index} style={[styles.subjectCard, styles.shadow]}>
                                    <View style={styles.subjectHeader}>
                                        <View style={styles.subjectTitleContainer}>
                                            <View style={styles.subjectIconWrap}>
                                                <Icon name="document-text" size={18} color="#5a6898" />
                                            </View>
                                            <Text style={styles.subjectName}>{sub.subject_name || sub.subject_id}</Text>
                                        </View>
                                            <Text style={styles.subjectTime}>{sub.created_at?.split?.(' ')?.[1] || ''}</Text>
                                    </View>

                                    <View style={styles.descriptionSection}>
                                        <Text style={styles.sectionLabel}>DESCRIPTION</Text>
                                        <Text style={styles.descriptionText}>{sub.description}</Text>
                                    </View>

                                    {subAttachments.length > 0 && (
                                        <View style={styles.attachmentSection}>
                                            <Text style={styles.sectionLabel}>ATTACHMENTS ({subAttachments.length})</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentScroll}>
                                                {subAttachments.map((file, fIdx) => {
                                                    const isImage = isImageFile(file);
                                                    const url = getAttachmentUrl(file);

                                                    return (
                                                        <TouchableOpacity
                                                            key={file.id || fIdx}
                                                            style={styles.attachmentCard}
                                                            onPress={() => handleAttachmentPress(file)}
                                                        >
                                                            {isImage && isRenderableUri(url) ? (
                                                                <View style={styles.imagePreviewContainer}>
                                                                    <Image
                                                                        source={{ uri: url }}
                                                                        style={styles.blurredImage}
                                                                    />
                                                                    <View style={styles.imageOverlay}>
                                                                        <Icon name="eye" size={20} color="#fff" />
                                                                    </View>
                                                                </View>
                                                            ) : isImage ? (
                                                                <View style={styles.fileIconContainer}>
                                                                    <Icon name="image" size={24} color="#64748b" />
                                                                </View>
                                                            ) : (
                                                                <View style={styles.fileIconContainer}>
                                                                    <Icon
                                                                        name={String(file.file_type || file.file_name || '').toLowerCase().includes('pdf') ? 'document-text' : 'journal'}
                                                                        size={24}
                                                                        color="#64748b"
                                                                    />
                                                                </View>
                                                            )}
                                                            <View style={styles.attachmentMiniInfo}>
                                                                <Text style={styles.attachmentMiniName} numberOfLines={1}>{file.file_name}</Text>
                                                                <Text style={styles.attachmentMiniSize}>
                                                                    {(String(file.file_type || '').split('/')[1] || 'FILE').toUpperCase()}
                                                                </Text>
                                                            </View>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        {/* Fallback for attachments not linked to a specific subject in the subjects array */}
                        {(() => {
                            const subjectIds = (homework?.subjects || []).map((s) => String(s.subject_id));
                            const orphaned = (homework?.attachments || []).filter(
                                (a) => !subjectIds.includes(String(a.subject_id))
                            );

                            if (orphaned.length > 0) {
                                return (
                                    <View style={[styles.subjectCard, styles.shadow]}>
                                        <View style={styles.subjectHeader}>
                                            <View style={styles.subjectTitleContainer}>
                                                <View style={styles.subjectIconWrap}>
                                                    <Icon name="attach" size={18} color="#5a6898" />
                                                </View>
                                                <Text style={styles.subjectName}>Other Files</Text>
                                            </View>
                                        </View>
                                        <View style={styles.attachmentSection}>
                                            {orphaned.map((file, fIdx) => (
                                                <TouchableOpacity
                                                    key={file.id || fIdx}
                                                    style={styles.attachmentButton}
                                                    onPress={() => handleAttachmentPress(file)}
                                                >
                                                    <Icon
                                                        name={String(file.file_type || file.file_name || '').toLowerCase().includes('pdf') ? 'document-text' : 'image'}
                                                        size={20}
                                                        color="#64748b"
                                                    />
                                                    <Text style={styles.attachmentName} numberOfLines={1}>{file.file_name}</Text>
                                                    <Icon name="download-outline" size={18} color="#5a6898" />
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                );
                            }
                            return null;
                        })()}
                    </>
                )}
            </ScrollView>

            {/* WhatsApp-style Image Preview Modal */}
            <Modal
                visible={!!previewImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPreviewImage(null)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setPreviewImage(null)}
                >
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => setPreviewImage(null)}
                        >
                            <Icon name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {isRenderableUri(previewImage) && (
                        <Image
                            source={{ uri: previewImage as string }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.downloadBtn}>
                            <Icon name="download" size={24} color="#fff" />
                            <Text style={styles.downloadBtnText}>Save to Gallery</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#64748b',
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#1e293b',
        fontWeight: '700',
        marginTop: 15,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#5a6898',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
    content: {
        flex: 1,
        marginTop: 15,
        paddingHorizontal: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
        marginBottom: 25,
    },
    infoBox: {
        flex: 1,
        borderRadius: 24,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 6,
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 13,
        color: '#1e293b',
        fontWeight: '900',
    },
    subLoader: {
        padding: 40,
        alignItems: 'center',
    },
    subLoaderText: {
        marginTop: 10,
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
    subjectCard: {
        backgroundColor: '#fff',
        borderRadius: 30,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    subjectTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    subjectIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#eef0f8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    subjectName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: 0.5,
    },
    subjectTime: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '700',
    },
    descriptionSection: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
        fontWeight: '500',
    },
    attachmentSection: {
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
    },
    attachmentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 12,
        paddingHorizontal: 15,
        marginBottom: 8,
        gap: 12,
    },
    attachmentName: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
    },
    attachmentScroll: {
        marginTop: 5,
        marginHorizontal: -5,
    },
    attachmentCard: {
        width: 140,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 10,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    imagePreviewContainer: {
        width: '100%',
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#e2e8f0',
        position: 'relative',
    },
    blurredImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileIconContainer: {
        width: '100%',
        height: 80,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachmentMiniInfo: {
        marginTop: 8,
    },
    attachmentMiniName: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1e293b',
    },
    attachmentMiniSize: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: '800',
        marginTop: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
    },
    modalHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        zIndex: 10,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '70%',
    },
    modalFooter: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    downloadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5a6898',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 10,
    },
    downloadBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
