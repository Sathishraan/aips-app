import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Platform } from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import ModuleHeader from '../../components/common/ModuleHeader';
import BackButton from '../../components/common/BackButton';

const { width } = Dimensions.get('window');

const OfficeManagementScreen = ({ navigation }: any) => {
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

  const tasks = [
    { id: 1, title: 'Staff Meeting', status: 'Pending', priority: 'High', assignee: 'Admin' },
    { id: 2, title: 'Budget Review', status: 'In Progress', priority: 'Medium', assignee: 'Finance' },
    { id: 3, title: 'Facility Maintenance', status: 'Completed', priority: 'Low', assignee: 'Operations' },
    { id: 4, title: 'Policy Update', status: 'Pending', priority: 'High', assignee: 'HR' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#10b981';
      case 'In Progress': return '#3b82f6';
      case 'Pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#64748b';
    }
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
        title="Office"
        subtitle="🏢 Management & Tasks"
        actionIcon="briefcase-outline"
        onActionPress={() => { }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>87</Text>
            <Text style={styles.statLabel}>Staff Members</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>23</Text>
            <Text style={styles.statLabel}>Active Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Pending Approvals</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Tasks</Text>
        {tasks.map((task, index) => (
          <Animated.View
            key={task.id}
            style={[
              styles.taskCard,
              {
                opacity: fadeAnim,
                transform: [{
                  translateX: slideAnim.interpolate({
                    inputRange: [0, width],
                    outputRange: [0, 50]
                  })
                }]
              }
            ]}
          >
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <View style={styles.taskMeta}>
                <Text style={[styles.taskStatus, { color: getStatusColor(task.status) }]}>
                  {task.status}
                </Text>
                <Text style={[styles.taskPriority, { color: getPriorityColor(task.priority) }]}>
                  {task.priority}
                </Text>
                <Text style={styles.taskAssignee}>{task.assignee}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Add New Task</Text>
        </TouchableOpacity>
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
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#424e79',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 15,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  taskStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
  },
  taskPriority: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 10,
  },
  taskAssignee: {
    fontSize: 14,
    color: '#64748b',
  },
  viewButton: {
    backgroundColor: '#424e79',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#424e79',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#424e79',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default OfficeManagementScreen;
