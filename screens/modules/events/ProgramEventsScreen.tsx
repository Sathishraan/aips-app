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
import { useProgramEvents } from '../../../hooks/useEvents';
import { ProgramEvent } from '../../../types/events.type';

const ProgramEventsScreen = () => {
    const { data: programs, isLoading, isFetching, refetch } = useProgramEvents();

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [])
    );

    const getPrizeBadge = (prize: string) => {
        switch (prize) {
            case '1':
                return { label: '🥇 First Prize', color: '#f59e0b', bg: '#fef3c7' };
            case '2':
                return { label: '🥈 Second Prize', color: '#64748b', bg: '#f1f5f9' };
            case '3':
                return { label: '🥉 Third Prize', color: '#cd7f32', bg: '#fef3c7' };
            default:
                return { label: '⭐ Participated', color: '#8b5cf6', bg: '#ede9fe' };
        }
    };

    const renderItem = ({ item, index }: { item: ProgramEvent; index: number }) => {
        const prizeBadge = getPrizeBadge(item.prize);

        return (
            <TouchableOpacity style={styles.card} activeOpacity={0.9}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['#8b5cf6', '#7c3aed']}
                            style={styles.iconCircle}
                        >
                            <Icon name="calendar" size={24} color="#fff" />
                        </LinearGradient>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.programName} numberOfLines={1}>
                            {item.program_name}
                        </Text>
                        <View style={styles.culturalBadge}>
                            <Icon name="sparkles" size={12} color="#8b5cf6" />
                            <Text style={styles.culturalName}>{item.cultural_name}</Text>
                        </View>
                    </View>
                </View>

                <View
                    style={[styles.prizeBadge, { backgroundColor: prizeBadge.bg }]}
                >
                    <Text style={[styles.prizeText, { color: prizeBadge.color }]}>
                        {prizeBadge.label}
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                        <View style={styles.detailIcon}>
                            <Icon name="location" size={16} color="#8b5cf6" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>Venue</Text>
                            <Text style={styles.detailValue}>{item.venue}</Text>
                        </View>
                    </View>
                    <View style={styles.detailItem}>
                        <View style={styles.detailIcon}>
                            <Icon name="calendar-outline" size={16} color="#8b5cf6" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>Date</Text>
                            <Text style={styles.detailValue}>{item.held_date}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <View style={styles.infoBadge}>
                        <Icon name="school-outline" size={14} color="#ec4899" />
                        <Text style={styles.infoBadgeText}>{item.student_class}</Text>
                    </View>
                    {item.student_section && (
                        <View style={styles.infoBadge}>
                            <Icon name="layers-outline" size={14} color="#3b82f6" />
                            <Text style={styles.infoBadgeText}>{item.student_section}</Text>
                        </View>
                    )}
                    <View style={styles.infoBadge}>
                        <Icon name="time-outline" size={14} color="#22c55e" />
                            <Text style={styles.infoBadgeText}>{item.academic_year || item.acadamic_year}</Text>
                    </View>
                </View>

                {item.students_name && (
                    <View style={styles.participantsSection}>
                        <View style={styles.participantsHeader}>
                            <Icon name="people" size={16} color="#7c3aed" />
                            <Text style={styles.participantsTitle}>Participants</Text>
                        </View>
                        <Text style={styles.participantsText} numberOfLines={4}>
                            {item.students_name}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.loadingText}>Loading Programs...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ModuleHeader
                title="Programs"
                subtitle="🎭 Special Programs & Ceremonies"
                actionIcon="calendar-outline"
                onActionPress={() => { }}
            />

            <FlatList
                data={programs}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.program_id}-${index}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={refetch}
                        tintColor="#8b5cf6"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="calendar-outline" size={80} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No programs found.</Text>
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
    programName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 4,
    },
    culturalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    culturalName: {
        fontSize: 13,
        color: '#8b5cf6',
        fontWeight: '600',
    },
    prizeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 12,
    },
    prizeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 15,
    },
    detailsGrid: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 15,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    detailIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#ede9fe',
        justifyContent: 'center',
        alignItems: 'center',
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
    infoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 15,
    },
    infoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 5,
    },
    infoBadgeText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '600',
    },
    participantsSection: {
        backgroundColor: '#faf5ff',
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
        color: '#6b21a8',
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

export default ProgramEventsScreen;
