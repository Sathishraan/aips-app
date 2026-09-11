import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useUser, isStudent, isAdmin, isEmployee, isPrincipal } from '../hooks/useUser';
import { useAuth } from '../hooks/useAuth';
import { useHomework } from '../hooks/useHomework';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import * as RootNavigation from '../navigation/RootNavigation';
import { useRoleColors } from '../hooks/useRoleColors';

interface ModuleCardProps {
  title: string;
  icon: any;
  onPress: () => void;
  delay: number;
  color: string[];
  cardWidth: number;
  isTablet: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  icon,
  onPress,
  delay,
  color,
  cardWidth,
  isTablet,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const isRemoteUrl = typeof icon === 'string' && /^(https?:|file:|content:|data:)/i.test(icon);
  const isLocalAsset = typeof icon === 'number';
  const isImageUrl = isRemoteUrl || isLocalAsset;
  const iconBox = isTablet ? 64 : 48;
  const iconSize = isTablet ? 40 : 30;

  return (
    <Animated.View
      style={[
        styles.moduleCardWrapper,
        {
          width: cardWidth,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.moduleCard, isTablet && styles.moduleCardTablet]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <View style={[styles.moduleIconContainer, { width: iconBox, height: iconBox, borderRadius: isTablet ? 16 : 14 }]}>
          {isImageUrl ? (
            <Image
              source={isLocalAsset ? icon : { uri: icon }}
              style={{ width: iconSize, height: iconSize }}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.iconWrapper}>
              <Icon name={icon as any} size={isTablet ? 28 : 24} color={color?.[0] || '#5a6898'} />
            </View>
          )}
        </View>
        <Text
          style={[styles.moduleTitle, isTablet && styles.moduleTitleTablet]}
          numberOfLines={2}
          allowFontScaling
        >
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const HomeScreen = ({ navigation }: any) => {
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const profileScale = useRef(new Animated.Value(0.9)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const {
    width,
    columns,
    gap,
    horizontalPadding,
    contentMaxWidth,
    isTablet,
    scale,
    insets,
  } = useResponsiveLayout();

  const { user, isPending, isLoading, isFetching, error, refetch } = useUser();
  const brand = useRoleColors();
  const { forceLogout } = useAuth();
  const staffHome = !!(user && isEmployee(user) && !isPrincipal(user));
  useHomework(!staffHome);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const cardWidth = useMemo(() => {
    // Flex grid: fill available width evenly across columns
    const available = Math.min(width - horizontalPadding * 2, contentMaxWidth);
    const totalGap = gap * (columns - 1);
    return Math.max(88, Math.floor((available - totalGap) / columns));
  }, [width, horizontalPadding, contentMaxWidth, gap, columns]);

  // Checking for profile availability
  const student = user && isStudent(user) ? user : null;
  const employee = user && isEmployee(user) ? user : null;
  const admin = user && isAdmin(user) ? user : null;
  const hasProfile = student || employee || admin;

  useEffect(() => {
    if (!isPending && !isLoading && hasProfile) {
      Animated.parallel([
        Animated.timing(headerOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(profileScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isPending, isLoading, hasProfile]);

  const sanitizeImageUri = (img?: string | null): string | null => {
    if (!img || img === 'null' || img === 'undefined') return null;
    const value = String(img).trim();
    if (!value || value === 'photo.jpg') return null;
    if (value.startsWith('data:image')) return value;
    if (/^(https?:|file:|content:)/i.test(value)) return value;
    return null;
  };

  const avatarUri =
    sanitizeImageUri(student?.studentImage) ||
    sanitizeImageUri((user as any)?.photo);

  const avatarSource = avatarUri && !avatarFailed
    ? { uri: avatarUri }
    : require('../assets/user.png');

  // Initial loading state
  if ((isPending || isLoading) && !hasProfile && !error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="light-content" backgroundColor={brand.primary} />
        <ActivityIndicator size="large" color={brand.primary} />
        <Text style={styles.loadingText}>Loading Sparkle Skool...</Text>
      </View>
    );
  }

  // Error or Missing Profile state
  if (error || !hasProfile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="light-content" backgroundColor={brand.primary} />
        <View style={styles.errorIconContainer}>
          <Icon name="alert-circle-outline" size={80} color={brand.primary} />
        </View>

        <Text style={styles.errorTitle}>Connection Issue</Text>
        <Text style={styles.errorSubtitle}>
          We couldn't load your profile. Please check your connection and try again.
        </Text>

        <TouchableOpacity
          style={[styles.retryButton, isFetching && { opacity: 0.7 }]}
          onPress={async () => {
            await forceLogout();
            RootNavigation.navigationRef.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }}
          disabled={isFetching}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[...brand.headerGradient]}
            start={brand.headerStart}
            end={brand.headerEnd}
            style={styles.retryGradient}
          >
            <Icon name="log-in-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.retryText}>Go to Login</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }


  const displayName = user
    ? (isStudent(user)
        ? `${user.firstName} ${user.lastName}`.trim()
        : `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || (user as any).name || 'User')
    : 'User';

  const allModules = [
    { title: 'Homework', icon: require('../assets/module_icons/homework.png'), screen: 'Homework', color: ['#5a6898', '#424e79'] },
    { title: 'Exams', icon: require('../assets/module_icons/exam.png'), screen: 'ExamResults', color: ['#6674a8', '#424e79'] },
    { title: 'Result', icon: require('../assets/module_icons/result.png'), screen: 'Result', color: ['#3d5a9a', '#2d3660'] },
    { title: 'Attendance', icon: require('../assets/module_icons/immigration.png'), screen: 'Attendance', color: ['#424e79', '#2d3660'] },
    { title: 'Contact', icon: require('../assets/module_icons/telephone.png'), screen: 'Contact', color: ['#5a6898', '#424e79'] },
    { title: 'Time Table', icon: require('../assets/module_icons/calendar.png'), screen: 'TimeTable', color: ['#3d5a9a', '#2d3660'] },
    { title: 'Calendar', icon: require('../assets/module_icons/calendar.png'), screen: 'SchoolCalendar', color: ['#6674a8', '#424e79'] },
    { title: 'Events', icon: require('../assets/module_icons/event-list.png'), screen: 'Events', color: ['#424e79', '#2d3660'] },
    { title: 'Gallery', icon: require('../assets/module_icons/apple.png'), screen: 'Gallery', color: ['#5a6898', '#424e79'] },
    { title: 'Circular', icon: require('../assets/module_icons/website.png'), screen: 'Circular', color: ['#3d5a9a', '#2d3660'] },
    { title: 'Chat', icon: require('../assets/module_icons/communication.png'), screen: 'Communication', color: ['#424e79', '#2d3660'] },
    { title: 'Remarks', icon: require('../assets/module_icons/people.png'), screen: 'Remarks', color: ['#3d5a9a', '#2d3660'] },
    { title: 'Videos', icon: require('../assets/module_icons/video.png'), screen: 'Videos', color: ['#6674a8', '#424e79'] },
    { title: 'Leave', icon: require('../assets/module_icons/leave.png'), screen: 'LeaveRequest', color: ['#424e79', '#2d3660'] },
    { title: 'Fees', icon: require('../assets/module_icons/credit-card.png'), screen: 'Fees', color: ['#3d5a9a', '#2d3660'] },
  ];

  // Staff-only modules — Chat opens communication flow (ChatList)
  const staffModules = [
    { title: 'Homework', icon: require('../assets/module_icons/homework.png'), screen: 'StaffHomework', color: ['#eebd89', '#d13abd'] },
    { title: 'Attendance', icon: require('../assets/module_icons/immigration.png'), screen: 'StaffAttendance', color: ['#eebd89', '#d13abd'] },
    { title: 'Gallery', icon: require('../assets/module_icons/apple.png'), screen: 'Gallery', color: ['#eebd89', '#d13abd'] },
    { title: 'Mark Entry', icon: require('../assets/module_icons/exam.png'), screen: 'StaffMarkEntry', color: ['#eebd89', '#d13abd'] },
    { title: 'Leave', icon: require('../assets/module_icons/leave.png'), screen: 'StaffLeave', color: ['#eebd89', '#d13abd'] },
    { title: 'Remarks', icon: require('../assets/module_icons/people.png'), screen: 'StaffRemarks', color: ['#eebd89', '#d13abd'] },
    { title: 'Chat', icon: require('../assets/module_icons/communication.png'), screen: 'Communication', color: ['#eebd89', '#d13abd'] },
  ];

  // Filter modules based on user role
  const principalModules = allModules.map((module) =>
    module.screen === 'LeaveRequest'
      ? { ...module, screen: 'StaffLeave' }
      : module
  );
  const modules = isPrincipal(user)
    ? principalModules
    : (isEmployee(user) ? staffModules : allModules);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={brand.primaryDark} />

      <LinearGradient
        colors={[...brand.headerGradient]}
        start={brand.headerStart}
        end={brand.headerEnd}
        style={[
          styles.gradientHeader,
          {
            paddingTop: Math.max(insets.top, 12) + 8,
            paddingHorizontal: horizontalPadding,
            paddingBottom: isTablet ? 28 : 20,
          },
        ]}
      >
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
            <View style={styles.topBar}>
            <View style={styles.logoSection}>
              <Image
                source={require('../assets/home-logo.png')}
                style={[styles.schoolLogo, isTablet && { width: 56, height: 56 }]}
                resizeMode="cover"
              />
              <View style={styles.schoolInfo}>
                <Text style={[styles.schoolName, { fontSize: scale(16) }]} numberOfLines={2} allowFontScaling>
                  Aadhithya International Public School
                </Text>
              </View>
            </View>
            {/* <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => RootNavigation.navigate('SwitchUser')}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Switch user"
              >
                <Icon name="swap-horizontal" size={22} color="#fff" />
              </TouchableOpacity>
            </View> */}
          </View>

          <Animated.View style={[styles.profileCardHeader, { transform: [{ scale: profileScale }], padding: isTablet ? 16 : 12 }]}>
            <View style={styles.profileRow}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={avatarSource}
                  style={[styles.avatarImage, isTablet && { width: 80, height: 80 }]}
                  resizeMode="cover"
                  onError={() => setAvatarFailed(true)}
                />
                <View style={styles.avatarBorder} />
              </View>

              <View style={styles.profileInfo}>
                <Text style={[styles.userName, { fontSize: scale(18) }]} numberOfLines={1} allowFontScaling>
                  {displayName}
                </Text>
                <View style={[styles.roleContainer, brand.isStaff && { backgroundColor: brand.primarySoft }]}>
                  <View style={[styles.roleDot, brand.isStaff && { backgroundColor: brand.primary }]} />
                  <Text style={[styles.roleText, brand.isStaff && { color: brand.primaryDark }]}>
                    {isPrincipal(user) ? 'Principal' : (student ? 'Student' : employee ? 'Staff' : 'Admin')}
                  </Text>
                </View>
              </View>
            </View>

            {student && (
              <View style={styles.quickInfo}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Class</Text>
                  <Text style={[styles.infoValue, { fontSize: scale(15) }]} numberOfLines={1}>{student.class || '--'}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Section</Text>
                  <Text style={[styles.infoValue, { fontSize: scale(15) }]} numberOfLines={1}>{student.section || '--'}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Year</Text>
                  <Text style={[styles.infoValue, { fontSize: scale(15) }]} numberOfLines={1}>{student.academicYear || '--'}</Text>
                </View>
              </View>
            )}

            {employee && !isPrincipal(user) && (
              <View style={styles.quickInfo}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>ID</Text>
                  <Text style={[styles.infoValue, { fontSize: scale(15) }]} numberOfLines={1}>
                    {employee.employeeNo || employee.employeeId || '--'}
                  </Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Role</Text>
                  <Text style={[styles.infoValue, { fontSize: scale(15) }]} numberOfLines={1}>
                    {employee.designation || 'Staff'}
                  </Text>
                </View>
              </View>
            )}

            {/* <TouchableOpacity
              style={styles.switchUserBtn}
              onPress={() => RootNavigation.navigate('SwitchUser')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Switch user"
            >
                <Icon name="people-outline" size={18} color={brand.primaryDark} />
                <Text style={[styles.switchUserText, brand.isStaff && { color: brand.primaryDark }]}>Switch User</Text>
                <Icon name="chevron-forward" size={16} color={brand.primary} />
            </TouchableOpacity> */}
          </Animated.View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            // Tab navigator already owns the system-nav inset; keep a light breathing gap
            paddingBottom: isTablet ? 32 : 20,
            paddingHorizontal: horizontalPadding,
            alignItems: isTablet ? 'center' : 'stretch',
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={brand.primary}
            colors={[brand.primary]}
          />
        }
      >
        <Animated.View
          style={[
            styles.modulesSection,
            {
              opacity: contentFade,
              width: '100%',
              maxWidth: contentMaxWidth,
              marginTop: isTablet ? 28 : 20,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: scale(22) }]} allowFontScaling>Modules</Text>
            <Text style={styles.sectionSubtitle} allowFontScaling>Access all modules</Text>
          </View>

          <View style={[styles.modulesGrid, { columnGap: gap, rowGap: gap }]}>
            {modules.map((module, index) => (
              <ModuleCard
                key={module.screen}
                title={module.title}
                icon={module.icon}
                onPress={() => navigation.navigate(module.screen)}
                delay={index * 40}
                color={module.color}
                cardWidth={cardWidth}
                isTablet={isTablet}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#eef0f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  errorSubtitle: {
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  retryButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#5a6898',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  gradientHeader: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: '#5a6898',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  headerContent: {
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  schoolLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  schoolInfo: {
    marginLeft: 12,
    flex: 1,
  },
  schoolName: {
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  schoolTagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginTop: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#424e79',
  },
  profileCardHeader: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  avatarBorder: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#5a6898',
    opacity: 0.3,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontWeight: '700',
    color: '#1a1f3c',
    marginBottom: 6,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef0f8',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5a6898',
    marginRight: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a6898',
    letterSpacing: 0.3,
  },
  quickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eef0f8',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#dde0f0',
  },
  switchUserBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eef0f8',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#c5cae8',
  },
  switchUserText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#424e79',
    textAlign: 'center',
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontWeight: '700',
    color: '#5a6898',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  modulesSection: {
    flexGrow: 1,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '800',
    color: '#1a1f3c',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#4a5080',
    fontWeight: '500',
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    width: '100%',
  },
  moduleCardWrapper: {
    // width set dynamically from layout columns
  },
  moduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    minHeight: 100,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a1f3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#dde0f0',
  },
  moduleCardTablet: {
    minHeight: 128,
    paddingVertical: 18,
    borderRadius: 18,
  },
  moduleIconContainer: {
    backgroundColor: '#eef0f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d3660',
    textAlign: 'center',
    lineHeight: 16,
    minHeight: 32,
    paddingHorizontal: 2,
  },
  moduleTitleTablet: {
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
  },
});

export default HomeScreen;