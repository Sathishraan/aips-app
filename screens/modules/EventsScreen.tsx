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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import BackButton from '../../components/common/BackButton';
import { useAllEvents } from '../../hooks/useEvents';

const { width } = Dimensions.get('window');

interface EventCategory {
    id: string;
    title: string;
    subtitle: string;
    icon: keyof typeof Icon.glyphMap;
    route: string;
    colors: [string, string];
    iconBg: string;
}

const eventCategories: EventCategory[] = [
    {
        id: 'sports',
        title: 'Sports Events',
        subtitle: 'Tournaments, matches & athletic competitions',
        icon: 'football-outline',
        route: 'SportsEvents',
        colors: ['#22c55e', '#16a34a'],
        iconBg: '#dcfce7',
    },
    {
        id: 'competitions',
        title: 'Competitions',
        subtitle: 'Academic & skill-based contests',
        icon: 'trophy-outline',
        route: 'CompetitionEvents',
        colors: ['#f59e0b', '#d97706'],
        iconBg: '#fef3c7',
    },
    {
        id: 'programs',
        title: 'Programs',
        subtitle: 'Special programs & ceremonies',
        icon: 'calendar-outline',
        route: 'ProgramEvents',
        colors: ['#8b5cf6', '#7c3aed'],
        iconBg: '#ede9fe',
    },
    {
        id: 'culturals',
        title: 'Cultural Events',
        subtitle: 'Celebrations, festivals & cultural activities',
        icon: 'musical-notes-outline',
        route: 'CulturalEvents',
        colors: ['#ec4899', '#db2777'],
        iconBg: '#fce7f3',
    },
];

const CategoryCard = React.memo(
    ({
        category,
        animation,
        index,
        onPress,
    }: {
        category: EventCategory;
        animation: Animated.Value;
        index: number;
        onPress: (route: string) => void;
    }) => {
        const animatedStyle = {
            opacity: animation,
            transform: [
                {
                    translateY: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                    }),
                },
                {
                    scale: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                    }),
                },
            ],
        };

        return (
            <Animated.View style={animatedStyle}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => onPress(category.route)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={category.colors}
                        style={styles.cardGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.cardContent}>
                            <View
                                style={[
                                    styles.iconContainer,
                                    { backgroundColor: category.iconBg },
                                ]}
                            >
                                <Icon
                                    name={category.icon}
                                    size={32}
                                    color={category.colors[0]}
                                />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>{category.title}</Text>
                                <Text style={styles.cardSubtitle}>
                                    {category.subtitle}
                                </Text>
                            </View>
                            <View style={styles.arrowContainer}>
                                <Icon
                                    name="chevron-forward"
                                    size={24}
                                    color="rgba(255,255,255,0.8)"
                                />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    }
);

const EventsScreen = ({ navigation }: any) => {
    // Trigger prefetching of all event types for immediate access in sub-screens
    useAllEvents();

    const slideAnim = useRef(new Animated.Value(width)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const cardAnimations = useRef(
        eventCategories.map(() => new Animated.Value(0))
    ).current;

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
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Stagger card animations
            Animated.stagger(
                80,
                cardAnimations.map((anim) =>
                    Animated.spring(anim, {
                        toValue: 1,
                        tension: 50,
                        friction: 7,
                        useNativeDriver: true,
                    })
                )
            ).start();
        });
    }, []);

    const handleCategoryPress = React.useCallback(
        (route: string) => {
            navigation.navigate(route);
        },
        [navigation]
    );

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
                title="Events"
                subtitle="🎉 Trending Activities"
                actionIcon="apps-outline"
                onActionPress={() => { }}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.sectionHeader}>
                    <Icon name="apps-outline" size={20} color="#64748b" />
                    <Text style={styles.sectionTitle}>Event Categories</Text>
                </View>

                <View style={styles.cardsContainer}>
                    {eventCategories.map((category, index) => (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            index={index}
                            animation={cardAnimations[index]}
                            onPress={handleCategoryPress}
                        />
                    ))}
                </View>

                <View style={styles.infoCard}>
                    <LinearGradient
                        colors={['#f1f5f9', '#e2e8f0']}
                        style={styles.infoGradient}
                    >
                        <Icon name="information-circle-outline" size={24} color="#64748b" />
                        <Text style={styles.infoText}>
                            Select a category to view detailed events and participate in school activities.
                        </Text>
                    </LinearGradient>
                </View>
            </ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },

    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#64748b',
    },
    cardsContainer: {
        gap: 15,
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    cardGradient: {
        padding: 20,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 15,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '500',
    },
    arrowContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        marginTop: 25,
        borderRadius: 16,
        overflow: 'hidden',
    },
    infoGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#64748b',
        lineHeight: 20,
        fontWeight: '500',
    },
});

export default EventsScreen;
