import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ModuleHeader from '../components/common/ModuleHeader';
import { useFeesDetails } from '../hooks/useFees';
import { FeeSubCategory } from '../types/fees.type';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export default function FeesScreen({ navigation: navProp, embedded }: { navigation?: any; embedded?: boolean }) {
  const navigation = navProp || useNavigation<any>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const { horizontalPadding, contentMaxWidth, isTablet } = useResponsiveLayout();

  const { data: feesData, isLoading } = useFeesDetails();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const totalPaid = feesData?.prepaid_fees_details
    ? Object.values(feesData.prepaid_fees_details).reduce(
      (acc, curr) => acc + parseFloat(curr),
      0
    )
    : 0;

  // Calculate total fees and pending
  const totalFees = feesData?.subcategorys_list
    ? Object.values(feesData.subcategorys_list).reduce(
      (acc, item) => acc + (parseFloat(item.fee_amount || '0') || 0),
      0
    )
    : 0;

  const totalPending = Math.max(0, totalFees - totalPaid);
  const paidCount = feesData?.prepaid_fees_details
    ? Object.keys(feesData.prepaid_fees_details).length
    : 0;
  const totalCount = feesData?.subcategorys_list
    ? Object.keys(feesData.subcategorys_list).length
    : 0;

  const renderReceiptBar = () => (
    <View style={styles.receiptBar}>
      <LinearGradient
        colors={['#5a6898', '#424e79']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.receiptGradient}
      >
        <View style={styles.receiptContent}>
          <View style={styles.receiptLeft}>
            <Icon name="receipt" size={24} color="#fff" />
            <View style={styles.receiptTextContainer}>
              <Text style={styles.receiptTitle}>Fee Receipt</Text>
              <Text style={styles.receiptSubtitle}>
                {paidCount} of {totalCount} items paid
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={() => navigation.navigate('FeesHistory')}
            activeOpacity={0.8}
          >
            <Text style={styles.receiptButtonText}>View All</Text>
            <Icon name="chevron-forward" size={16} color="#5a6898" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const renderFeeItem = (key: string, item: FeeSubCategory) => {
    const paidAmount = feesData?.prepaid_fees_details?.[item.fee_name_id];
    const feeAmount = parseFloat(item.fee_amount || '0') || 0;
    const isPaid = !!paidAmount;
    const paidValue = isPaid ? parseFloat(paidAmount || '0') : 0;
    const pendingValue = Math.max(0, feeAmount - paidValue);
    const progressPercentage = feeAmount > 0 ? (paidValue / feeAmount) * 100 : 0;

    return (
      <View key={key} style={styles.feeCard}>
        {/* Header with Fee Name and Status */}
        <View style={styles.feeHeader}>
          <View style={styles.feeNameContainer}>
            <View style={[styles.feeIcon, isPaid ? styles.paidIcon : styles.pendingIcon]}>
              <Icon
                name={isPaid ? 'checkmark-circle' : 'time-outline'}
                size={20}
                color={isPaid ? '#10b981' : '#f59e0b'}
              />
            </View>
            <View>
              <Text style={styles.feeName}>{item.fee_name}</Text>
              <Text style={styles.feeCategory}>School Fee</Text>
            </View>
          </View>
          <View style={[styles.statusChip, isPaid ? styles.paidChip : styles.pendingChip]}>
            <View style={[styles.statusDot, isPaid ? styles.paidDot : styles.pendingDot]} />
            <Text style={[styles.statusLabel, isPaid ? styles.paidLabel : styles.pendingLabel]}>
              {isPaid ? 'Paid' : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Amount Details */}
        <View style={styles.amountContainer}>
          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Total Amount</Text>
              <Text style={styles.amountValue}>₹{feeAmount.toLocaleString()}</Text>
            </View>
            {isPaid && (
              <View style={styles.amountDivider} />
            )}
            {isPaid && (
              <View style={styles.amountItem}>
                <Text style={styles.amountLabel}>Paid</Text>
                <Text style={[styles.amountValue, styles.paidValue]}>
                  ₹{paidValue.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {!isPaid && pendingValue > 0 && (
            <View style={styles.pendingAmountBox}>
              <Icon name="alert-circle-outline" size={18} color="#f59e0b" />
              <Text style={styles.pendingAmountText}>
                ₹{pendingValue.toLocaleString()} pending
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        {feeAmount > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Payment Progress</Text>
              <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: isPaid ? '#10b981' : '#f59e0b',
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Action Button */}
        {!isPaid && (
          <TouchableOpacity style={styles.payButton} activeOpacity={0.7}>
            <LinearGradient
              colors={['#5a6898', '#424e79']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.payButtonGradient}
            >
              <Icon name="card-outline" size={18} color="#fff" />
              <Text style={styles.payButtonText}>Pay Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isPaid && (
          <TouchableOpacity style={styles.receiptLink} onPress={() => navigation.navigate('FeesHistory')} activeOpacity={0.7}>
            <Icon name="document-text-outline" size={16} color="#5a6898" />
            <Text style={styles.receiptLinkText}>View Receipt</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!embedded && (
        <>
          <StatusBar barStyle="light-content" />
          <ModuleHeader
            title="Fee Payments"
            subtitle="💳 Payment Overview"
            actionIcon="download-outline"
            onActionPress={() => navigation.navigate('FeesHistory')}
          />
        </>
      )}

      {/* Summary Cards */}
      <View style={[styles.summarySection, { paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.summaryScrollContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
          <View style={[styles.summaryCard, isTablet && styles.summaryCardTablet]}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryGradient}
            >
              <Icon name="checkmark-circle" size={32} color="#fff" style={styles.summaryIcon} />
              <Text style={styles.summaryLabel}>Total Paid</Text>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
                {isLoading ? '...' : `₹${totalPaid.toLocaleString()}`}
              </Text>
            </LinearGradient>
          </View>

          <View style={[styles.summaryCard, isTablet && styles.summaryCardTablet]}>
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryGradient}
            >
              <Icon name="time" size={32} color="#fff" style={styles.summaryIcon} />
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
                {isLoading ? '...' : `₹${totalPending.toLocaleString()}`}
              </Text>
            </LinearGradient>
          </View>

          <View style={[styles.summaryCard, isTablet && styles.summaryCardTablet]}>
            <LinearGradient
              colors={['#5a6898', '#5a6898']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryGradient}
            >
              <Icon name="wallet" size={32} color="#fff" style={styles.summaryIcon} />
              <Text style={styles.summaryLabel}>Total Fees</Text>
              <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
                {isLoading ? '...' : `₹${totalFees.toLocaleString()}`}
              </Text>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* Receipt Bar */}
      {renderReceiptBar()}

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fee Breakdown</Text>
            <Text style={styles.sectionSubtitle}>
              {paidCount} paid • {totalCount - paidCount} pending
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Icon name="hourglass-outline" size={40} color="#cbd5e1" />
              <Text style={styles.loadingText}>Loading fees details...</Text>
            </View>
          ) : feesData && feesData.subcategorys_list ? (
            Object.entries(feesData.subcategorys_list).map(([key, item]) =>
              renderFeeItem(key, item)
            )
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="receipt-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>No fee details available</Text>
            </View>
          )}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoIconContainer}>
              <Icon name="information-circle" size={24} color="#5a6898" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Payment Information</Text>
              <Text style={styles.infoText}>
                • All online payments are secure and encrypted{'\n'}
                • Keep transaction ID for future reference{'\n'}
                • Receipt will be emailed after payment{'\n'}
                • Contact office for payment queries
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  summarySection: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryScrollContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 140,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#5a6898',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryCardTablet: {
    flexBasis: '31%',
    minWidth: 180,
  },
  summaryGradient: {
    padding: 20,
    alignItems: 'flex-start',
  },
  summaryIcon: {
    marginBottom: 12,
    opacity: 0.9,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  receiptBar: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#5a6898',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  receiptGradient: {
    padding: 16,
  },
  receiptContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  receiptTextContainer: {
    gap: 2,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  receiptSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  receiptButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  receiptButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  feeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#5a6898',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  feeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  feeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  feeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paidIcon: {
    backgroundColor: '#d1fae5',
  },
  pendingIcon: {
    backgroundColor: '#fef3c7',
  },
  feeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  feeCategory: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  paidChip: {
    backgroundColor: '#d1fae5',
  },
  pendingChip: {
    backgroundColor: '#fef3c7',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  paidDot: {
    backgroundColor: '#10b981',
  },
  pendingDot: {
    backgroundColor: '#f59e0b',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  paidLabel: {
    color: '#059669',
  },
  pendingLabel: {
    color: '#d97706',
  },
  amountContainer: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  amountItem: {
    flex: 1,
  },
  amountDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  paidValue: {
    color: '#10b981',
  },
  pendingAmountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  pendingAmountText: {
    fontSize: 14,
    color: '#d97706',
    fontWeight: '700',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '700',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  payButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  receiptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  receiptLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    fontWeight: '500',
  },
});