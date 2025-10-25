import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { TaskCompletion } from '@/types/database';
import { CheckCircle, Calendar, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface CompletionWithTask extends TaskCompletion {
  task_title?: string;
}

export default function HistoryScreen() {
  const [completions, setCompletions] = useState<CompletionWithTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('week');

  const fetchHistory = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('task_completions')
        .select(
          `
          *,
          tasks (
            title
          )
        `
        )
        .order('completed_at', { ascending: false });

      const today = new Date();
      if (filter === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte('completed_at', weekAgo.toISOString());
      } else if (filter === 'month') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        query = query.gte('completed_at', monthAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData: CompletionWithTask[] = (data || []).map((item: any) => ({
        id: item.id,
        task_id: item.task_id,
        completed_at: item.completed_at,
        scheduled_for: item.scheduled_for,
        completed_on_time: item.completed_on_time,
        notes: item.notes,
        task_title: item.tasks?.title || 'Unknown Task',
      }));

      setCompletions(formattedData);
    } catch (error: any) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupByDate = () => {
    const grouped: { [key: string]: CompletionWithTask[] } = {};

    completions.forEach((completion) => {
      const date = formatDate(completion.completed_at);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(completion);
    });

    return Object.entries(grouped).map(([date, items]) => ({
      date,
      items,
    }));
  };

  const renderCompletion = ({ item }: { item: CompletionWithTask }) => (
    <View style={styles.completionCard}>
      <View style={styles.completionIcon}>
        <CheckCircle size={20} color="#10b981" />
      </View>
      <View style={styles.completionInfo}>
        <Text style={styles.completionTitle}>{item.task_title}</Text>
        <View style={styles.completionMeta}>
          <Clock size={14} color="#64748b" />
          <Text style={styles.completionTime}>{formatTime(item.completed_at)}</Text>
          {item.completed_on_time ? (
            <View style={styles.onTimeBadge}>
              <Text style={styles.onTimeText}>On Time</Text>
            </View>
          ) : (
            <View style={styles.lateBadge}>
              <Text style={styles.lateText}>Late</Text>
            </View>
          )}
        </View>
        {item.notes && <Text style={styles.completionNotes}>{item.notes}</Text>}
      </View>
    </View>
  );

  const renderDateGroup = ({ item }: { item: { date: string; items: CompletionWithTask[] } }) => (
    <View style={styles.dateGroup}>
      <View style={styles.dateHeader}>
        <Calendar size={16} color="#2563eb" />
        <Text style={styles.dateText}>{item.date}</Text>
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeText}>{item.items.length}</Text>
        </View>
      </View>
      {item.items.map((completion) => (
        <View key={completion.id}>{renderCompletion({ item: completion })}</View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'week' && styles.filterButtonActive]}
          onPress={() => setFilter('week')}
        >
          <Text
            style={[styles.filterButtonText, filter === 'week' && styles.filterButtonTextActive]}
          >
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'month' && styles.filterButtonActive]}
          onPress={() => setFilter('month')}
        >
          <Text
            style={[styles.filterButtonText, filter === 'month' && styles.filterButtonTextActive]}
          >
            This Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}
          >
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      {completions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No completed tasks yet!</Text>
          <Text style={styles.emptySubtext}>Complete some tasks to see your history</Text>
        </View>
      ) : (
        <FlatList
          data={groupByDate()}
          renderItem={renderDateGroup}
          keyExtractor={(item) => item.date}
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
    gap: 16,
  },
  dateGroup: {
    gap: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  dateBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  dateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  completionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  completionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionInfo: {
    flex: 1,
    gap: 6,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  completionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completionTime: {
    fontSize: 14,
    color: '#64748b',
  },
  onTimeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  onTimeText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
  },
  lateBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lateText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
  },
  completionNotes: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
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
