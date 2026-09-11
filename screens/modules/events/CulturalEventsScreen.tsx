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
import { useCulturalEvents } from '../../../hooks/useEvents';
import { CulturalEvent } from '../../../types/events.type';

const CulturalEventsScreen = () => {
    const { data: culturals, isLoading, isFetching, refetch } = useCulturalEvents();

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [])
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case '1':
                return { label: 'Active', color: '#22c55e', bg: '#dcfce7', icon: 'checkmark-circle' };
            case '0':
                return { label: 'Inactive', color: '#ef4444', bg: '#fee2e2', icon: 'close-circle' };
            default:
                return { label: 'Pending', color: '#f59e0b', bg: '#fef3c7', icon: 'time' };
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    const renderItem = ({ item, index }: { item: CulturalEvent; index: number }) => {
        const statusBadge = getStatusBadge(item.cultural_status || item.cutural_status);

        return (
            <TouchableOpacity style={styles.card} activeOpacity={0.9}>
                <LinearGradient
                    colors={['#fdf2f8', '#fce7f3']}
                    style={styles.cardBackground}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={['#ec4899', '#db2777']}
                                style={styles.iconCircle}
                            >
                                <Icon name="musical-notes" size={26} color="#fff" />
                            </LinearGradient>
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.culturalName} numberOfLines={2}>
                                {item.cultural_name}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: statusBadge.bg },
                            ]}
                        >
                            <Icon
                                name={statusBadge.icon as any}
                                size={14}
                                color={statusBadge.color}
                            />
                            <Text
                                style={[styles.statusText, { color: statusBadge.color }]}
                            >
                                {statusBadge.label}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.dateSection}>
                        <View style={styles.dateContainer}>
                            <View style={styles.dateIcon}>
                                <Icon name="calendar" size={20} color="#ec4899" />
                            </View>
                            <View>
                                <Text style={styles.dateLabel}>Event Date</Text>
                                <Text style={styles.dateValue}>
                                    {formatDate(item.cultural_date)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inchargeSection}>
                        <View style={styles.inchargeIcon}>
                            <Icon name="person" size={18} color="#fff" />
                        </View>
                        <View style={styles.inchargeInfo}>
                            <Text style={styles.inchargeLabel}>Event In-charge</Text>
                            <Text style={styles.inchargeName}>{item.incharge_name}</Text>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.idBadge}>
                            <Icon name="pricetag" size={12} color="#64748b" />
                            <Text style={styles.idText}>ID: {item.cultural_id}</Text>
                        </View>
                        {/* <View style={styles.viewMore}>
                            <Text style={styles.viewMoreText}>View Details</Text>
                            <Icon name="arrow-forward" size={14} color="#ec4899" />
                        </View> */}
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ec4899" />
                <Text style={styles.loadingText}>Loading Cultural Events...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ModuleHeader
                title="Cultural Events"
                subtitle="Celebrations, festivals & cultural activities"
                actionIcon="musical-notes-outline"
                onActionPress={() => { }}
            />

            <FlatList
                data={culturals}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.cultural_id}-${index}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={refetch}
                        tintColor="#ec4899"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="musical-notes-outline" size={80} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No cultural events found.</Text>
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
        borderRadius: 24,
        marginBottom: 18,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    cardBackground: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    iconContainer: {
        marginRight: 14,
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
    culturalName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        lineHeight: 24,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    dateSection: {
        marginBottom: 15,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 14,
        gap: 12,
    },
    dateIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#fce7f3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
        marginBottom: 2,
    },
    dateValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(236, 72, 153, 0.15)',
        marginBottom: 15,
    },
    inchargeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 12,
    },
    inchargeIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#ec4899',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inchargeInfo: {
        flex: 1,
    },
    inchargeLabel: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
        marginBottom: 2,
    },
    inchargeName: {
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    idBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 5,
    },
    idText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    viewMore: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewMoreText: {
        fontSize: 13,
        color: '#ec4899',
        fontWeight: '700',
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

export default CulturalEventsScreen;
