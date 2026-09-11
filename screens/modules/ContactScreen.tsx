import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    Linking,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';

const { width } = Dimensions.get('window');

const ContactScreen = ({ navigation }: any) => {
    const slideAnim = useRef(new Animated.Value(width)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);


    const handleCall = async (phoneNumber: string) => {
        console.log('📞 Attempting to call:', phoneNumber);
        const url = `tel:${phoneNumber}`;

        try {
            const supported = await Linking.canOpenURL(url);
            console.log('📞 Phone call supported:', supported);

            if (supported) {
                await Linking.openURL(url);
                console.log('✅ Phone dialer opened successfully');
            } else {
                // Device doesn't support phone calls (emulator, web, etc.)
                console.warn('⚠️ Phone calls not supported on this device');

                // Offer to copy number instead
                Alert.alert(
                    'Phone Number',
                    `${phoneNumber}\n\nPhone calls are not supported on this device (emulator/web).\n\nWould you like to copy the number?`,
                    [
                        {
                            text: 'Copy Number',
                            onPress: async () => {
                                try {
                                    // Try to use Clipboard API if available
                                    const Clipboard = require('@react-native-clipboard/clipboard');
                                    Clipboard.default.setString(phoneNumber);
                                    Alert.alert('Copied!', `${phoneNumber} copied to clipboard`);
                                } catch (error) {
                                    console.log('Clipboard not available, showing number only');
                                    Alert.alert('Phone Number', phoneNumber);
                                }
                            }
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        }
                    ]
                );
            }
        } catch (err) {
            console.error('❌ Error opening phone dialer:', err);
            Alert.alert(
                'Phone Number',
                `${phoneNumber}\n\nUnable to open phone dialer. You can manually dial this number.`,
                [{ text: 'OK' }]
            );
        }
    };

    const handleEmail = (email: string) => {
        const url = `mailto:${email}`;
        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Alert.alert('Error', 'Email is not supported on this device');
                }
            })
            .catch((err) => console.error('Error opening email:', err));
    };

    const handleLocation = () => {
        const address = 'Aadhithya International Public School, No 6, 2nd Main Road, Royal Garden, Goparasanallur Village, Kattuppakkam, Chennai 600 056';
        const url = Platform.select({
            ios: `maps:0,0?q=${encodeURIComponent(address)}`,
            android: `geo:0,0?q=${encodeURIComponent(address)}`,
        });

        if (url) {
            Linking.canOpenURL(url)
                .then((supported) => {
                    if (supported) {
                        Linking.openURL(url);
                    } else {
                        // Fallback to Google Maps web
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
                    }
                })
                .catch((err) => console.error('Error opening maps:', err));
        }
    };

    const handleWebsite = () => {
        const url = 'https://aadhithyapublicschools.com';
        Linking.canOpenURL(url)
            .then((supported) => {
                if (supported) {
                    Linking.openURL(url);
                } else {
                    Alert.alert('Error', 'Cannot open website');
                }
            })
            .catch((err) => console.error('Error opening website:', err));
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateX: slideAnim }],
                    opacity: fadeAnim,
                },
            ]}
        >
            <ModuleHeader
                title="Contact Us"
                subtitle="📞 Get in Touch"
                actionIcon="call-outline"
                onActionPress={() => handleCall('+919940622669')}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* School Info Header */}
                <View style={styles.headerCard}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="school" size={48} color="#3B82F6" />
                    </View>
                    <Text style={styles.schoolName}>Aadhithya International</Text>
                    <Text style={styles.schoolName}>Public School</Text>
                    <Text style={styles.tagline}>Excellence in Education</Text>
                </View>

                {/* Address Card */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={handleLocation}
                    activeOpacity={0.7}
                >
                    <View style={styles.cardHeader}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="location" size={24} color="#3B82F6" />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>School Address</Text>
                            <Text style={styles.cardSubtitle}>Tap to open in maps</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.addressText}>No 6, 2nd Main Road,</Text>
                        <Text style={styles.addressText}>Royal Garden, Goparasanallur Village,</Text>
                        <Text style={styles.addressText}>Kattuppakkam, Chennai 600 056</Text>
                    </View>
                </TouchableOpacity>

                {/* Phone Numbers Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="call" size={24} color="#10B981" />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>Phone Numbers</Text>
                            <Text style={styles.cardSubtitle}>Tap to call</Text>
                        </View>
                    </View>
                    <View style={styles.cardContent}>
                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={() => handleCall('+919940622669')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="call-outline" size={20} color="#10B981" />
                            <Text style={styles.contactText}>+91 99406 22669</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Primary</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={() => handleCall('+919940622557')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="call-outline" size={20} color="#10B981" />
                            <Text style={styles.contactText}>+91 99406 22557</Text>
                            <View style={[styles.badge, styles.badgeSecondary]}>
                                <Text style={styles.badgeText}>Secondary</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Email Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="mail" size={24} color="#F59E0B" />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>Email Address</Text>
                            <Text style={styles.cardSubtitle}>Tap to send email</Text>
                        </View>
                    </View>
                    <View style={styles.cardContent}>
                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={() => handleEmail('info@aadhithyapublicschools.com')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="mail-outline" size={20} color="#F59E0B" />
                            <Text style={styles.contactText}>info@aadhithyapublicschools.com</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActionsContainer}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    {/* Call Now - Primary Action */}
                    <TouchableOpacity
                        style={styles.primaryActionCard}
                        onPress={() => {
                            console.log('📞 Call button pressed');
                            handleCall('+919940622669');
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={styles.primaryActionContent}>
                            <View style={styles.primaryActionLeft}>
                                <View style={styles.primaryIconCircle}>
                                    <Ionicons name="call" size={32} color="#FFFFFF" />
                                </View>
                                <View style={styles.primaryActionTextContainer}>
                                    <Text style={styles.primaryActionTitle}>Call Now</Text>
                                    <Text style={styles.primaryActionSubtitle}>Speak with our team</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>

                    {/* Secondary Actions Grid */}
                    <View style={styles.secondaryActionsGrid}>
                        <TouchableOpacity
                            style={styles.secondaryActionCard}
                            onPress={() => {
                                console.log('🌐 Website button pressed');
                                handleWebsite();
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.secondaryIconCircle, { backgroundColor: '#EEF2FF' }]}>
                                <Ionicons name="globe-outline" size={28} color="#3B82F6" />
                            </View>
                            <Text style={styles.secondaryActionTitle}>Visit Website</Text>
                            <Text style={styles.secondaryActionSubtitle}>Learn more about us</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryActionCard}
                            onPress={() => {
                                console.log('📧 Email button pressed');
                                handleEmail('info@aadhithyapublicschools.com');
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.secondaryIconCircle, { backgroundColor: '#DBEAFE' }]}>
                                <Ionicons name="mail-outline" size={28} color="#3B82F6" />
                            </View>
                            <Text style={styles.secondaryActionTitle}>Send Email</Text>
                            <Text style={styles.secondaryActionSubtitle}>Write to us</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Get Directions - Full Width */}
                    <TouchableOpacity
                        style={styles.directionsCard}
                        onPress={() => {
                            console.log('🗺️ Directions button pressed');
                            handleLocation();
                        }}
                        activeOpacity={0.7}
                    >
                        <View style={styles.directionsContent}>
                            <View style={[styles.secondaryIconCircle, { backgroundColor: '#FEF3C7' }]}>
                                <Ionicons name="navigate" size={28} color="#F59E0B" />
                            </View>
                            <View style={styles.directionsTextContainer}>
                                <Text style={styles.directionsTitle}>Get Directions</Text>
                                <Text style={styles.directionsSubtitle}>Open in maps</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Office Hours */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="time" size={24} color="#8B5CF6" />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.cardTitle}>Office Hours</Text>
                            <Text style={styles.cardSubtitle}>Visit us during</Text>
                        </View>
                    </View>
                    <View style={styles.cardContent}>
                        <View style={styles.hoursRow}>
                            <Text style={styles.dayText}>Monday - Friday</Text>
                            <Text style={styles.timeText}>8:00 AM - 4:00 PM</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.hoursRow}>
                            <Text style={styles.dayText}>Saturday</Text>
                            <Text style={styles.timeText}>8:00 AM - 1:00 PM</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.hoursRow}>
                            <Text style={styles.dayText}>Sunday</Text>
                            <Text style={[styles.timeText, { color: '#EF4444' }]}>Closed</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    headerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    schoolName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    tagline: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
        fontStyle: 'italic',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardHeaderText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#6B7280',
    },
    cardContent: {
        paddingLeft: 4,
    },
    addressText: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
        marginBottom: 2,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    contactText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
        marginLeft: 12,
        flex: 1,
    },
    badge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeSecondary: {
        backgroundColor: '#DBEAFE',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#065F46',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    quickActionsContainer: {
        marginBottom: 16,
    },

    // Primary Action Card (Call Now)
    primaryActionCard: {
        backgroundColor: '#10B981',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    primaryActionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    primaryActionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    primaryIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    primaryActionTextContainer: {
        flex: 1,
    },
    primaryActionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    primaryActionSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },

    // Secondary Actions Grid
    secondaryActionsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    secondaryActionCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        minHeight: 140,
        justifyContent: 'center',
    },
    secondaryIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    secondaryActionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 4,
    },
    secondaryActionSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },

    // Directions Card
    directionsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    directionsContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    directionsTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    directionsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    directionsSubtitle: {
        fontSize: 13,
        color: '#6B7280',
    },
    hoursRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    dayText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    timeText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#10B981',
    },
    bottomSpacing: {
        height: 24,
    },
});

export default ContactScreen;
