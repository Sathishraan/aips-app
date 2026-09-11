import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    StatusBar,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import BackButton from '../../components/common/BackButton';
import { useTimetable } from '../../hooks/useTimetable';
import { TimetableEntry, Period } from '../../types/timetable.type';

const { width } = Dimensions.get('window');

const TimeTableScreen = () => {
    const { data, isLoading, refetch, isFetching } = useTimetable();
    const [selectedDay, setSelectedDay] = useState<string>('');

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isLoading && data?.workingDays?.length && !selectedDay) {
            // Set initial day to current day if it's a working day, otherwise first working day
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const todayName = days[new Date().getDay()];
            const isTodayWorking = data.workingDays.find(d => d.day_name === todayName && (d.is_working === '1' || (d.is_working as any) === 1));

            setSelectedDay(isTodayWorking ? todayName : data.workingDays[0].day_name);
        }
    }, [isLoading, data, selectedDay]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous bounce animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const workingDays = useMemo(() => data?.workingDays || [], [data]);

    const dailyTimetable = useMemo(() => {
        if (!data?.timetable || !data?.periods || !selectedDay) return [];

        // Construct the full day schedule by following the periods structure
        return data.periods.map(period => {
            const entry = data.timetable.find(
                t => t.period_id === period.period_id && t.day_name === selectedDay
            );

            return {
                ...period,
                entry: entry || null
            };
        }).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
    }, [data, selectedDay]);

    const floatY = bounceAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -5]
    });

    const getSubjectColor = (index: number) => {
        const palettes = [
            ['#0F766E', '#19A89F'],
            ['#2563A6', '#4B89C8'],
            ['#D97706', '#F2A93B'],
            ['#C24168', '#E27796'],
            ['#475569', '#718096'],
            ['#15803D', '#46A66A'],
        ];
        return palettes[index % palettes.length];
    };

    const renderHeader = () => (
        <ModuleHeader
            title="Time Table"
            subtitle={data?.timetable?.[0]?.academic_year || "Weekly schedule"}
            actionIcon="refresh-outline"
            onActionPress={() => refetch()}
            style={{ paddingBottom: 0 }}
        >
            <View style={styles.dayTabsSection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dayTabsContent}
                    snapToInterval={(width - 32 - 32) / 4.2}
                    decelerationRate="fast"
                >
                    {workingDays.map((day, idx) => {
                        const isActive = selectedDay === day.day_name;
                        return (
                            <TouchableOpacity
                                key={day.setting_id}
                                onPress={() => setSelectedDay(day.day_name)}
                                style={styles.dayTabWrapper}
                            >
                                {isActive ? (
                                    <View style={[styles.dayTab, styles.activeDayTab]}>
                                        <Text style={styles.activeDayTabText}>
                                            {day.day_name.substring(0, 3)}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.dayTab}>
                                        <Text style={styles.dayTabText}>
                                            {day.day_name.substring(0, 3)}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </ModuleHeader>
    );

    const renderPeriod = (item: any, index: number) => {
        const isBreak = item.period_type?.toLowerCase() === 'break';
        const entry = item.entry as TimetableEntry | null;
        const itemColors = getSubjectColor(index) as [string, string];

        if (isBreak) {
            const isLunch = item.period_name.toLowerCase().includes('lunch');
            return (
                <Animated.View
                    key={item.period_id}
                    style={[
                        {
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim },
                                { translateY: floatY }
                            ]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={isLunch ? ['#FFF8E8', '#FFF0C7'] : ['#EAF8F7', '#D9F1EF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.breakCard}
                    >
                        {/* Decorative Elements */}
                        <View style={styles.breakDecor1} />
                        <View style={styles.breakDecor2} />

                        <View style={styles.breakContent}>
                            <View style={styles.breakLeft}>
                                <View style={[
                                    styles.breakIconContainer,
                                    { backgroundColor: isLunch ? '#F59E0B' : '#0F9F9A' }
                                ]}>
                                    <Icon
                                        name={isLunch ? 'restaurant' : 'cafe'}
                                        size={28}
                                        color="#fff"
                                    />
                                </View>
                            </View>

                            <View style={styles.breakMiddle}>
                                <View style={styles.breakBadge}>
                                    <Text style={styles.breakLabel}>BREAK TIME</Text>
                                </View>
                                <Text style={styles.breakTitle}>
                                    {item.period_name}
                                </Text>
                                <Text style={styles.breakSubtext}>
                                    {isLunch ? 'Take time to recharge' : 'A short pause between classes'}
                                </Text>
                            </View>

                            <View style={styles.breakRight}>
                                <View style={styles.breakTimeContainer}>
                                    <Icon name="time-outline" size={16} color="#64748b" />
                                    <Text style={styles.breakTimeText}>
                                        {(item.start_time || '').substring(0, 5)}
                                    </Text>
                                </View>
                                <Text style={styles.breakTimeTo}>to</Text>
                                <Text style={styles.breakTimeEnd}>
                                    {(item.end_time || '').substring(0, 5)}
                                </Text>
                            </View>
                        </View>

                        {/* Bottom Wave */}
                        <View style={styles.breakWave}>
                            <View style={[styles.breakLine, { backgroundColor: isLunch ? '#F59E0B' : '#0F9F9A' }]} />
                            <Text style={styles.breakLineText}>{isLunch ? 'LUNCH' : 'BREAK'}</Text>
                        </View>
                    </LinearGradient>
                </Animated.View>
            );
        }

        return (
            <Animated.View
                key={item.period_id}
                style={[
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { scale: scaleAnim }
                        ]
                    }
                ]}
            >
                <View style={styles.periodCard}>
                    <LinearGradient
                        colors={itemColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.periodAccent}
                    >
                        <Icon name="book" size={18} color="#fff" />
                    </LinearGradient>

                    <View style={styles.periodContent}>
                        <View style={styles.periodTop}>
                            <View style={styles.periodHeaderLeft}>
                                <View style={styles.periodNumberBadge}>
                                    <Text style={styles.periodNumber}>
                                        P{item.period_name}
                                    </Text>
                                </View>
                                <View style={styles.timeRow}>
                                    <Icon name="time" size={12} color="#94a3b8" />
                                    <Text style={styles.periodTime}>
                                        {(item.start_time || '').substring(0, 5)} - {(item.end_time || '').substring(0, 5)}
                                    </Text>
                                </View>
                            </View>

                            {entry && entry.room_no && (
                                <View style={[styles.roomBadge, { backgroundColor: `${itemColors[0]}15` }]}>
                                    <Icon name="location" size={12} color={itemColors[0]} />
                                    <Text style={[styles.roomText, { color: itemColors[0] }]}>Room {entry.room_no}</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.subjectName}>
                            {entry?.subject_name || entry?.subject_id || 'No Subject Assigned'}
                        </Text>

                        {entry && (
                            <View style={styles.teacherSection}>
                                <View style={styles.teacherCard}>
                                    <View style={[styles.teacherAvatar, { backgroundColor: `${itemColors[0]}15` }]}>
                                        <Icon name="person" size={16} color={itemColors[0]} />
                                    </View>
                                    <View style={styles.teacherInfo}>
                                        <Text style={styles.teacherLabel}>Teacher</Text>
                                        <Text style={styles.teacherName}>
                                            {entry.teacherName || entry.teacher_name || `ID: ${entry.teacher_id}`}
                                        </Text>
                                    </View>
                                </View>

                                {entry.substituteTeacherName && (
                                    <View style={styles.substituteCard}>
                                        <LinearGradient
                                            colors={['#FFF7ED', '#F3F7FB']}
                                            style={styles.substituteGradient}
                                        >
                                            <Icon name="swap-horizontal" size={16} color="#5a6898" />
                                            <View style={styles.substituteInfo}>
                                                <Text style={styles.substituteLabel}>
                                                    🔄 Substitute Teacher
                                                </Text>
                                                <Text style={styles.substituteName}>
                                                    {entry.substituteTeacherName}
                                                </Text>
                                            </View>
                                        </LinearGradient>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Corner Badge */}
                    <View style={styles.cornerBadge}>
                        <Icon name="book-outline" size={15} color={itemColors[0]} />
                    </View>
                </View>
            </Animated.View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <LinearGradient
                    colors={['#12233F', '#1E466A']}
                    style={styles.loadingGradient}
                >
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Loading timetable</Text>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderHeader()}

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isFetching} onRefresh={refetch} colors={['#0F9F9A']} />
                }
            >
                {dailyTimetable.length > 0 ? (
                    dailyTimetable.map((item, index) => renderPeriod(item, index))
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Icon name="calendar-outline" size={80} color="#e2e8f0" />
                            <Text style={styles.emptyEmoji}>🎉</Text>
                        </View>
                        <Text style={styles.emptyTitle}>No classes today</Text>
                        <Text style={styles.emptySubtitle}>Your schedule is clear. Enjoy the day.</Text>
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7FB',
    },

    dayTabsSection: {
        marginTop: 15,
        marginBottom: 5,
    },
    dayTabsContent: {
        paddingHorizontal: 2,
        paddingBottom: 12,
        flexDirection: 'row',
        gap: 8,
    },
    dayTabWrapper: {
        width: (width - 32 - 32) / 5.1,
    },
    dayTab: {
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.24)',
        paddingHorizontal: 10,
    },
    activeDayTab: {
        backgroundColor: '#F4B942',
        borderColor: '#F4B942',
        elevation: 3,
        shadowColor: '#F4B942',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.28,
        shadowRadius: 5,
    },
    dayTabText: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.82)',
        textTransform: 'uppercase',
    },
    activeDayTabText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#12233F',
        textTransform: 'uppercase',
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FFFFFF',
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 18,
    },

    // Period Card Styles
    periodCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#12233F',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    periodAccent: {
        width: 48,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    periodContent: {
        flex: 1,
        padding: 14,
    },
    periodTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    periodHeaderLeft: {
        flex: 1,
    },
    periodNumberBadge: {
        backgroundColor: '#E8F4F3',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    periodNumber: {
        fontSize: 11,
        fontWeight: '900',
        color: '#0F766E',
        letterSpacing: 0.5,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    periodTime: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    roomBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0FF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    roomText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#7B68EE',
    },
    subjectName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#12233F',
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    teacherSection: {
        gap: 10,
    },
    teacherCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    teacherAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#E8F4F3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    teacherInfo: {
        flex: 1,
    },
    teacherLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    teacherName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#26364F',
        marginTop: 2,
    },
    substituteCard: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    substituteGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
    },
    substituteInfo: {
        flex: 1,
    },
    substituteLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#5a6898',
        marginBottom: 3,
    },
    substituteName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#7c2d12',
    },
    cornerBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F4F7FB',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    cornerEmoji: {
        fontSize: 16,
    },

    // Break Card Styles
    breakCard: {
        borderRadius: 16,
        marginBottom: 12,
        padding: 16,
        overflow: 'hidden',
        position: 'relative',
        elevation: 3,
        shadowColor: '#0F766E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    breakDecor1: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        top: -20,
        right: -20,
    },
    breakDecor2: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        bottom: -15,
        left: -15,
    },
    breakContent: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    breakLeft: {
        marginRight: 14,
    },
    breakIconContainer: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    breakMiddle: {
        flex: 1,
    },
    breakBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 165, 0, 0.3)',
    },
    breakLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#5a6898',
        letterSpacing: 1,
    },
    breakTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#12233F',
        marginBottom: 3,
    },
    breakSubtext: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        fontStyle: 'italic',
    },
    breakRight: {
        alignItems: 'flex-end',
    },
    breakTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        marginBottom: 4,
    },
    breakTimeText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1e293b',
    },
    breakTimeTo: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94a3b8',
        marginBottom: 2,
    },
    breakTimeEnd: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
    },
    breakWave: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(15, 118, 110, 0.16)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    breakLine: {
        width: 24,
        height: 3,
        borderRadius: 2,
    },
    breakLineText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 1.2,
    },

    // Loading & Empty States
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 17,
        color: '#fff',
        fontWeight: '700',
    },
    loadingEmoji: {
        fontSize: 32,
        marginTop: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 64,
    },
    emptyIconContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    emptyEmoji: {
        position: 'absolute',
        fontSize: 32,
        top: -10,
        right: -10,
    },
    emptyTitle: {
        fontSize: 21,
        fontWeight: '900',
        color: '#12233F',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#64748B',
        fontWeight: '600',
    },
});

export default TimeTableScreen;