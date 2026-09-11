import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    Animated,
    StatusBar,
    Alert,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { setAuthToken } from '../api/base';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useSavedAccounts, SavedAccount } from '../hooks/useSavedAccounts';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

const theme = {
    name: 'AIPS Navy',
    colors: ['#163B5C', '#0B243B', '#071827'],
    accent: '#fff',
    buttonText: '#0B243B',
    blob: 'rgba(52,211,190,0.12)'
};

const accountKind = (account: SavedAccount): 'Staff' | 'Student' => {
    if (account.employeeId && !account.studentId) return 'Staff';
    if (account.studentId && !account.employeeId) return 'Student';
    const role = String(account.role || '').toLowerCase();
    if (role.includes('student')) return 'Student';
    if (account.employeeId || role.includes('staff') || role.includes('teacher') || role.includes('principal') || role.includes('admin')) {
        return 'Staff';
    }
    return account.employeeId ? 'Staff' : 'Student';
};

const SchoolIcon = ({ name, delay = 0, style }: any) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const startAnimation = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 4000 + Math.random() * 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 4000 + Math.random() * 2000,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        };
        startAnimation();
    }, []);

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -40 - Math.random() * 30]
    });

    const rotate = anim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-10deg', '15deg']
    });

    const scale = anim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.8, 1.1, 0.8]
    });

    return (
        <Animated.View style={[style, {
            position: 'absolute',
            transform: [{ translateY }, { rotate }, { scale }],
            opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.05, 0.2, 0.05] })
        }]}>
            <Icon name={name} size={50 + Math.random() * 30} color="#fff" />
        </Animated.View>
    );
};

const LoginScreen = ({ navigation, route }: any) => {
    const isAddingAccount = Boolean(route?.params?.isAddingAccount);
    const { login, isLoading } = useAuth();
    const { accounts, switchToAccount } = useSavedAccounts();
    const { width, height, formMaxWidth, isTablet, scale, horizontalPadding } = useResponsiveLayout();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [academicYear, setAcademicYear] = useState('2024-2025');
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [showSplashOverlay, setShowSplashOverlay] = useState(!isAddingAccount);

    const academicYears = ['2023-2024', '2024-2025', '2025-2026'];

    // Login Animations
    const fadeAnim = useRef(new Animated.Value(isAddingAccount ? 1 : 0)).current;
    const slideAnim = useRef(new Animated.Value(isAddingAccount ? 0 : 50)).current;
    const scaleAnim = useRef(new Animated.Value(isAddingAccount ? 1 : 0.85)).current;
    const bgAnim1 = useRef(new Animated.Value(0)).current;
    const bgAnim2 = useRef(new Animated.Value(0)).current;
    const themeFade = useRef(new Animated.Value(1)).current;

    // Splash Animations
    const splashFade = useRef(new Animated.Value(0)).current;
    const splashScale = useRef(new Animated.Value(0.8)).current;
    const splashSlide = useRef(new Animated.Value(50)).current;
    const splashLogoFade = useRef(new Animated.Value(0)).current;
    const splashBottomSlide = useRef(new Animated.Value(100)).current;
    const splashExitSlide = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isAddingAccount) {
            return;
        }
        // 1. Start Splash Entrance
        Animated.parallel([
            Animated.timing(splashFade, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            }),
            Animated.spring(splashScale, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
            Animated.timing(splashSlide, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(splashLogoFade, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            }),
            Animated.spring(splashBottomSlide, {
                toValue: 0,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();

        // 2. Start Synchronization Sequence after 7.5s (Total 9s)
        const transitionTimer = setTimeout(() => {
            // Trigger BOTH Splash Slide-Up and Login Grow-Up at the same time
            Animated.parallel([
                // Splash moves up
                Animated.timing(splashExitSlide, {
                    toValue: -height,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                // Login grows up underneath
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                })
            ]).start(() => {
                setShowSplashOverlay(false); // Cleanup Splash view
            });
        }, 4500); // 4.5s display + 1.5s animation = 6s total

        // Background floating animation 1
        Animated.loop(
            Animated.sequence([
                Animated.timing(bgAnim1, {
                    toValue: 1,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.timing(bgAnim1, {
                    toValue: 0,
                    duration: 4000,
                    useNativeDriver: true,
                })
            ])
        ).start();

        // Background floating animation 2
        Animated.loop(
            Animated.sequence([
                Animated.timing(bgAnim2, {
                    toValue: 1,
                    duration: 6000,
                    useNativeDriver: true,
                }),
                Animated.timing(bgAnim2, {
                    toValue: 0,
                    duration: 6000,
                    useNativeDriver: true,
                })
            ])
        ).start();

        return () => clearTimeout(transitionTimer);
    }, []);


    const handleLogin = () => {
        console.log('--- Login Attempt Start ---');
        console.log('Username:', username);

        console.log('Password:', password);

        if (!username || !password) {
            console.log('Login failed: Missing credentials');
            Alert.alert('Error', 'Please enter username and password');
            return;
        }

        login(
            { username, password, academic_year: academicYear },
            {
                onSuccess: ({ serverData }: any) => {
                    console.log('✅ [LoginScreen] onSuccess serverData:', JSON.stringify(serverData, null, 2));

                    let parsedData = serverData;

                    // Handle string response (rare edge case)
                    if (typeof serverData === 'string') {
                        try {
                            parsedData = JSON.parse(serverData);
                        } catch (e) {
                            console.log('JSON Parse Error:', e);
                            Alert.alert('Server Error', 'Invalid server response');
                            return;
                        }
                    }

                    // Check success: token present = successful login
                    const token = parsedData?.data?.token || parsedData?.token;
                    const status = parsedData?.status;
                    const isSuccess =
                        Boolean(token) ||
                        status === 1 ||
                        status === '1' ||
                        status === 'success';

                    if (isSuccess) {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'MainTabs' }],
                        });
                    } else {
                        const errorMsg =
                            parsedData?.msg ||
                            parsedData?.message ||
                            parsedData?.error ||
                            'Invalid username or password. Please try again.';
                        Alert.alert('Login Failed', errorMsg);
                    }
                },

                onError: (error: any) => {
                    console.log('❌ [LoginScreen] Login Error:', error);
                    const errorMsg =
                        error?.response?.data?.msg ||
                        error?.response?.data?.message ||
                        error?.message ||
                        'Something went wrong. Please try again.';
                    Alert.alert('Login Failed', errorMsg);
                }
            }
        );
    };

    const handleSwitchSavedAccount = async (account: SavedAccount) => {
        const success = await switchToAccount(account.id);
        if (success) {
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
            return;
        }
        Alert.alert('Switch Failed', 'Could not open this saved account. Please log in again.');
    };

    return (
        <Animated.View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* The Login Screen (Grows Up) */}
            <Animated.View style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                }
            ]}>
                <Animated.View style={[styles.gradient, { opacity: themeFade }]}>
                    <LinearGradient
                        colors={theme.colors as any}
                        style={styles.gradient}
                    >
                        {/* Floating School Icons */}
                        <SchoolIcon name="book-outline" delay={0} style={{ top: '10%', left: '5%' }} />
                        <SchoolIcon name="pencil-outline" delay={1000} style={{ top: '25%', right: '10%' }} />
                        <SchoolIcon name="school-outline" delay={2000} style={{ bottom: '20%', left: '15%' }} />
                        <SchoolIcon name="flask-outline" delay={500} style={{ top: '45%', left: '8%' }} />
                        <SchoolIcon name="calculator-outline" delay={1500} style={{ bottom: '35%', right: '12%' }} />
                        <SchoolIcon name="library-outline" delay={2500} style={{ top: '15%', right: '25%' }} />
                        <SchoolIcon name="medal-outline" delay={3000} style={{ top: '65%', right: '5%' }} />
                        <SchoolIcon name="trophy-outline" delay={3500} style={{ bottom: '10%', right: '25%' }} />
                        <SchoolIcon name="paper-plane-outline" delay={4000} style={{ top: '5%', right: '40%' }} />
                        <SchoolIcon name="bulb-outline" delay={4500} style={{ bottom: '45%', left: '25%' }} />

                        {/* Animated Background Blobs */}
                        <Animated.View style={[
                            styles.bgBlob,
                            styles.blob1,
                            {
                                backgroundColor: theme.blob,
                                transform: [
                                    { translateY: bgAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) },
                                    { translateX: bgAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, 30] }) }
                                ]
                            }
                        ]} />
                        <Animated.View style={[
                            styles.bgBlob,
                            styles.blob2,
                            {
                                backgroundColor: theme.blob,
                                transform: [
                                    { translateY: bgAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) },
                                    { translateX: bgAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) }
                                ]
                            }
                        ]} />

                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={[styles.content, { paddingHorizontal: horizontalPadding }]}
                        >
                            <ScrollView
                                contentContainerStyle={styles.loginScroll}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                            >
                                {isAddingAccount && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 15, paddingTop: 10 }}>
                                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
                                            <Icon name="arrow-back" size={20} color="#fff" />
                                            <Text style={{ color: '#fff', fontWeight: '700', marginLeft: 6, fontSize: 14 }}>Cancel</Text>
                                        </TouchableOpacity>
                                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Add Account</Text>
                                        <View style={{ width: 70 }} />
                                    </View>
                                )}
                            <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                                <View style={[styles.logoCircle, isTablet && { width: 120, height: 120, borderRadius: 60 }]}>
                                    <Image
                                        source={require('../assets/aips-logo.png')}
                                        style={{ width: isTablet ? 100 : 90, height: isTablet ? 100 : 90 }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={[styles.title, { textAlign: 'center', fontSize: scale(18) }]} allowFontScaling>
                                    Aadhithya International Public School
                                </Text>
                            </Animated.View>

                            <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: '100%', maxWidth: formMaxWidth, alignSelf: 'center' }]}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Username</Text>
                                    <View style={styles.inputWrapper}>
                                        <Icon name="person-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Admission No / Employee ID"
                                            placeholderTextColor="#9ca3af"
                                            value={username}
                                            onChangeText={setUsername}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Password</Text>
                                    <View style={styles.inputWrapper}>
                                        <Icon name="lock-closed-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Phone number"
                                            placeholderTextColor="#9ca3af"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6b7280" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={[styles.inputGroup, { zIndex: 10 }]}>
                                    <Text style={styles.label}>Academic Year</Text>
                                    <TouchableOpacity
                                        style={styles.inputWrapper}
                                        onPress={() => setShowYearPicker(!showYearPicker)}
                                        activeOpacity={0.7}
                                    >
                                        <Icon name="calendar-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                                        <Text style={[styles.input, { textAlignVertical: 'center', lineHeight: 22 }]}>
                                            {academicYear}
                                        </Text>
                                        <Icon name="chevron-down-outline" size={20} color="#6b7280" />
                                    </TouchableOpacity>

                                    {showYearPicker && (
                                        <View style={styles.yearPickerContainer}>
                                            {academicYears.map((year) => (
                                                <TouchableOpacity
                                                    key={year}
                                                    style={[
                                                        styles.yearOption,
                                                        academicYear === year && styles.yearOptionActive
                                                    ]}
                                                    onPress={() => {
                                                        setAcademicYear(year);
                                                        setShowYearPicker(false);
                                                    }}
                                                >
                                                    <Text style={[
                                                        styles.yearOptionText,
                                                        academicYear === year && styles.yearOptionTextActive
                                                    ]}>
                                                        {year}
                                                    </Text>
                                                    {academicYear === year && (
                                                        <Icon name="checkmark-circle" size={18} color="#5a6898" />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>



                                <TouchableOpacity
                                    style={[styles.loginButton, isLoading && { opacity: 0.7 }]}
                                    onPress={handleLogin}
                                    activeOpacity={0.8}
                                    disabled={isLoading}
                                >
                                    <LinearGradient
                                        colors={[theme.colors[1], theme.colors[2]] as any}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.buttonGradient}
                                    >
                                        <Text style={[styles.loginButtonText, { color: '#fff' }]}>
                                            {isLoading ? 'WORKING...' : 'LOG IN'}
                                        </Text>
                                        {!isLoading && <Icon name="arrow-forward" size={20} color="#fff" />}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {!isAddingAccount && accounts.length > 0 && (
                                    <View style={styles.switchSection}>
                                        <View style={styles.orRow}>
                                            <View style={styles.orLine} />
                                            <Text style={styles.orText}>Switch User</Text>
                                            <View style={styles.orLine} />
                                        </View>
                                        {accounts.slice(0, 5).map((account) => {
                                            const kind = accountKind(account);
                                            return (
                                                <TouchableOpacity
                                                    key={account.id}
                                                    style={styles.savedAccountRow}
                                                    onPress={() => handleSwitchSavedAccount(account)}
                                                    activeOpacity={0.75}
                                                >
                                                    <View style={[
                                                        styles.savedAvatar,
                                                        kind === 'Staff' ? styles.savedAvatarStaff : styles.savedAvatarStudent
                                                    ]}>
                                                        <Text style={styles.savedAvatarText}>
                                                            {(account.name || account.username || 'U').charAt(0).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.savedAccountInfo}>
                                                        <Text style={styles.savedAccountName} numberOfLines={1}>{account.name}</Text>
                                                        <Text style={styles.savedAccountMeta} numberOfLines={1}>
                                                            {kind} · {account.username}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.savedSwitchText}>Open</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                        {accounts.length > 5 && (
                                            <TouchableOpacity
                                                style={styles.seeAllSwitch}
                                                onPress={() => navigation.navigate('SwitchUser')}
                                            >
                                                <Text style={styles.seeAllSwitchText}>See all saved accounts</Text>
                                                <Icon name="chevron-forward" size={16} color="#5a6898" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}


                            </Animated.View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </LinearGradient>
                </Animated.View>
            </Animated.View>

            {/* The Splash Screen Overlay (Slides Up) */}
            {showSplashOverlay && (
                <Animated.View style={[styles.splashContainer, { transform: [{ translateY: splashExitSlide }] }]}>
                    <LinearGradient
                        colors={['#0B243B', '#163B5C', '#0F766E']}
                        style={styles.splashGradient}
                    >
                        {/* Decorative Circles */}
                        <View style={[styles.circle, { top: -80, left: -80, width: 350, height: 350, borderRadius: 175, backgroundColor: 'rgba(255,255,255,0.12)' }]} />
                        <View style={[styles.circle, { bottom: -120, right: -120, width: 500, height: 500, borderRadius: 250, backgroundColor: 'rgba(0,0,0,0.05)' }]} />
                        <View style={[styles.circle, { top: '30%', right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' }]} />

                        <Animated.View style={[
                            styles.splashContent,
                            {
                                opacity: splashFade,
                                transform: [{ scale: splashScale }, { translateY: splashSlide }]
                            }
                        ]}>
                            <View style={styles.splashLogoContainer}>
                                <Image
                                    source={require('../assets/aips-logo.png')}
                                    style={styles.splashLogo}
                                />
                            </View>
                            <Text style={styles.welcomeText}>Welcome to</Text>
                            <Text style={styles.brandText}>Aadhithya International Public School</Text>
                            <View style={styles.underline} />
                            <Text style={styles.tagline}>The Future of School Management</Text>
                        </Animated.View>

                        <Animated.View style={[
                            styles.bottomContainer,
                            {
                                opacity: splashLogoFade,
                                transform: [{ translateY: splashBottomSlide }]
                            }
                        ]}>
                            <Image
                                source={require('../assets/aips-logo.png')}
                                style={styles.bottomHeroImageLogo}
                            />
                            <Text style={styles.poweredBy}>Powered by Sparkle Tech</Text>
                        </Animated.View>
                    </LinearGradient>
                </Animated.View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    gradient: {
        flex: 1,
    },
    bgBlob: {
        position: 'absolute',
        borderRadius: 100,
    },
    blob1: {
        width: 200,
        height: 200,
        top: -50,
        left: -50,
    },
    blob2: {
        width: 150,
        height: 150,
        bottom: 120,
        right: -30,
    },
    content: {
        flex: 1,
    },
    loginScroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
        overflow: 'hidden',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    formContainer: {
        backgroundColor: '#fff',
        padding: 25,
        borderRadius: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        color: '#374151',
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 15,
        paddingHorizontal: 15,
        minHeight: 52,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    inputIcon: {
        marginRight: 10,
        opacity: 0.7,
    },
    input: {
        flex: 1,
        color: '#111827',
        fontSize: 16,
        fontWeight: '500',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 25,
    },
    forgotPasswordText: {
        color: '#5a6898',
        fontSize: 14,
        fontWeight: '600',
    },
    quickFillContainer: {
        marginBottom: 20,
    },
    quickFillLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6b7280',
        marginBottom: 8,
        marginLeft: 4,
    },
    quickFillButtons: {
        flexDirection: 'row',
        gap: 10,
    },
    quickFillBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eef0f8',
        borderWidth: 1,
        borderColor: '#c5cae8',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    quickFillBtnText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#424e79',
    },
    loginButton: {
        minHeight: 52,
        borderRadius: 15,
        overflow: 'hidden',
    },
    buttonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: '800',
        marginRight: 10,
        letterSpacing: 1,
    },
    switchSection: {
        marginTop: 22,
    },
    orRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    orLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    orText: {
        marginHorizontal: 10,
        fontSize: 12,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    savedAccountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    savedAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    savedAvatarStaff: {
        backgroundColor: '#424e79',
    },
    savedAvatarStudent: {
        backgroundColor: '#5a6898',
    },
    savedAvatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    savedAccountInfo: {
        flex: 1,
        minWidth: 0,
    },
    savedAccountName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    savedAccountMeta: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
        fontWeight: '600',
    },
    savedSwitchText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#5a6898',
        marginLeft: 8,
    },
    seeAllSwitch: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 4,
        gap: 4,
    },
    seeAllSwitchText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#5a6898',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#4b5563',
        fontSize: 14,
    },
    signUpText: {
        color: '#5a6898',
        fontWeight: '800',
        fontSize: 14,
    },
    // Integrated Splash Styles
    splashContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 999,
    },
    splashGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        position: 'absolute',
    },
    splashContent: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: -100,
    },
    splashLogoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    splashLogo: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    welcomeText: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
        letterSpacing: 1,
    },
    brandText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: '900',
        textAlign: 'center',
        marginTop: 5,
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
    },
    underline: {
        width: 60,
        height: 4,
        backgroundColor: '#fff',
        borderRadius: 2,
        marginTop: 15,
    },
    tagline: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 20,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
    },
    bottomHeroImageLogo: {
        width: WINDOW_WIDTH * 0.5,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    poweredBy: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        letterSpacing: 1,
    },
    yearPickerContainer: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginTop: 5,
        zIndex: 50,
        overflow: 'hidden',
    },
    yearOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    yearOptionActive: {
        backgroundColor: '#eef0f8',
    },
    yearOptionText: {
        fontSize: 15,
        color: '#4b5563',
        fontWeight: '500',
    },
    yearOptionTextActive: {
        color: '#5a6898',
        fontWeight: '700',
    }
});

export default LoginScreen;
