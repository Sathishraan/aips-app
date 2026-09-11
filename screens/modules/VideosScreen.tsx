import React, { useState, useEffect, useRef } from 'react';
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
    Platform,
    RefreshControl,
    Linking,
    Animated,
    Alert,
    ScrollView,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { getExpoAv } from '../../utils/expoAv';
import { WebView } from 'react-native-webview';
import ModuleHeader from '../../components/common/ModuleHeader';
import { useVideos } from '../../hooks/useVideos';
import { Video } from '../../types/videos.type';

const { width } = Dimensions.get('window');

const VideosScreen = () => {
    const { data: videos, isLoading, isError, refetch, isFetching } = useVideos();
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

    const slideAnim = useRef(new Animated.Value(20)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        console.log('📺 [VideosScreen] Component Mounted');
    }, []);

    useEffect(() => {
        if (!isLoading) {
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
        }
    }, [isLoading]);

    const getYoutubeId = (url: string): string | null => {
        if (!url) return null;
        // Clean any token/auth params or trailing query parameters
        const cleanUrl = url.trim().split('?token=')[0].split('&token=')[0].split('?auth=')[0].split('&auth=')[0];
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = cleanUrl.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const isDirectVideoUrl = (url: string): boolean => {
        if (!url) return false;
        const cleanUrl = url.split('?')[0].toLowerCase();
        return (
            cleanUrl.endsWith('.mp4') ||
            cleanUrl.endsWith('.m3u8') ||
            cleanUrl.endsWith('.mov') ||
            cleanUrl.endsWith('.webm') ||
            cleanUrl.endsWith('.avi') ||
            cleanUrl.endsWith('.m4v') ||
            cleanUrl.includes('/uploads/') ||
            cleanUrl.includes('/videos/')
        );
    };

    const getThumbnail = (url: string, rawThumbnail?: string) => {
        if (rawThumbnail) return rawThumbnail;
        const youtubeId = getYoutubeId(url);
        return youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null;
    };

    const handlePlay = (video: Video) => {
        if (!video.video_url) {
            Alert.alert('Error', 'Video link is missing or invalid.');
            return;
        }

        console.log('📺 [VideosScreen] Opening In-App Video:', video.video_url);
        setSelectedVideo(video);
    };

    const openExternal = (url: string) => {
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Could not open video link externally.');
        });
    };

    const renderItem = ({ item, index }: { item: Video; index: number }) => {
        const youtubeId = getYoutubeId(item.video_url);
        const isDirect = isDirectVideoUrl(item.video_url);
        const thumb = getThumbnail(item.video_url, item.thumbnail);

        return (
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                }}
            >
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => handlePlay(item)}
                    activeOpacity={0.9}
                >
                    <View style={styles.thumbContainer}>
                        {thumb ? (
                            <Image
                                source={{ uri: thumb }}
                                style={styles.thumbnail}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={[styles.thumbnail, styles.placeholderThumb]}>
                                <Icon name="videocam" size={48} color="#cbd5e1" />
                            </View>
                        )}
                        <View style={styles.playOverlay}>
                            <View style={styles.playButtonCircle}>
                                <Icon name="play" size={36} color="#fff" style={{ marginLeft: 4 }} />
                            </View>
                        </View>
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.7)']}
                            style={styles.thumbFooter}
                        >
                            <View style={styles.videoBadge}>
                                <Icon
                                    name={youtubeId ? 'logo-youtube' : isDirect ? 'film-outline' : 'globe-outline'}
                                    size={14}
                                    color={youtubeId ? '#ff0000' : '#5a6898'}
                                />
                                <Text style={styles.badgeText}>
                                    {youtubeId ? 'YouTube' : isDirect ? 'MP4 Video' : 'In-App Player'}
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.videoTitle} numberOfLines={2}>
                            {item.title}
                        </Text>
                        {!!item.description && (
                            <Text style={styles.videoDesc} numberOfLines={2}>
                                {item.description}
                            </Text>
                        )}
                        <View style={styles.cardFooter}>
                            <View style={styles.footerItem}>
                                <Icon name="calendar-outline" size={14} color="#94a3b8" />
                                <Text style={styles.footerText}>
                                    {item.created_at || 'Academic Content'}
                                </Text>
                            </View>
                            <View style={styles.watchNow}>
                                <Text style={styles.watchNowText}>Watch In-App</Text>
                                <Icon name="play-circle" size={16} color="#5a6898" />
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderPlayer = () => {
        if (!selectedVideo) return null;
        const youtubeId = getYoutubeId(selectedVideo.video_url);
        const isDirect = isDirectVideoUrl(selectedVideo.video_url);

        if (youtubeId) {
            return (
                <YoutubePlayer
                    height={(width * 9) / 16}
                    play={true}
                    videoId={youtubeId}
                    webViewProps={{
                        allowsInlineMediaPlayback: true,
                        androidLayerType: 'hardware',
                    }}
                />
            );
        }

        if (isDirect) {
            const av = getExpoAv();
            const ExpoVideo = av?.Video;
            const contain = av?.ResizeMode?.CONTAIN ?? 'contain';
            if (ExpoVideo) {
                return (
                    <ExpoVideo
                        source={{ uri: selectedVideo.video_url }}
                        style={styles.playerStream}
                        useNativeControls
                        resizeMode={contain}
                        shouldPlay
                        isLooping={false}
                    />
                );
            }
            return (
                <WebView
                    source={{ uri: selectedVideo.video_url }}
                    style={styles.playerStream}
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    renderLoading={() => (
                        <View style={styles.playerLoading}>
                            <ActivityIndicator size="large" color="#5a6898" />
                        </View>
                    )}
                />
            );
        }

        // Fallback for general web embed links
        return (
            <WebView
                source={{ uri: selectedVideo.video_url }}
                style={styles.playerStream}
                allowsInlineMediaPlayback
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                renderLoading={() => (
                    <View style={styles.playerLoading}>
                        <ActivityIndicator size="large" color="#5a6898" />
                    </View>
                )}
            />
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5a6898" />
                <Text style={styles.loadingText}>Loading Educational Gallery...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.loadingContainer}>
                <Icon name="alert-circle-outline" size={50} color="#ef4444" />
                <Text style={[styles.loadingText, { color: '#ef4444' }]}>Failed to load videos</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ModuleHeader
                title="Videos"
                subtitle="🎥 Educational Lessons"
                actionIcon="refresh-outline"
                onActionPress={() => refetch()}
            />

            <FlatList
                data={videos}
                renderItem={renderItem}
                keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={refetch}
                        tintColor="#5a6898"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="videocam-off-outline" size={80} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No videos available yet.</Text>
                        <Text style={styles.emptySubtext}>
                            Check back later for new educational content!
                        </Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                            <Text style={styles.retryButtonText}>Refresh List</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* In-App Video Player Modal */}
            <Modal
                visible={!!selectedVideo}
                transparent={true}
                animationType="slide"
                statusBarTranslucent
                onRequestClose={() => setSelectedVideo(null)}
            >
                <View style={styles.modalOverlay}>
                    <SafeAreaView style={styles.modalSafeArea}>
                        {/* Header Bar */}
                        <View style={styles.modalHeader}>
                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setSelectedVideo(null)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Icon name="chevron-down-circle" size={34} color="#fff" />
                            </TouchableOpacity>

                            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                                {selectedVideo?.title || 'Playing Video'}
                            </Text>

                            {selectedVideo?.video_url ? (
                                <TouchableOpacity
                                    style={styles.externalBtn}
                                    onPress={() => openExternal(selectedVideo.video_url)}
                                >
                                    <Icon name="open-outline" size={22} color="#cbd5e1" />
                                </TouchableOpacity>
                            ) : (
                                <View style={{ width: 34 }} />
                            )}
                        </View>

                        {/* Player Container */}
                        <View style={styles.playerContainer}>
                            {renderPlayer()}
                        </View>

                        {/* Video Info Card */}
                        <ScrollView style={styles.videoDetailsScroll} showsVerticalScrollIndicator={false}>
                            <View style={styles.videoDetailsContent}>
                                <Text style={styles.modalVideoTitle}>
                                    {selectedVideo?.title}
                                </Text>

                                <View style={styles.modalMetaRow}>
                                    <View style={styles.metaBadge}>
                                        <Icon name="time-outline" size={14} color="#5a6898" />
                                        <Text style={styles.metaBadgeText}>
                                            {selectedVideo?.created_at || 'Academic Video'}
                                        </Text>
                                    </View>
                                    <View style={[styles.metaBadge, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                        <Icon name="play-circle-outline" size={14} color="#38bdf8" />
                                        <Text style={[styles.metaBadgeText, { color: '#38bdf8' }]}>
                                            In-App Playback
                                        </Text>
                                    </View>
                                </View>

                                {!!selectedVideo?.description && (
                                    <View style={styles.descriptionCard}>
                                        <Text style={styles.descriptionHeader}>Description</Text>
                                        <Text style={styles.descriptionText}>
                                            {selectedVideo.description}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },

    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
    },
    thumbContainer: {
        height: 200,
        width: '100%',
        backgroundColor: '#0f172a',
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    placeholderThumb: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e293b',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    playButtonCircle: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: 'rgba(249, 115, 22, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    thumbFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
        paddingTop: 24,
    },
    videoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        alignSelf: 'flex-end',
        gap: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1e293b',
    },
    cardInfo: {
        padding: 18,
    },
    videoTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 6,
        lineHeight: 22,
    },
    videoDesc: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 15,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
    },
    watchNow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#eef0f8',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    watchNowText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#5a6898',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#64748b',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#475569',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    retryButton: {
        marginTop: 25,
        backgroundColor: '#5a6898',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: '#090d16',
    },
    modalSafeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    closeBtn: {
        padding: 4,
    },
    modalHeaderTitle: {
        flex: 1,
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginHorizontal: 12,
    },
    externalBtn: {
        padding: 6,
    },
    playerContainer: {
        width: '100%',
        height: (width * 9) / 16,
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    playerStream: {
        width: '100%',
        height: '100%',
    },
    playerLoading: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    videoDetailsScroll: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    videoDetailsContent: {
        padding: 20,
    },
    modalVideoTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#f8fafc',
        lineHeight: 28,
        marginBottom: 12,
    },
    modalMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(249, 115, 22, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    metaBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#5a6898',
    },
    descriptionCard: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    descriptionHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94a3b8',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    descriptionText: {
        fontSize: 15,
        color: '#cbd5e1',
        lineHeight: 24,
    },
});

export default VideosScreen;
