import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Modal,
    RefreshControl,
    TextInput,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import { useGallery } from '../../hooks/useGallery';
import { GalleryItem } from '../../types/gallery.type';
import { useUser, isStudent, isEmployee } from '../../hooks/useUser';
import { useUploadGallery, useStaffFilterOptions } from '../../hooks/useStaffErp';
import CustomDropdown from '../../components/common/CustomDropdown';
import * as ImagePicker from 'expo-image-picker';
import { guessHomeworkMime } from '../../utils/homeworkImage';

import { getAuthenticatedUrl } from '../../api/generic.api';
import { getAuthToken } from '../../api/base';
import { colors, radii, space } from '../../theme/appTheme';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 45) / COLUMN_COUNT;

const getMediaUrl = (path: string) => {
    if (!path) {
        console.log('[Gallery] Empty path provided');
        return '';
    }

    console.log('[Gallery] Input path:', path);

    // If it's already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://')) {
        console.log('[Gallery] Path is already a full URL, returning as-is');
        return path;
    }

    const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
    const imagePath = cleanPath.startsWith('uploads/') || cleanPath.includes('htdocs/')
        ? cleanPath
        : `uploads/${cleanPath}`;
    const url = getAuthenticatedUrl(imagePath);
    console.log('[Gallery] Constructed URL:', url);
    return url;
};

const getImageHeaders = (): { [key: string]: string } | undefined => {
    const token = getAuthToken();
    if (!token) return undefined;

    return {
        'Authorization': `Bearer ${token}`,
        'X-Authorization': `Bearer ${token}`,
        'auth': token,
    };
};

const GalleryScreen = () => {
    const { data: galleryItems, isLoading, refetch, isFetching } = useGallery();
    const { user } = useUser();
    const staffMode = isEmployee(user);
    const uploadMutation = useUploadGallery();
    const { classItems, sectionItems } = useStaffFilterOptions(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [classId, setClassId] = useState('0');
    const [sectionId, setSectionId] = useState('0');
    const [picked, setPicked] = useState<{ uri: string; name: string; type: string; base64?: string } | null>(null);
    const studentClass = isStudent(user) ? user.class : '';
    const studentSection = isStudent(user) ? user.section : '';
    const subtitle = staffMode
        ? 'Staff entry · school moments'
        : studentClass
            ? `${studentClass}${studentSection ? ` · ${studentSection}` : ''}`
            : 'School moments';

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow photo library access to upload.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            base64: true,
            exif: false,
            allowsEditing: false,
            preferredAssetRepresentationMode:
                ImagePicker.UIImagePickerPreferredAssetRepresentationMode?.Current,
        });
        if (result.canceled || !result.assets?.[0]) return;
        const asset = result.assets[0];
        const name = asset.fileName || asset.uri.split('/').pop() || `gallery-${Date.now()}.jpg`;
        setPicked({
            uri: asset.uri,
            name,
            type: guessHomeworkMime(name, asset.mimeType),
            base64: asset.base64 || undefined,
        });
    };

    const handleUpload = async () => {
        if (!title.trim() || !picked) {
            Alert.alert('Missing fields', 'Title and image are required.');
            return;
        }
        try {
            await uploadMutation.mutateAsync({
                title: title.trim(),
                description: description.trim(),
                event_date: new Date().toISOString().slice(0, 10),
                class_id: classId,
                section_id: sectionId,
                image: picked,
            });
            setUploadOpen(false);
            setTitle('');
            setDescription('');
            setPicked(null);
            refetch();
            Alert.alert('Uploaded', 'Gallery image saved to ERP.');
        } catch (e: any) {
            Alert.alert('Failed', e?.message || 'Could not upload image');
        }
    };

    const renderItem = ({ item }: { item: GalleryItem }) => {
        const imageUrl = getMediaUrl(item.image_path);
        const headers = getImageHeaders();

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => setSelectedImage(item.image_path)}
                activeOpacity={0.9}
            >
                <Image
                    source={{
                        uri: imageUrl,
                        ...(headers && { headers })
                    }}
                    style={styles.image}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.overlay}
                >
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.itemDate}>{item.event_date}</Text>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading gallery…</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ModuleHeader
                title="Gallery"
                subtitle={subtitle}
                actionIcon={staffMode ? 'cloud-upload-outline' : 'search-outline'}
                onActionPress={() => staffMode && setUploadOpen(true)}
            />

            <FlatList
                data={galleryItems}
                renderItem={renderItem}
                keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                numColumns={COLUMN_COUNT}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={refetch}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconWrap}>
                            <Icon name="images-outline" size={36} color={colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>No moments yet</Text>
                        <Text style={styles.emptyText}>
                            {staffMode ? 'Upload a photo to share with classes.' : 'Photos will appear here when uploaded.'}
                        </Text>
                    </View>
                }
            />

            {/* Image Preview Modal */}
            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalBackground}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setSelectedImage(null)}
                    >
                        <Icon name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image
                            source={{
                                uri: getMediaUrl(selectedImage),
                                ...(getImageHeaders() && { headers: getImageHeaders() })
                            }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>

            {staffMode && (
                <TouchableOpacity style={styles.fab} onPress={() => setUploadOpen(true)} activeOpacity={0.85}>
                    <Icon name="cloud-upload-outline" size={24} color="#fff" />
                </TouchableOpacity>
            )}

            <Modal
                visible={uploadOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setUploadOpen(false)}
            >
                <View style={styles.uploadOverlay}>
                    <View style={styles.uploadCard}>
                        <Text style={styles.uploadTitle}>Upload photo</Text>
                        <Text style={styles.uploadHint}>JPG, PNG, WEBP, HEIC, GIF, BMP and other photos are accepted.</Text>
                        <TextInput
                            style={styles.uploadInput}
                            placeholder="Title"
                            placeholderTextColor={colors.textMuted}
                            value={title}
                            onChangeText={setTitle}
                        />
                        <TextInput
                            style={styles.uploadInput}
                            placeholder="Description (optional)"
                            placeholderTextColor={colors.textMuted}
                            value={description}
                            onChangeText={setDescription}
                        />
                        <View style={{ height: 8 }} />
                        <CustomDropdown
                            value={classId}
                            onValueChange={setClassId}
                            items={[{ label: 'All classes', value: '0' }, ...classItems]}
                            placeholder="Class"
                        />
                        <View style={{ height: 8 }} />
                        <CustomDropdown
                            value={sectionId}
                            onValueChange={setSectionId}
                            items={[{ label: 'All sections', value: '0' }, ...sectionItems]}
                            placeholder="Section"
                        />
                        <TouchableOpacity style={styles.pickBtn} onPress={pickImage} activeOpacity={0.8}>
                            <Icon name="image-outline" size={18} color={colors.primary} />
                            <Text style={styles.pickText}>{picked ? picked.name : 'Choose image'}</Text>
                        </TouchableOpacity>
                        <View style={styles.uploadActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setUploadOpen(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.sendBtn}
                                onPress={handleUpload}
                                disabled={uploadMutation.isPending}
                            >
                                {uploadMutation.isPending ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.sendText}>Upload</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        padding: 15,
        paddingBottom: 88,
    },
    card: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH * 1.2,
        margin: 7.5,
        borderRadius: radii.lg,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        elevation: 3,
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        paddingTop: 30,
    },
    itemTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
    itemDate: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: colors.textMuted,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        paddingHorizontal: space.lg,
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
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    emptyText: {
        marginTop: 6,
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: '600',
        textAlign: 'center',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 25,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 25,
        padding: 5,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 28,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
    },
    uploadOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    uploadCard: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
        padding: 20,
        paddingBottom: 32,
    },
    uploadTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    uploadHint: {
        color: colors.textMuted,
        fontWeight: '600',
        marginTop: 4,
        marginBottom: 14,
        fontSize: 13,
    },
    uploadInput: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radii.md,
        padding: 12,
        marginBottom: 10,
        color: colors.text,
        backgroundColor: colors.background,
        fontWeight: '600',
    },
    pickBtn: {
        marginTop: 10,
        backgroundColor: colors.primarySoft,
        borderRadius: radii.md,
        padding: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    pickText: { fontWeight: '700', color: colors.primary },
    uploadActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    cancelText: { fontWeight: '800', color: colors.textMuted },
    sendBtn: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: radii.md,
        paddingVertical: 12,
        alignItems: 'center',
    },
    sendText: { color: '#fff', fontWeight: '800' },
});

export default GalleryScreen;
