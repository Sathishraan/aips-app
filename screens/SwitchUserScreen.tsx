import React, { useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    Animated,
    Image,
    Dimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSavedAccounts, SavedAccount } from '../hooks/useSavedAccounts';
import { useAuth } from '../hooks/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Console Test Logger
// ─────────────────────────────────────────────────────────────────────────────
const logBanner = (emoji: string, title: string, details?: Record<string, any>) => {
    const line = '═'.repeat(60);
    console.log(`\n${line}`);
    console.log(`${emoji}  ${title}`);
    if (details) {
        Object.entries(details).forEach(([key, val]) => {
            console.log(`   ${key.padEnd(18)}: ${val}`);
        });
    }
    console.log(`${line}\n`);
};

// ─────────────────────────────────────────────────────────────────────────────
// Avatar Component
// ─────────────────────────────────────────────────────────────────────────────
const AccountAvatar = ({
    account,
    isActive,
    size = 52,
}: {
    account: SavedAccount;
    isActive: boolean;
    size?: number;
}) => {
    const initial = (account.name || account.username || 'U').charAt(0).toUpperCase();
    const radius = size / 2;

    if (account.photo) {
        return (
            <View style={[
                styles.avatarRing,
                isActive && styles.avatarRingActive,
                { width: size + 4, height: size + 4, borderRadius: radius + 2 }
            ]}>
                <Image
                    source={{ uri: account.photo }}
                    style={{ width: size, height: size, borderRadius: radius }}
                />
            </View>
        );
    }

    return (
        <View style={[
            styles.avatarRing,
            isActive && styles.avatarRingActive,
            { width: size + 4, height: size + 4, borderRadius: radius + 2 }
        ]}>
            <LinearGradient
                colors={isActive ? ['#5a6898', '#5a6898', '#424e79'] : ['#cbd5e1', '#94a3b8']}
                style={[styles.avatarGradient, { width: size, height: size, borderRadius: radius }]}
            >
                <Text style={[styles.avatarInitial, { fontSize: size * 0.38, color: isActive ? '#fff' : '#64748b' }]}>
                    {initial}
                </Text>
            </LinearGradient>
        </View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Individual Account Row
// ─────────────────────────────────────────────────────────────────────────────
const AccountRow = ({
    account,
    isActive,
    animValue,
    onSwitch,
    onRemove,
}: {
    account: SavedAccount;
    isActive: boolean;
    animValue: Animated.Value;
    onSwitch: () => void;
    onRemove: () => void;
}) => {
    const translateY = animValue.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
    const opacity = animValue;
    const scale = animValue.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });

    return (
        <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
            <TouchableOpacity
                style={[styles.accountRow, isActive && styles.accountRowActive]}
                onPress={onSwitch}
                activeOpacity={isActive ? 1 : 0.7}
            >
                {/* Avatar */}
                <AccountAvatar account={account} isActive={isActive} />

                {/* Info */}
                <View style={styles.accountInfo}>
                    <View style={styles.accountNameRow}>
                        <Text
                            style={[styles.accountName, isActive && styles.accountNameActive]}
                            numberOfLines={1}
                        >
                            {account.name}
                        </Text>
                        {isActive && (
                            <View style={styles.activeBadge}>
                                <Text style={styles.activeBadgeText}>Active</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.accountSub} numberOfLines={1}>
                        {account.employeeId && !account.studentId
                            ? `Staff · ${account.role || account.username}`
                            : account.studentId && !account.employeeId
                                ? `Student · ${account.role || account.username}`
                                : (account.role || `@${account.username}`)}
                    </Text>
                    {account.academicYear && (
                        <Text style={styles.accountYear}>📅 {account.academicYear}</Text>
                    )}
                </View>

                {/* Right Side */}
                <View style={styles.accountRight}>
                    {isActive ? (
                        <View style={styles.checkCircle}>
                            <Icon name="checkmark" size={14} color="#fff" />
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.switchBtn} onPress={onSwitch} activeOpacity={0.7}>
                            <Text style={styles.switchBtnText}>Switch</Text>
                        </TouchableOpacity>
                    )}
                    {!isActive && (
                        <TouchableOpacity style={styles.removeBtn} onPress={onRemove} activeOpacity={0.7}>
                            <Icon name="close-circle" size={20} color="#cbd5e1" />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main SwitchUserScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function SwitchUserScreen() {
    const navigation = useNavigation<any>();
    const { accounts, activeAccount, switchToAccount, removeAccount, removeAllAccounts } = useSavedAccounts();
    const { logoutAll } = useAuth();

    // ── Animation values – one per slot (max 10 accounts)
    const itemAnims = useRef(
        Array.from({ length: 10 }, () => new Animated.Value(0))
    ).current;
    const headerAnim = useRef(new Animated.Value(0)).current;
    const footerAnim = useRef(new Animated.Value(0)).current;

    // ── Mount entrance animation
    useEffect(() => {
        logBanner('📋', 'SWITCH USER SCREEN LOADED', {
            'Total Accounts': accounts.length,
            'Active Account': activeAccount?.name || 'None',
            'Active Username': activeAccount?.username || 'N/A',
            'Account IDs': accounts.map(a => a.id).join(', ') || 'none',
        });

        // Header first
        Animated.timing(headerAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
        }).start();

        // Stagger account rows
        const rowAnimations = accounts.slice(0, 10).map((_, i) =>
            Animated.timing(itemAnims[i], {
                toValue: 1,
                duration: 350,
                delay: 80 + i * 70,
                useNativeDriver: true,
            })
        );

        // Footer last
        const footerAnimation = Animated.timing(footerAnim, {
            toValue: 1,
            duration: 350,
            delay: 80 + accounts.length * 70 + 100,
            useNativeDriver: true,
        });

        Animated.parallel([...rowAnimations, footerAnimation]).start();
    }, []);

    // ── Switch account handler
    const handleSwitch = useCallback(async (account: SavedAccount) => {
        if (account.id === activeAccount?.id) {
            logBanner('ℹ️', 'SWITCH SKIPPED — Already active', {
                Account: account.name,
                Username: account.username,
            });
            return;
        }

        logBanner('🔁', 'SWITCHING ACCOUNT', {
            'From': `${activeAccount?.name || 'Unknown'} (@${activeAccount?.username || 'N/A'})`,
            'To': `${account.name} (@${account.username})`,
            'Token (first 25)': account.token ? account.token.substring(0, 25) + '...' : 'NO TOKEN',
            'Academic Year': account.academicYear || 'N/A',
        });

        const success = await switchToAccount(account.id);

        if (success) {
            logBanner('✅', 'SWITCH SUCCESS — Navigating to MainTabs', {
                'Now Active': account.name,
                'Username': account.username,
            });
            navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        } else {
            logBanner('❌', 'SWITCH FAILED', { 'Target ID': account.id });
            Alert.alert('Switch Failed', 'Could not switch to this account. Please try again.');
        }
    }, [activeAccount, switchToAccount, navigation]);

    // ── Remove account handler
    const handleRemove = useCallback((account: SavedAccount) => {
        logBanner('🗑️', 'REMOVE ACCOUNT REQUESTED', {
            Account: account.name,
            Username: account.username,
            ID: account.id,
        });

        Alert.alert(
            'Remove Account',
            `Remove ${account.name} (@${account.username}) from this device?\n\nYou can log back in anytime.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => console.log('🚫 [SwitchUser] Remove cancelled by user'),
                },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        logBanner('🗑️', 'REMOVING ACCOUNT...', {
                            Account: account.name,
                            Username: account.username,
                        });
                        const remaining = await removeAccount(account.id);
                        logBanner('✅', 'ACCOUNT REMOVED', {
                            'Removed': account.name,
                            'Remaining Accounts': accounts.length - 1,
                            'New Active': remaining?.name || 'None',
                        });

                        if (!remaining) {
                            // No accounts left → go to Login
                            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                        }
                        // else stay on screen — reactive store will update the list
                    },
                },
            ]
        );
    }, [accounts, removeAccount, navigation]);

    // ── Add another account
    const handleAddAccount = useCallback(() => {
        logBanner('➕', 'ADD ACCOUNT — Navigating to Login', {
            'Current Accounts': accounts.length,
            'Max Accounts': 10,
        });
        navigation.navigate('Login', { isAddingAccount: true });
    }, [accounts.length, navigation]);

    // ── Logout all
    const handleLogoutAll = useCallback(() => {
        logBanner('🚪', 'LOGOUT ALL REQUESTED', {
            'Total Accounts': accounts.length,
            'Accounts': accounts.map(a => a.name).join(', '),
        });

        Alert.alert(
            'Logout All Accounts',
            `This will remove all ${accounts.length} saved account${accounts.length !== 1 ? 's' : ''} from this device.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout All',
                    style: 'destructive',
                    onPress: async () => {
                        await logoutAll();
                        logBanner('✅', 'ALL ACCOUNTS LOGGED OUT', {
                            'Cleared': accounts.length + ' account(s)',
                        });
                        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                    },
                },
            ]
        );
    }, [accounts, logoutAll, navigation]);

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <View style={styles.root}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* ── SAFE AREA HEADER ── */}
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
                <Animated.View style={[styles.header, {
                    opacity: headerAnim,
                    transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }]
                }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Icon name="arrow-back" size={22} color="#1e293b" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Switch Account</Text>
                        <Text style={styles.headerSub}>{accounts.length} account{accounts.length !== 1 ? 's' : ''} saved</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </Animated.View>
            </SafeAreaView>

            {/* ── DIVIDER ── */}
            <View style={styles.headerDivider} />

            {/* ── ACCOUNT LIST ── */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={Platform.OS === 'ios'}
            >
                {/* Accounts Card */}
                <View style={styles.card}>
                    {accounts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Icon name="person-circle-outline" size={64} color="#e2e8f0" />
                            <Text style={styles.emptyTitle}>No saved accounts</Text>
                            <Text style={styles.emptySub}>Log in to add your first account</Text>
                        </View>
                    ) : (
                        accounts.map((account, index) => {
                            const isActive = account.id === activeAccount?.id;
                            return (
                                <React.Fragment key={account.id}>
                                    <AccountRow
                                        account={account}
                                        isActive={isActive}
                                        animValue={itemAnims[Math.min(index, 9)]}
                                        onSwitch={() => handleSwitch(account)}
                                        onRemove={() => handleRemove(account)}
                                    />
                                    {index < accounts.length - 1 && (
                                        <View style={styles.rowDivider} />
                                    )}
                                </React.Fragment>
                            );
                        })
                    )}
                </View>

                {/* ── ADD ANOTHER ACCOUNT ── */}
                <Animated.View style={{
                    opacity: footerAnim,
                    transform: [{ translateY: footerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
                }}>
                    <TouchableOpacity
                        style={styles.addAccountBtn}
                        onPress={handleAddAccount}
                        activeOpacity={0.7}
                    >
                        <LinearGradient
                            colors={['#eef0f8', '#fff']}
                            style={styles.addAccountInner}
                        >
                            <View style={styles.addAccountIconWrap}>
                                <Icon name="person-add-outline" size={22} color="#5a6898" />
                            </View>
                            <View style={styles.addAccountText}>
                                <Text style={styles.addAccountTitle}>Log into another account</Text>
                                <Text style={styles.addAccountSub}>Add and switch between multiple accounts</Text>
                            </View>
                            <Icon name="chevron-forward" size={18} color="#5a6898" />
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* ── LOGOUT ALL ── */}
                    {accounts.length > 0 && (
                        <TouchableOpacity
                            style={styles.logoutAllBtn}
                            onPress={handleLogoutAll}
                            activeOpacity={0.7}
                        >
                            <Icon name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
                            <Text style={styles.logoutAllText}>
                                {accounts.length > 1
                                    ? `Logout all ${accounts.length} accounts`
                                    : 'Logout'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* ── FOOTER NOTE ── */}
                    <Text style={styles.footerNote}>
                        Switching accounts keeps all sessions active.{'\n'}
                        Remove an account to sign it out of this device.
                    </Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0f172a',
        letterSpacing: 0.3,
    },
    headerSub: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
        marginTop: 1,
    },
    headerDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
    },

    // Scroll
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
        gap: 12,
    },

    // Card container
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
    },

    // Account row
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    accountRowActive: {
        backgroundColor: '#eef0f8',
    },
    rowDivider: {
        height: 1,
        backgroundColor: '#f8fafc',
        marginLeft: 84,
    },

    // Avatar
    avatarRing: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        marginRight: 14,
    },
    avatarRingActive: {
        borderColor: '#5a6898',
    },
    avatarGradient: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontWeight: '900',
    },

    // Account info
    accountInfo: {
        flex: 1,
        marginRight: 8,
    },
    accountNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    accountName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1e293b',
    },
    accountNameActive: {
        color: '#424e79',
    },
    accountSub: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
        fontWeight: '500',
    },
    accountYear: {
        fontSize: 11,
        color: '#cbd5e1',
        marginTop: 2,
    },
    activeBadge: {
        backgroundColor: '#5a6898',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 8,
    },
    activeBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    // Right side
    accountRight: {
        alignItems: 'center',
        gap: 6,
    },
    checkCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#5a6898',
        justifyContent: 'center',
        alignItems: 'center',
    },
    switchBtn: {
        backgroundColor: '#5a6898',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    switchBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    removeBtn: {
        padding: 2,
    },

    // Add account button
    addAccountBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: '#c5cae8',
        borderStyle: 'dashed',
        elevation: 0,
    },
    addAccountInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    addAccountIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eef0f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: '#c5cae8',
    },
    addAccountText: {
        flex: 1,
    },
    addAccountTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#5a6898',
    },
    addAccountSub: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
    },

    // Logout all
    logoutAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        marginTop: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    logoutAllText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ef4444',
    },

    // Footer note
    footerNote: {
        textAlign: 'center',
        fontSize: 12,
        color: '#94a3b8',
        lineHeight: 18,
        marginTop: 20,
        paddingHorizontal: 20,
    },

    // Empty state
    emptyState: {
        padding: 40,
        alignItems: 'center',
        gap: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#94a3b8',
        marginTop: 8,
    },
    emptySub: {
        fontSize: 13,
        color: '#cbd5e1',
    },
});
