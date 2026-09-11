import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import { useNotifications, Notification } from '../../hooks/useNotifications';
import { useLinkedStudents } from '../../hooks/useLinkedStudents';
import { openNotificationForStudent } from '../../utils/notification.utils';

const NotificationsScreen = () => {
    const { data: notifications = [], isLoading, isFetching, refetch } = useNotifications();
    const { selectedName } = useLinkedStudents();

    const renderItem = ({ item }: { item: Notification }) => {
        let iconName = 'notifications';
        let iconColor = '#5a6898';
        let bgOpacity = '#eef0f8';

        switch (item.type) {
            case 'homework':
                iconName = 'book-outline';
                iconColor = '#3b82f6';
                bgOpacity = '#eff6ff';
                break;
            case 'circular':
                iconName = 'document-text-outline';
                iconColor = '#ef4444';
                bgOpacity = '#fef2f2';
                break;
            case 'event':
                iconName = 'calendar-outline';
                iconColor = '#10b981';
                bgOpacity = '#f0fdf4';
                break;
            case 'fee':
                iconName = 'card-outline';
                iconColor = '#f59e0b';
                bgOpacity = '#fffbeb';
                break;
            case 'attendance':
                iconName = /absent/i.test(`${item.title} ${item.message}`) ? 'close-circle' : 'time';
                iconColor = /absent/i.test(`${item.title} ${item.message}`) ? '#ef4444' : '#8b5cf6';
                bgOpacity = /absent/i.test(`${item.title} ${item.message}`) ? '#fef2f2' : '#f5f3ff';
                break;
        }

        return (
            <TouchableOpacity
                style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
                onPress={() =>
                    openNotificationForStudent({
                        type: item.type,
                        studentId: item.studentId,
                        homeworkId: item.homeworkId,
                        title: item.title,
                        body: item.message,
                    })
                }
            >
                <View style={[styles.iconContainer, { backgroundColor: bgOpacity }]}>
                    <Icon name={iconName as any} size={24} color={iconColor} />
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                        {!item.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.message}>{item.message}</Text>
                    {item.studentName ? <Text style={styles.studentChip}>{item.studentName}</Text> : null}
                    {item.time ? <Text style={styles.time}>{item.time}</Text> : null}
                </View>

                <TouchableOpacity style={styles.moreBtn}>
                    <Icon name="ellipsis-horizontal" size={20} color="#cbd5e1" />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <ModuleHeader
                title="Activity"
                subtitle={selectedName ? `🔔 ${selectedName}` : '🔔 Latest Updates'}
                actionIcon="settings-outline"
                onActionPress={() => { }}
            />

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#5a6898" />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching}
                            onRefresh={refetch}
                            tintColor="#5a6898"
                            colors={['#5a6898']}
                        />
                    }
                    ListHeaderComponent={() => (
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Notifications</Text>
                            <TouchableOpacity>
                                <Text style={styles.markAllRead}>Mark all as read</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Icon name="notifications-off-outline" size={48} color="#94a3b8" />
                            <Text style={styles.emptyText}>No notifications found</Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    listContent: {
        paddingTop: 10,
        paddingBottom: 30,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
    },
    markAllRead: {
        fontSize: 13,
        color: '#5a6898',
        fontWeight: '700',
    },
    notificationCard: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    unreadCard: {
        backgroundColor: '#fffaf5',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    contentContainer: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
        flex: 1,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#5a6898',
        marginLeft: 10,
    },
    message: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
        marginBottom: 6,
    },
    studentChip: {
        fontSize: 11,
        fontWeight: '700',
        color: '#424e79',
        marginBottom: 4,
    },
    time: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
    },
    moreBtn: {
        padding: 5,
        marginLeft: 10,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 12,
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default NotificationsScreen;
