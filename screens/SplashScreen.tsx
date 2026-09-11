import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Image,
    StatusBar,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { getAuthToken } from '../api/base';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
    const navigation = useNavigation<any>();
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const logoFadeAnim = useRef(new Animated.Value(0)).current;
    const bottomSlideAnim = useRef(new Animated.Value(100)).current;
    const exitAnim = useRef(new Animated.Value(0)).current;
    const loadingAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Parallel animations for a premium entrance
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(logoFadeAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            }),
            Animated.spring(bottomSlideAnim, {
                toValue: 0,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();

        Animated.loop(
            Animated.timing(loadingAnim, {
                toValue: 1,
                duration: 1300,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            })
        ).start();

        // Start Exit "Slide Up" Animation after 7.5 seconds
        const timer = setTimeout(() => {
            Animated.timing(exitAnim, {
                toValue: -height,
                duration: 1500,
                useNativeDriver: true,
            }).start(() => {
                const token = getAuthToken();
                if (token) {
                    navigation.replace('MainTabs');
                } else {
                    navigation.replace('Login');
                }
            });
        }, 2500); // 4.5s + 1.5s animation = 6s total

        return () => {
            clearTimeout(timer);
            loadingAnim.stopAnimation();
        };
    }, []);

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY: exitAnim }] }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient
                colors={['#071827', '#163B5C', '#0F766E']}
                style={styles.gradient}
            >
                {/* Refined Professional Background Elements */}
                <View style={[styles.circle, { top: -80, left: -80, width: 350, height: 350, borderRadius: 175, backgroundColor: 'rgba(255,255,255,0.12)' }]} />
                <View style={[styles.circle, { bottom: -120, right: -120, width: 500, height: 500, borderRadius: 250, backgroundColor: 'rgba(0,0,0,0.05)' }]} />
                <View style={[styles.circle, { top: '30%', right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)' }]} />

                <Animated.View style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }, { translateY: slideAnim }]
                    }
                ]}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../assets/aips-logo.png')}
                            style={styles.logo}
                        />
                    </View>
                    <Text style={styles.welcomeText}>Welcome to</Text>
                    <Text style={styles.brandText}>Aadhithya International Public School</Text>
                    <View style={styles.underline} />
                    <Text style={styles.tagline}>The Future of School Management</Text>
                    <View style={styles.loadingTrack}>
                        <Animated.View
                            style={[
                                styles.loadingBar,
                                {
                                    transform: [{
                                        translateX: loadingAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [-42, 42],
                                        }),
                                    }],
                                },
                            ]}
                        />
                    </View>
                    <Text style={styles.loadingLabel}>Preparing your workspace</Text>
                </Animated.View>

                {/* Bottom Branding Image */}
                <Animated.View style={[
                    styles.bottomContainer,
                    {
                        opacity: logoFadeAnim,
                        transform: [{ translateY: bottomSlideAnim }]
                    }
                ]}>
                    <Image
                        source={require('../assets/aips-logo.png')}
                        style={styles.bottomHeroImage}
                    />
                    <Text style={styles.poweredBy}>Powered by Sparkle digital solutions</Text>
                </Animated.View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 0,
    },
    circle: {
        position: 'absolute',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: -60,
    },
    logoContainer: {
        width: 116,
        height: 116,
        borderRadius: 28,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    logo: {
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
        marginTop: 16,
    },
    tagline: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 20,
        letterSpacing: 2,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    loadingTrack: {
        width: 84,
        height: 3,
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.22)',
        marginTop: 28,
    },
    loadingBar: {
        width: 42,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#F4B942',
    },
    loadingLabel: {
        color: 'rgba(255,255,255,0.68)',
        fontSize: 11,
        marginTop: 10,
        letterSpacing: 0.5,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
    },
    bottomHeroImage: {
        width: width * 0.5,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 10,
        // Premium shadow for 'hanging' effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    poweredBy: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        letterSpacing: 1,
    }
});

export default SplashScreen;
