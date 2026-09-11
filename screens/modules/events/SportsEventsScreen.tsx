import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    RefreshControl,
    Modal,
    Pressable,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../../components/common/ModuleHeader';
import { useSportsEvents } from '../../../hooks/useEvents';
import { SportsEvent } from '../../../types/events.type';

const SportsEventsScreen = () => {
    const { data: sports, isLoading, isFetching, refetch } = useSportsEvents();

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [])
    );
    const [selectedEvent, setSelectedEvent] = useState<SportsEvent | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleCardPress = (event: SportsEvent) => {
        setSelectedEvent(event);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setSelectedEvent(null);
    };

    const getResultBadge = (result: string) => {
        switch (result) {
            case '1':
                return { label: 'Participated', color: '#64748b', bg: '#f1f5f9', icon: 'walk-outline' };
            case '2':
                return { label: 'Runner', color: '#3b82f6', bg: '#dbeafe', icon: 'ribbon-outline' };
            case '3':
                return { label: 'Winner', color: '#22c55e', bg: '#dcfce7', icon: 'trophy-outline' };
            default:
                return { label: 'Participated', color: '#64748b', bg: '#f1f5f9', icon: 'walk-outline' };
        }
    };

    const renderItem = ({ item, index }: { item: SportsEvent; index: number }) => {
        const resultBadge = getResultBadge(item.result);

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => handleCardPress(item)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['#22c55e', '#16a34a']}
                            style={styles.iconCircle}
                        >
                            <Icon name="football" size={28} color="#fff" />
                        </LinearGradient>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.tournamentName} numberOfLines={2}>
                            {item.tournament_name || item.tournment_name}
                        </Text>
                        <View style={styles.cardBadgeRow}>
                            <View style={[styles.resultBadge, { backgroundColor: resultBadge.bg }]}>
                                <Icon name={resultBadge.icon as any} size={12} color={resultBadge.color} style={{ marginRight: 4 }} />
                                <Text style={[styles.resultText, { color: resultBadge.color }]}>
                                    {resultBadge.label}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.sportName}>{item.sport_name}</Text>

                    <View style={styles.cardDetailsGrid}>
                        <View style={styles.cardDetailItem}>
                            <Icon name="location-outline" size={14} color="#22c55e" />
                            <Text style={styles.cardDetailText} numberOfLines={1}>{item.venue}</Text>
                        </View>
                        <View style={styles.cardDetailItem}>
                            <Icon name="calendar-outline" size={14} color="#22c55e" />
                            <Text style={styles.cardDetailText}>{item.held_date}</Text>
                        </View>
                        <View style={styles.cardDetailItem}>
                            <Icon name="bookmark-outline" size={14} color="#22c55e" />
                            <Text style={styles.cardDetailText}>{item.tournament_type || item.tournment_type}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.viewDetailsText}>Tap for full details</Text>
                    <Icon name="chevron-forward" size={16} color="#22c55e" />
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.loadingText}>Loading Sports Events...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ModuleHeader
                title="Sports Events"
                subtitle="🏅 Tournaments & Competitions"
                actionIcon="trophy-outline"
                onActionPress={() => { }}
            />

            <FlatList
                data={sports}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.sport_id}-${index}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={refetch}
                        tintColor="#22c55e"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="football-outline" size={80} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No sports events found.</Text>
                        <Text style={styles.emptySubtext}>
                            Check back later for updates.
                        </Text>
                    </View>
                }
            />

            {/* Detail Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={closeModal} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalCloseBar}>
                            <View style={styles.modalHandle} />
                        </View>

                        {selectedEvent && (
                            <ScrollView
                                style={styles.modalScrollView}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.modalScrollContent}
                            >
                                <View style={styles.modalHeader}>
                                    <View style={styles.modalIconContainer}>
                                        <LinearGradient
                                            colors={['#22c55e', '#16a34a']}
                                            style={styles.modalIconCircle}
                                        >
                                            <Icon name="football" size={32} color="#fff" />
                                        </LinearGradient>
                                    </View>
                                    <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                                        <Icon name="close" size={24} color="#64748b" />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.modalTournamentName}>{selectedEvent.tournament_name || selectedEvent.tournment_name}</Text>
                                <Text style={styles.modalSportName}>{selectedEvent.sport_name}</Text>

                                <View style={styles.modalBadgeRow}>
                                    <View style={[styles.resultBadge, { backgroundColor: getResultBadge(selectedEvent.result).bg }]}>
                                        <Icon
                                            name={getResultBadge(selectedEvent.result).icon as any}
                                            size={14}
                                            color={getResultBadge(selectedEvent.result).color}
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text style={[styles.resultText, { color: getResultBadge(selectedEvent.result).color }]}>
                                            {getResultBadge(selectedEvent.result).label}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.modalDivider} />

                                <View style={styles.modalDetailsGrid}>
                                    <View style={styles.modalDetailItem}>
                                        <Icon name="location-outline" size={18} color="#22c55e" />
                                        <View>
                                            <Text style={styles.modalDetailLabel}>Venue</Text>
                                            <Text style={styles.modalDetailValue}>{selectedEvent.venue}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.modalDetailItem}>
                                        <Icon name="calendar-outline" size={18} color="#22c55e" />
                                        <View>
                                            <Text style={styles.modalDetailLabel}>Date</Text>
                                            <Text style={styles.modalDetailValue}>{selectedEvent.held_date}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.modalDetailItem}>
                                        <Icon name="bookmark-outline" size={18} color="#22c55e" />
                                        <View>
                                            <Text style={styles.modalDetailLabel}>Type</Text>
                                            <Text style={styles.modalDetailValue}>{selectedEvent.tournament_type || selectedEvent.tournment_type}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.modalDetailItem}>
                                        <Icon name="school-outline" size={18} color="#22c55e" />
                                        <View>
                                            <Text style={styles.modalDetailLabel}>Conducted by</Text>
                                            <Text style={styles.modalDetailValue}>{selectedEvent.tournament_conduct || selectedEvent.tourment_conduct}</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalInfoRow}>
                                    <View style={styles.modalInfoBadge}>
                                        <Icon name="people-outline" size={14} color="#8b5cf6" />
                                        <Text style={styles.modalInfoBadgeText}>{selectedEvent.sport_type}</Text>
                                    </View>
                                    <View style={styles.modalInfoBadge}>
                                        <Icon name="business-outline" size={14} color="#f59e0b" />
                                        <Text style={styles.modalInfoBadgeText}>
                                            {selectedEvent.class} - {selectedEvent.section}
                                        </Text>
                                    </View>
                                    <View style={styles.modalInfoBadge}>
                                        <Icon name="calendar" size={14} color="#ec4899" />
                                        <Text style={styles.modalInfoBadgeText}>{selectedEvent.academic_year}</Text>
                                    </View>
                                </View>

                                {selectedEvent.participant_student && (
                                    <View style={styles.modalParticipantsHeader}>
                                        <Icon name="people" size={18} color="#22c55e" />
                                        <Text style={styles.modalParticipantsTitle}>Participants</Text>
                                    </View>
                                )}
                                {selectedEvent.participant_student && (
                                    <View style={styles.modalParticipantsContainer}>
                                        <Text style={styles.modalParticipantsText}>
                                            {selectedEvent.participant_student}
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                    </View>
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
    badgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 18,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    iconContainer: {
        marginRight: 15,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
    },
    tournamentName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
        lineHeight: 24,
        marginBottom: 6,
    },
    cardBadgeRow: {
        flexDirection: 'row',
    },
    cardContent: {
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
    },
    sportName: {
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '800',
        marginBottom: 12,
    },
    cardDetailsGrid: {
        gap: 8,
    },
    cardDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardDetailText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
    },
    viewDetailsText: {
        fontSize: 12,
        color: '#22c55e',
        fontWeight: '700',
    },
    resultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    resultText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
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
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 20,
        fontSize: 18,
        color: '#94a3b8',
        fontWeight: '700',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#cbd5e1',
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        height: '92%',
        width: '100%',
        elevation: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    modalCloseBar: {
        height: 30,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#e2e8f0',
    },
    modalScrollView: {
        flex: 1,
    },
    modalScrollContent: {
        padding: 24,
        paddingTop: 10,
        paddingBottom: 50,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    modalIconContainer: {
        elevation: 8,
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    modalIconCircle: {
        width: 65,
        height: 65,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    modalTournamentName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1e293b',
        lineHeight: 32,
        marginBottom: 6,
    },
    modalSportName: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 15,
    },
    modalBadgeRow: {
        flexDirection: 'row',
        marginBottom: 25,
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 25,
    },
    modalDetailsGrid: {
        gap: 20,
        marginBottom: 30,
    },
    modalDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        backgroundColor: '#f8fafc',
        padding: 15,
        borderRadius: 18,
    },
    modalDetailLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modalDetailValue: {
        fontSize: 15,
        color: '#334155',
        fontWeight: '800',
    },
    modalInfoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 30,
    },
    modalInfoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    modalInfoBadgeText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '700',
    },
    modalParticipantsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 10,
    },
    modalParticipantsTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#166534',
    },
    modalParticipantsContainer: {
        backgroundColor: '#f0fdf4',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#dcfce7',
    },
    modalParticipantsText: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 24,
        fontWeight: '500',
    },
});

export default SportsEventsScreen;
