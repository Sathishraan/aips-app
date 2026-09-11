import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image, Modal, Platform, Text } from 'react-native';

interface LoadingSpinnerProps {
    visible: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ visible }) => {
    const spinValue = useRef(new Animated.Value(0)).current;
    const pulseValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            // Rotation Animation
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.bezier(0.4, 0, 0.2, 1),
                    useNativeDriver: true,
                })
            ).start();

            // Pulsing Animation for the logo
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseValue, {
                        toValue: 1.1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseValue, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            spinValue.setValue(0);
            pulseValue.setValue(1);
        }
    }, [visible]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Animated Spinner Border */}
                    <Animated.View
                        style={[
                            styles.spinnerRing,
                            {
                                transform: [{ rotate: spin }],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.spinnerRingInside,
                            {
                                transform: [{ rotate: spin }],
                            },
                        ]}
                    />

                    {/* Logo Container */}
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                transform: [{ scale: pulseValue }],
                            },
                        ]}
                    >
                        <Image
                            source={require('../../assets/aips-logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </Animated.View>
                </View>
                <Text style={styles.schoolName}>Aadhithya International Public School</Text>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinnerRing: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#5a6898', // School orange
        borderTopColor: 'transparent',
        borderLeftColor: 'transparent',
    },
    spinnerRingInside: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#fff',
        borderBottomColor: 'transparent',
        borderRightColor: 'transparent',
        opacity: 0.5,
    },
    logoContainer: {
        width: 60,
        height: 60,
        backgroundColor: '#fff',
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    schoolName: {
        marginTop: 20,
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});

export default LoadingSpinner;
