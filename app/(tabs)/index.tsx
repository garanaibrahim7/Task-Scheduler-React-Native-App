import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useTaskContext } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { TaskWithCompletion } from '@/types/tasks';
import { CheckCircle, Circle, Clock, AlertCircle, Trash2, RefreshCw, LogOut } from 'lucide-react-native';
import { useEffect, useState } from 'react';

export default function TasksScreen() {
  const { tasks, loading, stats, fetchTasks, toggleTaskCompletion, deleteTask, resetDailyTasks } = useTaskContext();
  const { user, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    await toggleTaskCompletion(taskId, !isCompleted);
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${taskTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTask(taskId),
        },
      ]
    );
  };

  const handleResetDaily = async () => {
    Alert.alert(
      'Reset Daily Tasks',
      'This will refresh the task list and reset completion status for new day.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            await resetDailyTasks();
            Alert.alert('Success', 'Daily tasks have been reset!');
          },
        },
      ]
    );
  };

  const isTaskOverdue = (task: TaskWithCompletion) => {
    if (task.isCompletedToday) return false;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = task.scheduled_time.split(':').map(Number);
    const taskTime = hours * 60 + minutes;
    return currentTime > taskTime + task.reminder_offset;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#64748b';
    }
  };

  const renderTask = ({ item }: { item: TaskWithCompletion }) => {
    const overdue = isTaskOverdue(item);

    return (
      <View style={[styles.taskCard, item.isCompletedToday && styles.taskCardCompleted]}>
        <TouchableOpacity
          style={styles.taskContent}
          onPress={() => handleToggleComplete(item.id, item.isCompletedToday)}
        >
          <View style={styles.taskLeft}>
            {item.isCompletedToday ? (
              <CheckCircle size={24} color="#10b981" />
            ) : (
              <Circle size={24} color="#64748b" />
            )}
            <View style={styles.taskInfo}>
              <Text
                style={[
                  styles.taskTitle,
                  item.isCompletedToday && styles.taskTitleCompleted,
                ]}
              >
                {item.title}
              </Text>
              <View style={styles.taskMeta}>
                <Clock size={14} color="#64748b" />
                <Text style={styles.taskTime}>{item.scheduled_time}</Text>
                <View
                  style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}
                >
                  <Text style={styles.priorityText}>{item.priority}</Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              </View>
              <Text style={styles.repeatText}>
                Repeat: {item.repeat_type}
                {item.repeat_type === 'weekly' &&
                  ` (${JSON.parse(item.repeat_days as string).length} days)`}
              </Text>
            </View>
          </View>
          {overdue && (
            <AlertCircle size={20} color="#ef4444" style={styles.overdueIcon} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteTask(item.id, item.title)}
        >
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  

  return (
    <View style={styles.container}>      

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completedToday}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalTasks}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completionRate}%</Text>
          <Text style={styles.statLabel}>Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, stats.overdueCount > 0 && styles.statValueOverdue]}>
            {stats.overdueCount}
          </Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Tasks</Text>
        <TouchableOpacity onPress={handleResetDaily} style={styles.resetButton}>
          <RefreshCw size={20} color="#1d4aabff" />
        </TouchableOpacity>
      </View>

      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks yet!</Text>
          <Text style={styles.emptySubtext}>Add your first task to get started</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },  
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#e5f1fdd9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statValueOverdue: {
    color: '#ef4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  resetButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskCardCompleted: {
    opacity: 0.7,
    backgroundColor: '#f0fdf4',
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 14,
    color: '#64748b',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#e0e7ff',
  },
  categoryText: {
    fontSize: 11,
    color: '#3730a3',
    fontWeight: '600',
  },
  repeatText: {
    fontSize: 12,
    color: '#64748b',
  },
  overdueIcon: {
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
