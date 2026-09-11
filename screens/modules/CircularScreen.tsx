import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    RefreshControl,
    Linking,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import BackButton from '../../components/common/BackButton';
import { useCirculars } from '../../hooks/useCircular';
import { getAuthenticatedUrl } from '../../api/generic.api';
import { CircularItem } from '../../types/circular.type';
import * as Sharing from 'expo-sharing';

const CircularScreen = () => {
    const navigation = useNavigation<any>();
    const { data: circulars, isLoading, isFetching, refetch } = useCirculars();

    const handleViewFile = async (filePath: string) => {
        if (!filePath) return;
        const uri = getAuthenticatedUrl(filePath);

        try {
            const supported = await Linking.canOpenURL(uri);
            if (supported) {
                await Linking.openURL(uri);
            } else {
                Alert.alert('Error', 'Unable to open file. Please copy the link or try another browser.');
            }
        } catch (error) {
            console.error('File view error:', error);
            Alert.alert('Error', 'Could not open the circular.');
        }
    };

    const renderItem = ({ item }: { item: CircularItem }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleViewFile(item.file_path)}
            activeOpacity={0.8}
        >
            <View style={styles.iconContainer}>
                <LinearGradient
                    colors={['#eff6ff', '#dbeafe']}
                    style={styles.iconCircle}
                >
                    <Icon name="document-text" size={28} color="#3b82f6" />
                </LinearGradient>
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.cardHeader}>
                    <Text style={styles.publishDate}>{item.publish_date}</Text>
                    <Icon name="chevron-forward" size={18} color="#cbd5e1" />
                </View>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

                <View style={styles.footer}>
                    <View style={styles.badge}>
                        <Icon name="attach" size={14} color="#64748b" />
                        <Text style={styles.badgeText}>Important Notice</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5a6898" />
                <Text style={styles.loadingText}>Loading Circulars...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ModuleHeader
                title="Circulars"
                subtitle="📋 Official Updates"
                actionIcon="notifications-outline"
                onActionPress={() => navigation.navigate('Notifications')}
            />

            <FlatList
                data={circulars}
                renderItem={renderItem}
                keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={refetch}
                        tintColor="#5a6898"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Icon name="mail-open-outline" size={80} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No circulars found.</Text>
                        <Text style={styles.emptySubtext}>Check back later for updates.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },

    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 20,
        marginBottom: 15,
        flexDirection: 'row',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    iconContainer: {
        marginRight: 15,
        justifyContent: 'center',
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    publishDate: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '700',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 5,
    },
    badgeText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#64748b',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 20,
        fontSize: 18,
        color: '#94a3b8',
        fontWeight: '700',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#cbd5e1',
        fontWeight: '600',
    },
});

export default CircularScreen;
