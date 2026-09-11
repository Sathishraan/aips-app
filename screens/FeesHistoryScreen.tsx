import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
    Alert,
    Linking,
    Animated,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Share
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import { downloadAsync, documentDirectory, getContentUriAsync, getInfoAsync } from 'expo-file-system/legacy';
import ModuleHeader from '../components/common/ModuleHeader';
import { useFeesHistory } from '../hooks/useFees';
import { FeeHistoryRecord } from '../types/fees.type';
import { getAuthToken } from '../api/base';

export default function FeesHistoryScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    const { data: historyData, isLoading, error, refetch, isRefetching } = useFeesHistory();

    useEffect(() => {
        if (!isLoading) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isLoading]);

    const handleViewInvoice = async (url?: string, invoiceSlip?: string) => {
        console.log('--- Fee Invoice View Initiative ---');
        console.log('Target URL:', url);
        console.log('Invoice Slip (Filename):', invoiceSlip);

        if (!url || !invoiceSlip) {
            console.error('View cancelled: Missing URL or Invoice Slip');
            Alert.alert('Error', 'Invoice information is missing.');
            return;
        }

        try {
            setProcessingId(invoiceSlip);

            // Use the authenticated remote URL directly instead of downloading to local file
            // to satisfy the "not file/ like" requirement (avoiding file:// scheme)
            const supported = await Linking.canOpenURL(url);

            if (supported) {
                await Linking.openURL(url);
            } else {
                console.error('URL not supported:', url);
                throw new Error('Viewer not supported on this device');
            }
        } catch (err) {
            console.error('Catch block error in handleViewInvoice:', err);
            Alert.alert(
                'View Failed',
                'Unable to open the invoice directly. Would you like to share the link instead?',
                [
                    {
                        text: 'Share Link',
                        onPress: () => Share.share({ url: url })
                    },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        } finally {
            setProcessingId(null);
        }
    };

    const filteredHistory = historyData?.filter(item =>
        String(item.invoiceId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(item.paymentDate || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <StatusBar barStyle="light-content" />
                <ActivityIndicator size="large" color="#5a6898" />
                <Text style={styles.loadingText}>Fetching payment records...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.center, { padding: 30 }]}>
                <StatusBar barStyle="light-content" />
                <View style={styles.errorIconContainer}>
                    <Icon name="alert-circle" size={60} color="#ef4444" />
                </View>
                <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
                <Text style={styles.errorMessage}>{(error as any).message || 'Unable to load payment history'}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => refetch()}
                >
                    <Icon name="refresh-outline" size={20} color="#fff" />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ModuleHeader
                title="History"
                subtitle="📄 Fee Payment Records"
            >
               
            </ModuleHeader>

            <Animated.ScrollView
                style={[styles.content, { opacity: fadeAnim, transform: [{ translateY }] }]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#5a6898" />
                }
            >
                {filteredHistory.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Icon name="receipt-outline" size={50} color="#e2e8f0" />
                        </View>
                        <Text style={styles.emptyText}>
                            {searchQuery ? 'No matching records found' : 'No payment history available'}
                        </Text>
                        <Text style={styles.emptySubText}>
                            Recent payments will appear here once processed
                        </Text>
                    </View>
                ) : (
                    filteredHistory.map((item, index) => (
                        <View key={item.invoiceSlip} style={styles.card}>
                            <View style={styles.cardAccent} />
                            <View style={styles.cardContent}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <View style={styles.invoiceRow}>
                                            <Icon name="document-text-outline" size={14} color="#64748b" />
                                            <Text style={styles.invoiceId}>#{item.invoiceId}</Text>
                                        </View>
                                        <Text style={styles.date}>{item.paymentDate}</Text>
                                    </View>
                                    <View style={styles.amountContainer}>
                                        <Text style={styles.totalAmount}>₹{parseFloat(item.totalAmount).toLocaleString()}</Text>
                                        <View style={styles.paidBadge}>
                                            <Icon name="checkmark-circle" size={12} color="#10b981" />
                                            <Text style={styles.paidBadgeText}>SUCCESS</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.detailsSection}>
                                    <Text style={styles.detailsTitle}>FEE BREAKDOWN</Text>
                                    {item.fees_details && Object.entries(item.fees_details).map(([key, value], i) => (
                                        <View key={i} style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{key}</Text>
                                            <Text style={styles.detailValue}>₹{parseFloat(value).toLocaleString()}</Text>
                                        </View>
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.downloadButton,
                                        processingId === item.invoiceSlip && styles.downloadingButton
                                    ]}
                                    onPress={() => handleViewInvoice(item.invoiceFullUrl, item.invoiceSlip)}
                                    disabled={processingId === item.invoiceSlip}
                                >

                                    <LinearGradient
                                        colors={processingId === item.invoiceSlip ? ['#f1f5f9', '#e2e8f0'] : ['#f8fafc', '#f1f5f9']}
                                        style={styles.downloadGradient}
                                    >
                                        {processingId === item.invoiceSlip ? (
                                            <ActivityIndicator size="small" color="#5a6898" />
                                        ) : (
                                            <Icon name="eye" size={20} color="#5a6898" />
                                        )}
                                        <Text style={[styles.downloadText, processingId === item.invoiceSlip && styles.downloadingText]}>
                                            {processingId === item.invoiceSlip ? 'Opening...' : 'View Invoice'}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeCount: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    badgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
        marginTop: 15,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1e293b',
        fontWeight: '500',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 15,
        color: '#64748b',
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        marginBottom: 18,
        flexDirection: 'row',
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    cardAccent: {
        width: 6,
        backgroundColor: '#5a6898',
    },
    cardContent: {
        flex: 1,
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    invoiceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    invoiceId: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        letterSpacing: 0.5,
    },
    date: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
        marginTop: 4,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    totalAmount: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1e293b',
    },
    paidBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginTop: 6,
        gap: 4,
    },
    paidBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10b981',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 18,
    },
    detailsSection: {
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 16,
        marginBottom: 18,
    },
    detailsTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94a3b8',
        marginBottom: 12,
        letterSpacing: 1,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailLabel: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '600',
    },
    detailValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '700',
    },
    downloadButton: {
        borderRadius: 15,
        overflow: 'hidden',
    },
    downloadGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 10,
    },
    downloadText: {
        color: '#5a6898',
        fontWeight: '800',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    downloadingButton: {
        opacity: 0.8,
    },
    downloadingText: {
        color: '#94a3b8',
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
    errorIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 10,
    },
    errorMessage: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 20,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5a6898',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 15,
        gap: 8,
        elevation: 4,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
