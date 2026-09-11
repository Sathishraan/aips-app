import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Platform,
    Image
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '../../components/common/BackButton';
import { useChatCache, ChatCacheItem, Message } from '../../hooks/useChatCache';
import { useUser, isStudent } from '../../hooks/useUser';
import { useRoleColors } from '../../hooks/useRoleColors';
import { useGroupMessages } from '../../hooks/useStudentData';
import { nodeApi } from '../../api/base';
import { useQueryClient } from '@tanstack/react-query';

const isDisplayName = (value?: string | null) =>
    !!value && !/^\d+$/.test(value.trim()) && !['Chat', 'Chat Member', 'Unknown', 'Unknown Sender'].includes(value.trim());

const CommunicationScreen = ({ navigation }: any) => {
    const queryClient = useQueryClient();
    const { user } = useUser();
    const brand = useRoleColors();
    const userId = (user as any)?.studentId || (user as any)?.employeeId || (user as any)?.adminId;
    const { chats, isLoaded } = useChatCache(userId);

    useEffect(() => {
        // Force fresh fetch for this user whenever they enter this screen
        if (userId) {
            console.log(`📡 [CommunicationScreen] Forcing message refresh for ID: ${userId}`);
            queryClient.invalidateQueries({ queryKey: ['allIndividualMessages', userId] });
        }
    }, [userId]);

    useEffect(() => {
        console.log('📱 [CommunicationScreen] Rendered', {
            userId: userId || 'UNDEFINED',
            role: user ? (isStudent(user) ? 'Student' : 'Staff') : 'NONE',
            chatCount: chats.length,
            isCacheLoaded: isLoaded
        });
    }, [userId, chats.length, isLoaded]);

    // Note: Historical sync is now handled globally in useGlobalMessageListener.ts
    // This allows students to skip this screen and go straight to ChatList

    const renderBadge = (item: ChatCacheItem) => {
        if (item.type === 'group') {
            return (
                <View style={styles.groupBadge}>
                    <Icon name="people" size={10} color="#0D9488" style={{ marginRight: 3 }} />
                    <Text style={styles.groupBadgeText}>GROUP</Text>
                </View>
            );
        }

        const isStaff = Boolean(
            item.data?.isStaff ||
            item.data?.peerRole === 'staff' ||
            item.data?.employeeId ||
            item.data?.emp_id ||
            item.data?.is_staff
        );

        if (isStaff) {
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

    const renderChatItem = ({ item }: { item: ChatCacheItem }) => {
        const myName = user
            ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim()
            : '';
        const isStaffChat = item.type === 'individual' && Boolean(
            (user && isStudent(user)) ||
            item.data?.isStaff ||
            item.data?.peerRole === 'staff' ||
            item.data?.employeeId ||
            item.data?.emp_id
        );
        const preferred = isStaffChat ? item.data?.staff_name : item.data?.student_name;
        const displayName = [preferred, item.name, item.data?.name].find((name) =>
            isDisplayName(name) && name!.trim().toLowerCase() !== myName.toLowerCase()
        ) || (item.type === 'group' ? 'Group Chat' : (isStaffChat ? 'Staff Member' : 'Student'));

        return (
        <TouchableOpacity
            style={styles.chatItem}
            activeOpacity={0.75}
            onPress={() => {
                navigation.navigate('Chat', {
                recipient: item.type === 'individual' ? (isStaffChat ? 'staff' : 'student') : 'group',
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
        >
            <View style={styles.avatarContainer}>
                {item.type === 'individual' ? (
                    <LinearGradient colors={['#3B82F6', '#1D4ED8']} style={styles.avatar}>
                        <Text style={styles.avatarText}>{displayName[0].toUpperCase()}</Text>
                    </LinearGradient>
                ) : (
                    <LinearGradient colors={['#14B8A6', '#0F766E']} style={styles.avatar}>
                        <Icon name="people" size={22} color="#FFFFFF" />
                    </LinearGradient>
                )}
            </View>
            <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatName} numberOfLines={1}>{displayName}</Text>
                    {renderBadge(item)}
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage || 'No messages yet'}</Text>
            </View>
            <Icon name="chevron-forward" size={18} color="#CBD5E1" />
        </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={brand.headerGradient} start={brand.headerStart} end={brand.headerEnd} style={styles.header}>
                <View style={styles.headerContent}>
                    <BackButton />
                    <Text style={styles.headerTitle}>Communications</Text>
                    {!user || !isStudent(user) ? (
                        <TouchableOpacity
                            style={styles.newChatBtn}
                            onPress={() => navigation.navigate('NewCommunication')}
                        >
                            <Icon name="create-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 40 }} />
                    )}
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {chats.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="chatbubbles-outline" size={72} color="#cbd5e1" />
                        <Text style={styles.emptyTitle}>No conversations yet</Text>
                        {isStudent(user) ? (
                            <Text style={styles.emptySubtitle}>
                                Your messages from teachers and staff will appear here
                            </Text>
                        ) : (
                            <>
                                <Text style={styles.emptySubtitle}>
                                    Start a new conversation by tapping the button above
                                </Text>
                                <TouchableOpacity
                                    style={styles.startBtn}
                                    onPress={() => navigation.navigate('NewCommunication')}
                                >
                                    <Text style={styles.startBtnText}>Start Chat</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                ) : (
                    <FlatList
                        data={chats}
                        renderItem={renderChatItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingTop: 50, paddingBottom: 18, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    newChatBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1 },
    listContent: { padding: 16 },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 16,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    avatarContainer: { marginRight: 14 },
    avatar: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 19, fontWeight: '800' },
    chatInfo: { flex: 1, marginRight: 8 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    chatName: { fontSize: 15, fontWeight: '700', color: '#1E293B', flex: 1, marginRight: 8 },
    lastMessage: { fontSize: 13, color: '#64748B' },
    staffBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eef0f8',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#c5cae8',
    },
    staffBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#2d3660',
    },
    studentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    studentBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#1D4ED8',
    },
    groupBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#CCFBF1',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#99F6E4',
    },
    groupBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#0F766E',
    },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginTop: 20 },
    emptySubtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', marginTop: 8, lineHeight: 20 },
    startBtn: { marginTop: 24, backgroundColor: '#5a6898', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    startBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 }
});

export default CommunicationScreen;
