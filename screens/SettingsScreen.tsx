import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    Image,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ModuleHeader from '../components/common/ModuleHeader';
import { useAuth } from '../hooks/useAuth';
import { useUser } from '../hooks/useUser';
import { useSavedAccounts } from '../hooks/useSavedAccounts';

const SettingsScreen = () => {
    const navigation = useNavigation<any>();
    const { logout, logoutAll } = useAuth();
    const { user } = useUser();
    const { accounts, activeAccount, hasMultipleAccounts, switchToAccount, removeAccount } = useSavedAccounts();

    const handleSwitchAccount = async (accountId: string) => {
        if (accountId === activeAccount?.id) return;
        const success = await switchToAccount(accountId);
        if (success) {
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        }
    };

    const handleAddAccount = () => {
        navigation.navigate('SwitchUser');
    };

    const handleLogoutCurrent = () => {
        const accountName = activeAccount?.name || 'this account';
        Alert.alert(
            'Logout',
            `Are you sure you want to log out of ${accountName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await logout();
                            if (result.hasRemaining) {
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'MainTabs' }],
                                });
                            } else {
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                });
                            }
                        } catch (error) {
                            console.log('Logout error:', error);
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        }
                    }
                },
                ...(hasMultipleAccounts ? [{
                    text: 'Logout All Accounts',
                    style: 'destructive' as const,
                    onPress: async () => {
                        try {
                            await logoutAll();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            console.log('Logout all error:', error);
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        }
                    }
                }] : [])
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ModuleHeader
                title="Settings"
                subtitle="⚙️ App & Account Settings"
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* --- ACCOUNTS & MULTI-ACCOUNT SWITCHER (INSTAGRAM STYLE) --- */}
                <Text style={styles.sectionTitle}>Accounts & Logins</Text>
                
                <View style={styles.accountsCard}>
                    {accounts.map((acc) => {
                        const isActive = acc.id === activeAccount?.id;
                        return (
                            <TouchableOpacity
                                key={acc.id}
                                style={[styles.accountItem, isActive && styles.activeAccountItem]}
                                onPress={() => handleSwitchAccount(acc.id)}
                                activeOpacity={0.7}
                            >
                                {acc.photo ? (
                                    <Image source={{ uri: acc.photo }} style={styles.avatarImage} />
                                ) : (
                                    <View style={[styles.avatarPlaceholder, isActive && styles.activeAvatarPlaceholder]}>
                                        <Text style={styles.avatarText}>
                                            {(acc.name || acc.username || 'U').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.accountDetails}>
                                    <View style={styles.accountNameRow}>
                                        <Text style={[styles.accountName, isActive && styles.activeAccountName]} numberOfLines={1}>
                                            {acc.name}
                                        </Text>
                                        {isActive && (
                                            <View style={styles.activeBadge}>
                                                <Text style={styles.activeBadgeText}>Active</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.accountSubtext} numberOfLines={1}>
                                        {acc.role || `@${acc.username}`}
                                    </Text>
                                </View>

                                {isActive ? (
                                    <Icon name="checkmark-circle" size={24} color="#5a6898" />
                                ) : (
                                    <Text style={styles.switchText}>Switch</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}

                    {/* Add Another Account Button */}
                    <TouchableOpacity
                        style={styles.addAccountBtn}
                        onPress={handleAddAccount}
                        activeOpacity={0.7}
                    >
                        <View style={styles.addAccountIconContainer}>
                            <Icon name="person-add" size={20} color="#5a6898" />
                        </View>
                        <View style={styles.accountDetails}>
                            <Text style={styles.addAccountTitle}>Log into another account</Text>
                            <Text style={styles.accountSubtext}>Add and switch between multiple user accounts</Text>
                        </View>
                        <Icon name="chevron-forward" size={20} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>

                {/* --- OTHER ACCOUNT SETTINGS --- */}
                <Text style={styles.sectionTitle}>Preferences</Text>

                <TouchableOpacity
                    style={styles.optionCard}
                    onPress={() => navigation.navigate('ChangePassword')}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>🔑</Text>
                    </View>
                    <View style={styles.optionInfo}>
                        <Text style={styles.optionTitle}>Change Password</Text>
                        <Text style={styles.optionDescription}>Update your account security</Text>
                    </View>
                    <Text style={styles.arrowIcon}>›</Text>
                </TouchableOpacity>

                {/* --- LOGOUT BUTTON --- */}
                <TouchableOpacity
                    style={[styles.optionCard, styles.logoutCard]}
                    onPress={handleLogoutCurrent}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconContainer, styles.destructiveIcon]}>
                        <Text style={styles.iconText}>🚀</Text>
                    </View>
                    <View style={styles.optionInfo}>
                        <Text style={[styles.optionTitle, styles.destructiveText]}>
                            Logout {activeAccount ? `(${activeAccount.name})` : ''}
                        </Text>
                        <Text style={styles.optionDescription}>
                            {hasMultipleAccounts ? 'Sign out of this session or all accounts' : 'Sign out of your account'}
                        </Text>
                    </View>
                    <Text style={[styles.arrowIcon, styles.destructiveText]}>›</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>Version 1.0.0</Text>
                    <Text style={styles.footerText}>AIPS </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
        marginTop: 8,
    },
    accountsCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 8,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        marginBottom: 4,
    },
    activeAccountItem: {
        backgroundColor: '#eef0f8',
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 14,
        backgroundColor: '#e2e8f0',
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    activeAvatarPlaceholder: {
        backgroundColor: '#5a6898',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    accountDetails: {
        flex: 1,
    },
    accountNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    accountName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    activeAccountName: {
        color: '#424e79',
    },
    activeBadge: {
        backgroundColor: '#5a6898',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    activeBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    accountSubtext: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },
    switchText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#5a6898',
        paddingHorizontal: 8,
    },
    addAccountBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        marginTop: 4,
    },
    addAccountIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eef0f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    addAccountTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#5a6898',
    },
    optionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    logoutCard: {
        marginTop: 8,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#eef0f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    destructiveIcon: {
        backgroundColor: '#fef2f2',
    },
    iconText: {
        fontSize: 24,
    },
    optionInfo: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 2,
    },
    destructiveText: {
        color: '#ef4444',
    },
    optionDescription: {
        fontSize: 12,
        color: '#94a3b8',
    },
    arrowIcon: {
        fontSize: 24,
        color: '#cbd5e1',
        marginLeft: 8,
    },
    footer: {
        marginTop: 40,
        marginBottom: 40,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
    },
    footerText: {
        fontSize: 12,
        color: '#cbd5e1',
        marginTop: 4,
    },
});

export default SettingsScreen;
