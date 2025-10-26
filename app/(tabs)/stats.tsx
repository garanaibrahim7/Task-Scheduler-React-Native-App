import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Linking,
} from 'react-native';
import { useTaskContext } from '@/app/contexts/TaskContext';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp,
  Calendar,
  Target,
  Award,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface WeeklyStats {
  totalCompleted: number;
  totalTasks: number;
  onTimeCount: number;
  lateCount: number;
  bestDay: string;
  worstDay: string;
}

export default function StatsScreen() {
  const { stats, tasks } = useTaskContext();
  const [refreshing, setRefreshing] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalCompleted: 0,
    totalTasks: 0,
    onTimeCount: 0,
    lateCount: 0,
    bestDay: 'N/A',
    worstDay: 'N/A',
  });

  const fetchWeeklyStats = async () => {
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('task_completions')
        .select('*')
        .gte('completed_at', weekAgo.toISOString())
        .lte('completed_at', today.toISOString());

      if (error) throw error;

      const completions: Array<{
        id: string;
        task_id: string;
        completed_at: string;
        scheduled_for: string;
        completed_on_time: boolean;
        notes: string | null;
      }> = data || [];
      const totalCompleted = completions.length;
      const onTimeCount = completions.filter((c) => c.completed_on_time).length;
      const lateCount = completions.length - onTimeCount;

      const dayCount: { [key: string]: number } = {};
      completions.forEach((completion) => {
        const date = new Date(completion.completed_at).toLocaleDateString();
        dayCount[date] = (dayCount[date] || 0) + 1;
      });

      const sortedDays = Object.entries(dayCount).sort((a, b) => b[1] - a[1]);
      const bestDay = sortedDays.length > 0 ? sortedDays[0][0] : 'N/A';
      const worstDay = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1][0] : 'N/A';

      setWeeklyStats({
        totalCompleted,
        totalTasks: tasks.length * 7,
        onTimeCount,
        lateCount,
        bestDay,
        worstDay,
      });
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  };

  useEffect(() => {
    fetchWeeklyStats();
  }, [tasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWeeklyStats();
    setRefreshing(false);
  };

  const getCategoryBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    tasks.forEach((task) => {
      breakdown[task.category] = (breakdown[task.category] || 0) + 1;
    });
    return Object.entries(breakdown);
  };

  const getPriorityBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    tasks.forEach((task) => {
      breakdown[task.priority] = (breakdown[task.priority] || 0) + 1;
    });
    return Object.entries(breakdown);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
      }
    >
      <View style={styles.content}>
        <View style={styles.heroCard}>
          <TrendingUp size={32} color="#2563eb" />
          <Text style={styles.heroValue}>{stats.completionRate}%</Text>
          <Text style={styles.heroLabel}>Today's Completion Rate</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <CheckCircle2 size={24} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{stats.completedToday}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Target size={24} color="#2563eb" />
              </View>
              <Text style={styles.statValue}>{stats.totalTasks}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Clock size={24} color="#ef4444" />
              </View>
              <Text style={styles.statValue}>{stats.overdueCount}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Award size={24} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weeklyCard}>
            <View style={styles.weeklyRow}>
              <Text style={styles.weeklyLabel}>Total Completed</Text>
              <Text style={styles.weeklyValue}>{weeklyStats.totalCompleted}</Text>
            </View>
            <View style={styles.weeklyRow}>
              <Text style={styles.weeklyLabel}>On Time</Text>
              <Text style={[styles.weeklyValue, styles.successText]}>
                {weeklyStats.onTimeCount}
              </Text>
            </View>
            <View style={styles.weeklyRow}>
              <Text style={styles.weeklyLabel}>Late</Text>
              <Text style={[styles.weeklyValue, styles.errorText]}>{weeklyStats.lateCount}</Text>
            </View>
            <View style={styles.weeklyRow}>
              <Text style={styles.weeklyLabel}>Best Day</Text>
              <Text style={styles.weeklyValue}>{weeklyStats.bestDay}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Breakdown</Text>

          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>By Category</Text>
            {getCategoryBreakdown().map(([category, count]) => (
              <View key={category} style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <View style={[styles.breakdownDot, { backgroundColor: '#2563eb' }]} />
                  <Text style={styles.breakdownLabel}>{category}</Text>
                </View>
                <Text style={styles.breakdownValue}>{count}</Text>
              </View>
            ))}
          </View>

          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>By Priority</Text>
            {getPriorityBreakdown().map(([priority, count]) => {
              const color =
                priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981';
              return (
                <View key={priority} style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <View style={[styles.breakdownDot, { backgroundColor: color }]} />
                    <Text style={styles.breakdownLabel}>{priority}</Text>
                  </View>
                  <Text style={styles.breakdownValue}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>
              {stats.completionRate >= 80
                ? '🎉 Great job! You are maintaining an excellent completion rate.'
                : stats.completionRate >= 50
                  ? '👍 Good progress! Keep pushing to reach your daily goals.'
                  : '💪 Stay focused! Break down tasks and tackle them one at a time.'}
            </Text>
          </View>
        </View>

        {stats.overdueCount > 0 && (
          <View style={[styles.insightCard, styles.warningCard]}>
            <Text style={styles.insightText}>
              You have {stats.overdueCount} overdue {stats.overdueCount === 1 ? 'task' : 'tasks'}.
              Try to complete them soon!
            </Text>
          </View>
        )}

        {weeklyStats.onTimeCount > weeklyStats.lateCount && weeklyStats.onTimeCount > 0 && (
          <View style={[styles.insightCard, styles.successCard]}>
            <Text style={styles.insightText}>
              You completed {weeklyStats.onTimeCount} tasks on time this week. Excellent time
              management!
            </Text>
          </View>
        )}
        <View style={[styles.insightCard, styles.infoCard]}>
          <Text style={styles.insightText}>
            This App Concept is by{' '}
            <Text onPress={() => Linking.openURL('https://www.linkedin.com/in/garanaibrahim7/')} style={{ fontWeight: 'bold', color: '#2563eb' }}>
              Ibrahim Garana, {'\n'}
            </Text>
            With the Help of{' '}
            <Text onPress={() => Linking.openURL('https://www.linkedin.com/in/vishal-chaudhary-02454a211/')} style={{ fontWeight: 'bold', color: '#2563eb' }}>
              Vishal Chaudhary
            </Text>
            {' '}(React Native Developer)
          </Text>
        </View>
        <View style={[styles.insightCard, styles.infoCard]}>
          <Text style={styles.insightText}>
            Developed and Designed with Bolt AI Agent, {'\n'}
            with Integrated Supbase.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    gap: 24,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 16,
  },
  heroLabel: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  weeklyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  weeklyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  successText: {
    color: '#10b981',
  },
  errorText: {
    color: '#ef4444',
  },
  breakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  insightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  warningCard: {
    borderLeftColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  successCard: {
    borderLeftColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  infoCard: {
    borderLeftColor: '#0d3458ff',
    backgroundColor: '#f0fdf4',
  },
  insightText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
});
