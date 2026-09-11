import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import BackButton from '../../components/common/BackButton';

const { width } = Dimensions.get('window');

const StudentManagementScreen = ({ navigation }: any) => {
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

  const students = [
    { id: 1, name: 'Alice Johnson', class: 'II', section: 'A', rollNo: '1', image: 'https://i.pravatar.cc/150?u=1' },
    { id: 2, name: 'Bob Smith', class: 'II', section: 'A', rollNo: '2', image: 'https://i.pravatar.cc/150?u=2' },
    { id: 3, name: 'Charlie Brown', class: 'II', section: 'B', rollNo: '1', image: 'https://i.pravatar.cc/150?u=3' },
    { id: 4, name: 'Diana Prince', class: 'II', section: 'B', rollNo: '2', image: 'https://i.pravatar.cc/150?u=4' },
  ];

  const stats = [
    { label: 'Total', value: '1,234', icon: 'people', color: ['#4facfe', '#00f2fe'] },
    { label: 'Active', value: '1,180', icon: 'checkmark-circle', color: ['#43e97b', '#38f9d7'] },
    { label: 'New', value: '45', icon: 'star', color: ['#fa709a', '#fee140'] },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Animated.View
        style={[
          styles.mainContent,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <ModuleHeader
          title="Students"
          subtitle="🎓 Records & Management"
          actionIcon="search-outline"
          onActionPress={() => { }}
        />

        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <LinearGradient
                  colors={stat.color as any}
                  style={styles.statIconGradient}
                >
                  <Icon name={stat.icon as any} size={18} color="#fff" />
                </LinearGradient>
                <View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Students</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {students.map((student, index) => (
            <TouchableOpacity
              key={student.id}
              activeOpacity={0.7}
              onPress={() => { }}
            >
              <Animated.View
                style={[
                  styles.studentCard,
                  {
                    transform: [{
                      translateY: slideAnim.interpolate({
                        inputRange: [0, width],
                        outputRange: [0, 50]
                      })
                    }]
                  }
                ]}
              >
                <Image source={{ uri: student.image }} style={styles.studentAvatar} />
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentDetails}>
                    Class {student.class} • Section {student.section} • Roll {student.rollNo}
                  </Text>
                </View>
                <View style={styles.arrowIcon}>
                  <Icon name={"chevron-forward" as any} size={20} color="#cbd5e1" />
                </View>
              </Animated.View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#424e79', '#5a6898']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name={"add-circle-outline" as any} size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Register New Student</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  mainContent: {
    flex: 1,
  },

  searchButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  viewAllText: {
    color: '#424e79',
    fontWeight: '700',
    fontSize: 14,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  studentAvatar: {
    width: 55,
    height: 55,
    borderRadius: 20,
    marginRight: 15,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  studentDetails: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  arrowIcon: {
    padding: 5,
  },
  actionButton: {
    marginTop: 10,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#424e79',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default StudentManagementScreen;
