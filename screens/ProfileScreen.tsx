import React, { useState, useEffect, useRef } from 'react';
import { useUser, isStudent, isEmployee, isAdmin, isPrincipal, UserType } from '../hooks/useUser';
import { Student } from '../types/student.type';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import BackButton from '../components/common/BackButton';
import * as ImagePicker from 'expo-image-picker';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useRoleColors } from '../hooks/useRoleColors';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const brand = useRoleColors();
  const { width, horizontalPadding, contentMaxWidth, isTablet, scale, insets } = useResponsiveLayout();
  const [activeTab, setActiveTab] = useState('personal');
  const [editedUser, setEditedUser] = useState<UserType | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const {
    user,
    isPending,
    error,
    updateProfileImage,
    isUpdatingImage,
    refetch
  } = useUser();

  const isStudentUser = user && isStudent(user);
  const isEmployeeUser = user && isEmployee(user);
  const isAdminUser = user && isAdmin(user);

  useEffect(() => {
    if (user) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
      setEditedUser(user);
      setAvatarFailed(false);
    }
  }, [user]);

  useEffect(() => {
    // Animate tab indicator based on filtered tabs
    const currentTabs = [
      { id: 'personal', visible: true },
      { id: 'academic', visible: isStudent(user) || isEmployee(user) },
      { id: 'contact', visible: true },
    ].filter(t => t.visible);

    const index = currentTabs.findIndex(t => t.id === activeTab);
    if (index !== -1) {
      Animated.spring(tabIndicatorAnim, {
        toValue: index,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [activeTab, user]);

  const pickImage = async (mode: 'library' | 'camera') => {
    setImageModalVisible(false);

    try {
      if (mode === 'library') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'We need gallery permissions to upload images!');
          return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && user) {
          const asset = result.assets[0];
          updateProfileImage({
            image: {
              uri: asset.uri,
              name: asset.fileName || `profile_${Date.now()}.jpg`,
              type: asset.mimeType || 'image/jpeg',
            }
          });
        }
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'We need camera permissions to take photos!');
          return;
        }

        let result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && user) {
          const asset = result.assets[0];
          updateProfileImage({
            image: {
              uri: asset.uri,
              name: asset.fileName || `profile_${Date.now()}.jpg`,
              type: asset.mimeType || 'image/jpeg',
            }
          });
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  if (isPending) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading Profile</Text>
            <View style={styles.loadingDots}>
              <View style={[styles.dot, styles.dot1]} />
              <View style={[styles.dot, styles.dot2]} />
              <View style={[styles.dot, styles.dot3]} />
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.errorContent}>
          <Icon name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{(error as any)?.message || 'Failed to load profile'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.retryGradient}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const sanitizeImageUri = (img?: string | null): string | null => {
    if (!img || img === 'null' || img === 'undefined') return null;
    const value = String(img).trim();
    if (!value || value === 'photo.jpg') return null;
    if (value.startsWith('data:image')) return value;
    if (/^(https?:|file:|content:)/i.test(value)) return value;
    return null;
  };

  const getProfileDisplayName = () => {
    if (isStudent(user)) return `${user.firstName} ${user.lastName}`;
    if (isEmployee(user)) return `${user.firstName} ${user.lastName}`;
    if (isAdmin(user)) return user.name;
    return 'User';
  };

  const getProfileSubText = () => {
    if (isPrincipal(user)) return 'Principal • School Management';
    if (isStudent(user)) return `Class ${user.class} • Section ${user.section}`;
    if (isEmployee(user)) return `${user.designation} • ${user.department}`;
    if (isAdmin(user)) return user.role;
    return '';
  };

  const getProfileInitials = () => getProfileDisplayName()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  const profileImageUri =
    sanitizeImageUri(isStudent(user) ? user.studentImage : null) ||
    sanitizeImageUri((user as any).photo) ||
    sanitizeImageUri((user as any).emp_photo);
  const avatarSource = profileImageUri && !avatarFailed
    ? { uri: profileImageUri }
    : require('../assets/user.png');

  const InfoItem = ({ label, value, icon, color = '#6366F1' }: { label: string; value: string; icon: string; color?: string }) => (
    <Animated.View
      style={[
        styles.infoItem,
        {
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        }
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Text style={styles.itemIcon}>{icon}</Text>
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemValue}>{value || 'Not Available'}</Text>
      </View>
    </Animated.View>
  );

  const tabs = [
    { id: 'personal', label: 'Personal', icon: '👤', visible: true },
    { id: 'academic', label: 'Academic', icon: '🎓', visible: isStudent(user) || isEmployee(user) },
    { id: 'contact', label: 'Contact', icon: '📞', visible: true },
  ].filter(t => t.visible);

  const tabWidth = (Math.min(width, contentMaxWidth) - horizontalPadding * 2) / Math.max(tabs.length, 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Image Upload Modal */}
      {/* Image Upload Modal */}
      {/* <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setImageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profile Photo</Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                <Icon name="close-circle" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => pickImage('camera')}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalOptionGradient}
              >
                <Icon name="camera" size={24} color="#fff" />
                <Text style={styles.modalOptionText}>Take Photo</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => pickImage('library')}
            >
              <LinearGradient
                colors={['#EC4899', '#5a6898']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalOptionGradient}
              >
                <Icon name="images" size={24} color="#fff" />
                <Text style={styles.modalOptionText}>Choose from Gallery</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal> */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isUpdatingImage}
            onRefresh={() => refetch()}
            tintColor="#6366F1"
            colors={['#6366F1', '#8B5CF6']}
          />
        }
      >
        {/* Header Section */}
        <LinearGradient
          colors={brand.headerGradient}
          start={brand.headerStart}
          end={brand.headerEnd}
          style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 16, paddingHorizontal: horizontalPadding }]}
        >
          <View style={styles.headerTop}>
            <BackButton color={brand.primaryDark} backgroundColor="#FFFFFF" size={48} iconSize={22} style={styles.backButton} />
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => navigation.navigate('SwitchUser')}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Switch user"
              >
                <View style={styles.settingsBtnInner}>
                  <Icon name="swap-horizontal" size={22} color={brand.primaryDark} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => navigation.navigate('Settings')}
                activeOpacity={0.7}
              >
                <View style={styles.settingsBtnInner}>
                  <Icon name="settings-outline" size={22} color={brand.primaryDark} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View
            style={[
              styles.profileHeader,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            {/* Profile Image Container */}
            <View style={styles.imageWrapper}>
              <View style={styles.imageOuterRing}>
                <View style={styles.imageInnerRing}>
                  {profileImageUri && !avatarFailed ? (
                    <Image
                      source={avatarSource}
                      style={styles.profileImage}
                      onError={() => setAvatarFailed(true)}
                    />
                  ) : (
                    <View style={styles.initialsAvatar}>
                      <Text style={styles.initialsText}>{getProfileInitials()}</Text>
                    </View>
                  )}
                  {isUpdatingImage && (
                    <View style={styles.imageLoadingOverlay}>
                      <ActivityIndicator color="#fff" size="large" />
                    </View>
                  )}
                </View>
              </View>

              {/* Upload Button */}
              {/* Upload Button */}
              {/* <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => setImageModalVisible(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#EC4899', '#5a6898']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.uploadBtnGradient}
                >
                  <Icon name="cloud-upload" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity> */}

              {/* Status Badge */}
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
              </View>
            </View>

            <View style={styles.nameSection}>
              <Text style={styles.nameText} numberOfLines={1}>
                {getProfileDisplayName()}
              </Text>
              <View style={styles.roleTag}>
                <Icon name={isStudentUser ? 'school-outline' : 'briefcase-outline'} size={14} color="#0f766e" />
                <Text style={styles.roleText}>{getProfileSubText()}</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.mainContent}>
          {/* Enhanced Tab Bar */}
          <Animated.View
            style={[
              styles.tabBar,
              {
                transform: [{ translateY: slideAnim }],
                opacity: fadeAnim,
              }
            ]}
          >
            {/* Animated Indicator */}
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  width: tabWidth,
                  transform: [
                    {
                      translateX: tabs.length > 1
                        ? tabIndicatorAnim.interpolate({
                            inputRange: [0, Math.max(tabs.length - 1, 1)],
                            outputRange: [0, tabWidth * Math.max(tabs.length - 1, 0)],
                          })
                        : 0,
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tabIndicatorGradient}
              />
            </Animated.View>

            {/* Tab Items */}
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.activeTabLabel
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Details Section */}
          <Animated.View style={[
            styles.detailsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            {activeTab === 'personal' && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Personal Information</Text>
                    <Text style={styles.cardSubtitle}>Your basic details</Text>
                  </View>
                  <View style={styles.cardIconBox}>
                    <Text style={styles.cardIcon}>✨</Text>
                  </View>
                </View>
                {isStudent(user) || isEmployee(user) ? (
                  <>
                    <InfoItem icon="👤" label="Full Name" value={`${(user as any).firstName} ${(user as any).lastName}`} color="#6366F1" />
                    <InfoItem icon="⚧" label="Gender" value={(user as any).gender} color="#8B5CF6" />
                    <InfoItem icon="🎂" label="Date of Birth" value={(user as any).dateOfBirth} color="#EC4899" />
                    {isStudent(user) && <InfoItem icon="🩸" label="Blood Group" value={(user as any).bloodGroup || 'Not Specified'} color="#EF4444" />}
                  </>
                ) : isAdmin(user) ? (
                  <>
                    <InfoItem icon="👤" label="Name" value={(user as any).name} color="#6366F1" />
                    <InfoItem icon="🛡️" label="Role" value={(user as any).role} color="#8B5CF6" />
                  </>
                ) : null}
              </View>
            )}

            {activeTab === 'academic' && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>
                      {isStudent(user) ? 'Academic Details' : 'Employment Details'}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {isStudent(user) ? 'Your academic information' : 'Your job information'}
                    </Text>
                  </View>
                  <View style={styles.cardIconBox}>
                    <Text style={styles.cardIcon}>🎓</Text>
                  </View>
                </View>
                {isStudent(user) ? (
                  <>
                    <InfoItem icon="🆔" label="Student ID" value={(user as any).studentId} color="#6366F1" />
                    <InfoItem icon="📝" label="Admission Number" value={(user as any).admissionNumber} color="#8B5CF6" />
                    <InfoItem icon="📅" label="Academic Year" value={(user as any).academicYear} color="#EC4899" />
                  </>
                ) : isEmployee(user) ? (
                  <>
                    <InfoItem icon="🆔" label="Employee ID" value={(user as any).employeeId} color="#6366F1" />
                    <InfoItem icon="🏢" label="Department" value={(user as any).department} color="#8B5CF6" />
                    <InfoItem icon="👔" label="Designation" value={(user as any).designation} color="#EC4899" />
                    <InfoItem icon="📅" label="Joining Date" value={(user as any).joiningDate} color="#5a6898" />
                  </>
                ) : null}
              </View>
            )}

            {activeTab === 'contact' && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>Contact Information</Text>
                    <Text style={styles.cardSubtitle}>How to reach you</Text>
                  </View>
                  <View style={styles.cardIconBox}>
                    <Text style={styles.cardIcon}>📞</Text>
                  </View>
                </View>
                <InfoItem icon="📱" label="Primary Number" value={isStudent(user) ? (user as any).primaryMobile : (user as any).mobile} color="#6366F1" />
                <InfoItem icon="📧" label="Email Address" value={(user as any).email || 'N/A'} color="#8B5CF6" />

                {isStudent(user) && (
                  <>
                    <InfoItem icon="📞" label="Secondary Number" value={(user as any)?.secondaryMobile} color="#EC4899" />
                    <InfoItem icon="📍" label="Address" value={`${(user as any)?.currentAddress?.addressLine1 ? (user as any).currentAddress.addressLine1 + ', ' : ''}${(user as any)?.currentAddress?.city}, ${(user as any)?.currentAddress?.state} - ${(user as any)?.currentAddress?.pincode}`} color="#5a6898" />

                    <View style={styles.separator} />

                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Guardian Information</Text>
                      <Text style={styles.sectionIcon}>👨‍👩‍👦</Text>
                    </View>
                    <InfoItem icon="👨" label="Father's Name" value={(user as any)?.father?.name} color="#6366F1" />
                    <InfoItem icon="📱" label="Father's Mobile" value={(user as any)?.father?.mobile} color="#8B5CF6" />
                  </>
                )}

                {isEmployee(user) && (
                  <InfoItem icon="📍" label="Address" value={`${(user as any)?.address?.addressLine1 ? (user as any).address.addressLine1 + ', ' : ''}${(user as any)?.address?.city}, ${(user as any)?.address?.state} - ${(user as any)?.address?.pincode}`} color="#EC4899" />
                )}
              </View>
            )}
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Icon name="sparkles" size={16} color="#6366F1" />
            <Text style={styles.footerText}>Your AIPS profile</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  header: {
    paddingBottom: 34,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'transparent',
    top: -100,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'transparent',
    bottom: 20,
    left: -40,
  },
  circle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    top: 100,
    right: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    zIndex: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  settingsBtnInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 5,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: 0,
  },
  imageOuterRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  imageInnerRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  profileImage: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  initialsAvatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#d8f3ef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#0f766e',
    fontSize: 25,
    fontWeight: '800',
  },
  uploadBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  uploadBtnGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 22,
  },
  statusBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameSection: {
    alignItems: 'flex-start',
    flex: 1,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 9,
    textAlign: 'left',
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d8f3ef',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  roleText: {
    fontSize: 13,
    color: '#0f766e',
    fontWeight: '700',
  },
  mainContent: {
    marginTop: -8,
    paddingHorizontal: 16,
    paddingBottom: 60, // Extra space at bottom
  },
  tabBar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 3,
    elevation: 4,
    shadowColor: '#26345f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 16,
    position: 'relative',
    flexDirection: 'row',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    zIndex: 0,
    borderRadius: 12,
  },
  tabIndicatorGradient: {
    flex: 1,
    borderRadius: 9,
    backgroundColor: '#424e79',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabLabel: {
    color: '#fff',
    fontWeight: '700',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    minHeight: 320,
    elevation: 2,
    shadowColor: '#26345f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e9f2',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  sectionIcon: {
    fontSize: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, // Increased spacing for professionalism
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemIcon: {
    fontSize: 24,
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalOption: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default ProfileScreen;