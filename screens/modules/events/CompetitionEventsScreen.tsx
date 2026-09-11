import React, { useCallback } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../../components/common/ModuleHeader';
import { useCompetitionEvents } from '../../../hooks/useEvents';
import { CompetitionEvent } from '../../../types/events.type';

const CompetitionEventsScreen = () => {
    const { data: competitions, isLoading, isFetching, refetch } = useCompetitionEvents();

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [])
    );

    const getResultBadge = (result: string) => {
        switch (result) {
            case '1':
                return { label: 'Winner', color: '#22c55e', bg: '#dcfce7', icon: 'medal' };
            case '2':
                return { label: 'Runner Up', color: '#3b82f6', bg: '#dbeafe', icon: 'ribbon' };
            case '3':
                return { label: '2nd Runner Up', color: '#f59e0b', bg: '#fef3c7', icon: 'star' };
            default:
                return { label: 'Participated', color: '#64748b', bg: '#f1f5f9', icon: 'checkmark-circle' };
        }
    };

    const getPrizeBadge = (prize: string) => {
        const prizeMap: { [key: string]: { label: string; color: string } } = {
            level1: { label: '🥇 Gold', color: '#f59e0b' },
            level2: { label: '🥈 Silver', color: '#94a3b8' },
            level3: { label: '🥉 Bronze', color: '#cd7f32' },
        };
        return prizeMap[prize?.toLowerCase()] || { label: prize, color: '#64748b' };
    };

    const renderItem = ({ item, index }: { item: CompetitionEvent; index: number }) => {
        const resultBadge = getResultBadge(item.result);
        const prizeBadge = getPrizeBadge(item.prize);

        return (
            <TouchableOpacity style={styles.card} activeOpacity={0.9}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['#f59e0b', '#d97706']}
                            style={styles.iconCircle}
                        >
                            <Icon name="trophy" size={24} color="#fff" />
                        </LinearGradient>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.competitionName} numberOfLines={2}>
                            {item.competition_name || item.competetion_name}
                        </Text>
                    </View>
                </View>

                <View style={styles.badgesRow}>
                    <View
                        style={[styles.resultBadge, { backgroundColor: resultBadge.bg }]}
                    >
                        <Icon
                            name={resultBadge.icon as any}
                            size={14}
                            color={resultBadge.color}
                        />
                        <Text style={[styles.resultText, { color: resultBadge.color }]}>
                            {resultBadge.label}
                        </Text>
                    </View>
                    <View style={styles.prizeBadge}>
                        <Text style={[styles.prizeText, { color: prizeBadge.color }]}>
                            {prizeBadge.label}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                        <Icon name="location-outline" size={16} color="#f59e0b" />
                        <View>
                            <Text style={styles.detailLabel}>Venue</Text>
                            <Text style={styles.detailValue}>{item.venue}</Text>
                        </View>
                    </View>
                    <View style={styles.detailItem}>
                        <Icon name="calendar-outline" size={16} color="#f59e0b" />
                        <View>
                            <Text style={styles.detailLabel}>Date</Text>
                            <Text style={styles.detailValue}>{item.held_date}</Text>
                        </View>
                    </View>
                    <View style={styles.detailItem}>
                        <Icon name="business-outline" size={16} color="#f59e0b" />
                        <View>
                            <Text style={styles.detailLabel}>Conducted By</Text>
                            <Text style={styles.detailValue}>{item.conducted_by}</Text>
                        </View>
                    </View>
                    <View style={styles.detailItem}>
                        <Icon name="school-outline" size={16} color="#f59e0b" />
                        <View>
                            <Text style={styles.detailLabel}>Class</Text>
                            <Text style={styles.detailValue}>
                                {item.std_class} - {item.std_section}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.yearBadge}>
                    <Icon name="time-outline" size={14} color="#8b5cf6" />
                    <Text style={styles.yearText}>Academic Year: {item.academic_year || item.acadamic_year}</Text>
                </View>

                {item.participate_student && (
                    <View style={styles.participantsSection}>
                        <View style={styles.participantsHeader}>
                            <Icon name="people" size={16} color="#d97706" />
                            <Text style={styles.participantsTitle}>Participants</Text>
                        </View>
                        <Text style={styles.participantsText} numberOfLines={3}>
                            {item.participate_student}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#f59e0b" />
                <Text style={styles.loadingText}>Loading Competitions...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ModuleHeader
                title="Competitions"
                subtitle="Academic & skill-based contests"
                actionIcon="trophy-outline"
                onActionPress={() => { }}
            />

            <FlatList
                data={competitions}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.competetion_id}-${index}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={refetch}
                        tintColor="#f59e0b"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="trophy-outline" size={80} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No competitions found.</Text>
                        <Text style={styles.emptySubtext}>
                            Check back later for updates.
                        </Text>
                    </View>
                }
            />
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
        borderRadius: 20,
        padding: 18,
        marginBottom: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        marginRight: 12,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
    },
    competitionName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    resultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 5,
    },
    resultText: {
        fontSize: 12,
        fontWeight: '700',
    },
    prizeBadge: {
        backgroundColor: '#fffbeb',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    prizeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 15,
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
    },
    detailItem: {
        width: '47%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    detailLabel: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '700',
    },
    yearBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f3ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    yearText: {
        fontSize: 12,
        color: '#7c3aed',
        fontWeight: '600',
    },
    participantsSection: {
        backgroundColor: '#fffbeb',
        borderRadius: 12,
        padding: 12,
    },
    participantsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    participantsTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#92400e',
    },
    participantsText: {
        fontSize: 12,
        color: '#475569',
        lineHeight: 18,
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
});

export default CompetitionEventsScreen;
