import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useChatCache, ChatCacheItem, Message } from '../../hooks/useChatCache';
import BackButton from '../../components/common/BackButton';
import { useUser, isStudent, isPrincipal } from '../../hooks/useUser';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors, radii, space, touch } from '../../theme/appTheme';
import { useRoleColors } from '../../hooks/useRoleColors';

const isPlaceholderName = (name?: string | null) =>
    !name ||
    ['Chat Member', 'Unknown', 'Unknown Sender', 'Staff', 'Communication', 'Student'].includes(name.trim()) ||
    /^EMP\d+$/i.test(name.trim()) ||
    /^\d+$/.test(name.trim());


const isIdentityId = (name?: string | null) => !!name && /^\d+$/.test(name.trim());

const ChatList = ({ navigation }: any) => {
    const { user } = useUser();
    const brand = useRoleColors();
    const userId = (user as any)?.studentId || (user as any)?.employeeId || (user as any)?.adminId || 'anonymous';
    const { chats, isLoaded } = useChatCache(userId);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState<'all' | 'direct' | 'groups'>('all');
    const { horizontalPadding, contentMaxWidth, isTablet, scale, insets } = useResponsiveLayout();

    const counts = useMemo(() => {
        const direct = chats.filter(c => c.type === 'individual').length;
        const groups = chats.filter(c => c.type === 'group').length;
        return { all: chats.length, direct, groups };
    }, [chats]);

    const filteredChats = useMemo(() => {
        let list = chats;
        if (selectedTab === 'direct') {
            list = list.filter(c => c.type === 'individual');
        } else if (selectedTab === 'groups') {
            list = list.filter(c => c.type === 'group');
        }

        if (!searchQuery.trim()) return list;
        const query = searchQuery.toLowerCase();
        return list.filter(chat =>
            chat.name.toLowerCase().includes(query) ||
            chat.lastMessage.toLowerCase().includes(query)
        );
    }, [chats, selectedTab, searchQuery]);

    const renderStatus = (status?: Message['status'], sender?: Message['sender']) => {
        if (!status || sender !== 'user') return null;

        let iconName = 'checkmark';
        let color = '#94a3b8';

        if (status === 'delivered') {
            iconName = 'checkmark-done';
        } else if (status === 'read') {
            iconName = 'checkmark-done';
            color = '#10B981';
        } else if (status === 'pending') {
            iconName = 'time-outline';
        }

        return (
            <Icon name={iconName as any} size={15} color={color} style={{ marginRight: 4 }} />
        );
    };

    const renderBadge = (item: ChatCacheItem) => {
        if (item.type === 'group') {
            if (item.data?.isBroadcast || item.id?.includes('broadcast')) {
                return (
                    <View style={styles.broadcastBadge}>
                        <Icon name="megaphone" size={10} color="#7C3AED" style={{ marginRight: 3 }} />
                        <Text style={styles.broadcastBadgeText}>BROADCAST</Text>
                    </View>
                );
            }
            return (
                <View style={styles.groupBadge}>
                    <Icon name="people" size={10} color="#0D9488" style={{ marginRight: 3 }} />
                    <Text style={styles.groupBadgeText}>GROUP</Text>
                </View>
            );
        }

        const isStaffMember = Boolean(
            item.data?.isStaff ||
            item.data?.employeeId ||
            item.data?.emp_id ||
            item.data?.is_staff ||
            item.data?.role === 'staff' ||
            item.data?.role === 'employee' ||
            item.data?.designation ||
            item.data?.department
        );

        if (isStaffMember) {
            return (
                <View style={styles.staffBadge}>
                    <Icon name="shield-checkmark" size={10} color="#424e79" style={{ marginRight: 3 }} />
                    <Text style={styles.staffBadgeText}>STAFF</Text>
                </View>
            );
        }

        return (
            <View style={styles.studentBadge}>
                <Icon name="school" size={10} color="#2563EB" style={{ marginRight: 3 }} />
                <Text style={styles.studentBadgeText}>STUDENT</Text>
            </View>
        );
    };

    const getAvatarGradient = (item: ChatCacheItem): [string, string] => {
        if (item.type === 'group') {
            if (item.data?.isBroadcast || item.id?.includes('broadcast')) {
                return ['#8B5CF6', '#6D28D9'];
            }
            return ['#14B8A6', '#0F766E'];
        }
        const isStaffMember = Boolean(
            item.data?.isStaff ||
            item.data?.employeeId ||
            item.data?.emp_id ||
            item.data?.is_staff
        );
        if (isStaffMember) {
            return brand.isStaff ? ['#eebd89', '#d13abd'] : ['#5a6898', '#424e79'];
        }
        return ['#3B82F6', '#1D4ED8'];
    };

    const renderChatItem = ({ item }: { item: ChatCacheItem }) => {
        const isGroup = item.type === 'group';
        const isBroadcast = item.data?.isBroadcast || item.id?.includes('broadcast');
        const hasUnread = (item.unreadCount || 0) > 0;
        const myName = user
            ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim()
            : '';
        const isPeerStaff = !isGroup && Boolean(
            (user && isStudent(user)) ||
            item.data?.isStaff ||
            item.data?.employeeId ||
            item.data?.emp_id ||
            item.data?.is_staff
        );
        const displayName = [
            item.name,
            isPeerStaff ? item.data?.staff_name : item.data?.student_name,
        ].find((name) =>
            name &&
            !isPlaceholderName(name) &&
            !isIdentityId(name) &&
            name.trim().toLowerCase() !== myName.toLowerCase()
        ) || (item.type === 'group' ? 'Group Chat' : (isPeerStaff ? 'Staff Member' : 'Student'));

        return (
            <TouchableOpacity
                style={[
                    styles.chatCard,
                    hasUnread && styles.chatCardUnread,
                    { minHeight: touch.min + 24 }
                ]}
                onPress={() => {
                    const isStaffChat = item.type === 'individual' && Boolean(
                        (user && isStudent(user)) ||
                        item.data?.isStaff ||
                        item.data?.peerRole === 'staff' ||
                        item.data?.employeeId ||
                        item.data?.emp_id ||
                        item.data?.is_staff
                    );
                    navigation.navigate('Chat', {
                    recipient: item.type === 'individual'
                        ? (isStaffChat ? 'staff' : 'student')
                        : 'group',
                    data: {
                        ...item.data,
                        cacheChatId: item.id,
                        type: item.type,
                        ...(isStaffChat ? { staff_name: displayName } : { student_name: displayName }),
                    },
                    chatTitle: displayName,
                    chatId: item.id
                });
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                    accessibilityLabel={`Chat with ${displayName}`}
            >
                <View style={styles.avatarContainer}>
                    <LinearGradient
                        colors={getAvatarGradient(item)}
                        style={[styles.avatar, isTablet && { width: 60, height: 60, borderRadius: 20 }]}
                    >
                        {isGroup ? (
                            <Icon name={isBroadcast ? "megaphone" : "people"} size={24} color="#FFFFFF" />
                        ) : (
                            <Text style={styles.avatarText}>{displayName ? displayName[0].toUpperCase() : '?'}</Text>
                        )}
                    </LinearGradient>
                    <View style={styles.onlineDot} />
                </View>

                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={[styles.chatName, { fontSize: scale(15) }]} numberOfLines={1} allowFontScaling>
                            {displayName}
                        </Text>
                        {renderBadge(item)}
                    </View>

                    <View style={styles.messageRow}>
                        <View style={styles.messagePreviewWrapper}>
                            {renderStatus(item.lastMessageStatus, item.lastMessageSender)}
                            <Text
                                style={[
                                    styles.lastMessage,
                                    hasUnread && styles.lastMessageUnread
                                ]}
                                numberOfLines={1}
                                allowFontScaling
                            >
                            {item.lastMessageSender === 'user' ? 'You: ' : (item.lastSenderName && item.lastMessageSender === 'other' ? `${item.lastSenderName}: ` : '')}{item.lastMessage || 'No messages yet'}
                            </Text>
                        </View>
                        {hasUnread ? (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>
                                    {item.unreadCount! > 99 ? '99+' : item.unreadCount}
                                </Text>
                            </View>
                        ) : (
                            <Icon name="chevron-forward" size={16} color="#CBD5E1" />
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={brand.primary} />
            <LinearGradient
                colors={brand.headerGradient}
                start={brand.headerStart}
                end={brand.headerEnd}
                style={[styles.header, { paddingHorizontal: horizontalPadding, paddingBottom: 16 }]}
            >
                <View style={[styles.headerInner, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
                    <View style={styles.headerTop}>
                        <BackButton color={brand.primaryDark} backgroundColor="#ffffff" size={44} iconSize={20} />
                        <View style={styles.headerTitleRow}>
                            <Text style={[styles.headerTitle, { fontSize: scale(20) }]} allowFontScaling>Messages</Text>
                            {isPrincipal(user) && (
                                <View style={styles.principalHeaderBadge}>
                                    <Icon name="shield-checkmark" size={13} color="#424e79" style={{ marginRight: 4 }} />
                                    <Text style={styles.principalHeaderBadgeText}>PRINCIPAL</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.searchContainer}>
                        <Icon name="search" size={18} color="rgba(255,255,255,0.75)" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search conversations..."
                            placeholderTextColor="rgba(255,255,255,0.75)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            allowFontScaling
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Icon name="close-circle" size={18} color="rgba(255,255,255,0.75)" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Filter Tabs */}
                    <View style={styles.tabsRow}>
                        <TouchableOpacity
                            style={[styles.tabBtn, selectedTab === 'all' && styles.tabBtnActive]}
                            onPress={() => setSelectedTab('all')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
                                All ({counts.all})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabBtn, selectedTab === 'direct' && styles.tabBtnActive]}
                            onPress={() => setSelectedTab('direct')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tabText, selectedTab === 'direct' && styles.tabTextActive]}>
                                Direct ({counts.direct})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabBtn, selectedTab === 'groups' && styles.tabBtnActive]}
                            onPress={() => setSelectedTab('groups')}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.tabText, selectedTab === 'groups' && styles.tabTextActive]}>
                                Groups ({counts.groups})
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <View style={[styles.content, isTablet && { alignItems: 'center' }]}>
                <View style={[styles.contentInner, { maxWidth: contentMaxWidth, width: '100%', flex: 1 }]}>
                    {isLoaded && filteredChats.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Icon name="chatbubbles-outline" size={64} color="#CBD5E1" />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {searchQuery.trim() ? 'No matches found' : 'No conversations yet'}
                            </Text>
                            {isStudent(user) ? (
                                <Text style={styles.emptySubtitle}>
                                    Your conversations with teachers and staff will appear here.
                                </Text>
                            ) : (
                                <View style={{ alignItems: 'center', width: '100%' }}>
                                    <Text style={styles.emptySubtitle}>
                                        Tap the button below to start a new chat with a student or class.
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.emptyStartBtn}
                                        onPress={() => navigation.navigate('NewCommunication')}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#5a6898', '#424e79']}
                                            style={styles.emptyStartGradient}
                                        >
                                            <Icon name="add" size={28} color="#fff" />
                                        </LinearGradient>
                                        <Text style={styles.emptyStartText}>Start New Message</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    ) : (
                        <FlatList
                            data={filteredChats}
                            renderItem={renderChatItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={[styles.listContent, { paddingHorizontal: horizontalPadding, paddingBottom: 100 + insets.bottom }]}
                            showsVerticalScrollIndicator={false}
                            initialNumToRender={12}
                            windowSize={8}
                            removeClippedSubviews
                        />
                    )}
                </View>
            </View>

            {!isStudent(user) && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: 24 + Math.max(insets.bottom, 8), right: horizontalPadding }]}
                    onPress={() => navigation.navigate('NewCommunication')}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="New message"
                >
                    <LinearGradient colors={brand.headerGradient} start={brand.headerStart} end={brand.headerEnd} style={styles.fabGradient}>
                        <Icon name="create-outline" size={24} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerInner: { width: '100%' },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: space.sm,
        minHeight: touch.min,
    },
    headerTitleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginLeft: space.sm,
        minWidth: 0,
    },
    headerTitle: {
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
        flexShrink: 1,
    },
    principalHeaderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: radii.md,
        marginLeft: space.sm,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    principalHeaderBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#424e79',
        letterSpacing: 0.5,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 14,
        paddingHorizontal: space.md,
        height: 44,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        marginLeft: space.sm,
        paddingVertical: 8,
        minWidth: 0,
    },
    tabsRow: {
        flexDirection: 'row',
        marginTop: 12,
        backgroundColor: 'rgba(0,0,0,0.12)',
        borderRadius: 12,
        padding: 3,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 7,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    tabBtnActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.85)',
    },
    tabTextActive: {
        color: '#424e79',
        fontWeight: '800',
    },
    content: { flex: 1 },
    contentInner: { flex: 1 },
    listContent: {
        paddingTop: 12,
        flexGrow: 1,
    },
    chatCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    chatCardUnread: {
        borderColor: '#c5cae8',
        backgroundColor: '#eef0f8',
    },
    avatarContainer: {
        marginRight: 14,
        position: 'relative',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineDot: {
        position: 'absolute',
        bottom: -1,
        right: -1,
        width: 13,
        height: 13,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
    },
    chatInfo: {
        flex: 1,
        minWidth: 0,
        justifyContent: 'center',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
        gap: 8,
    },
    chatName: {
        fontWeight: '700',
        color: '#0F172A',
        flexShrink: 1,
    },
    messageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messagePreviewWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
        marginRight: 8,
    },
    lastMessage: {
        fontSize: 13,
        color: '#64748B',
        flex: 1,
    },
    lastMessageUnread: {
        fontWeight: '700',
        color: '#1E293B',
    },
    staffBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eef0f8',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#c5cae8',
    },
    staffBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#2d3660',
        letterSpacing: 0.3,
    },
    studentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    studentBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1D4ED8',
        letterSpacing: 0.3,
    },
    groupBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#CCFBF1',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#99F6E4',
    },
    groupBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#0F766E',
        letterSpacing: 0.3,
    },
    broadcastBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDE9FE',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD6FE',
    },
    broadcastBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#6D28D9',
        letterSpacing: 0.3,
    },
    unreadBadge: {
        backgroundColor: '#424e79',
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: space.xl,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: space.md,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        marginTop: 4,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
        paddingHorizontal: space.md,
    },
    emptyStartBtn: {
        marginTop: space.lg,
        alignItems: 'center',
    },
    emptyStartGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#424e79',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyStartText: {
        color: '#424e79',
        fontWeight: '800',
        fontSize: 14,
        marginTop: space.sm,
    },
    fab: {
        position: 'absolute',
        elevation: 8,
        shadowColor: '#424e79',
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    fabGradient: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChatList;
