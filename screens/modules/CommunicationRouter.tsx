
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useChatCache } from '../../hooks/useChatCache';
import { useUser, isStudent } from '../../hooks/useUser';

/**
 * CommunicationRouter
 * Logic:
 * - For Students: Always show ChatList (even if empty)
 * - For Staff: Show ChatList if chats exist, otherwise NewCommunication
 */
const CommunicationRouter = ({ navigation }: any) => {
    const { user } = useUser();
    const userId = (user as any)?.studentId || (user as any)?.employeeId || (user as any)?.adminId || 'anonymous';
    const { chats, isLoaded } = useChatCache(userId);

    useEffect(() => {
        if (isLoaded && user) {
            console.log('🚀 [CommunicationRouter] Redirecting to ChatList');
            navigation.replace('ChatList');
        }
    }, [isLoaded, navigation, user]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#5a6898" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    }
});

export default CommunicationRouter;
