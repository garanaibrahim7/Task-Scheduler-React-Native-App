import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useTaskContext } from '../contexts/TaskContext';
import { TaskInsert } from '@/types/database';
import { RepeatType, TaskCategory, TaskPriority } from '@/types/tasks';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Clock } from 'lucide-react-native';

const REPEAT_OPTIONS: RepeatType[] = ['once', 'daily', 'weekly', 'monthly'];
const CATEGORY_OPTIONS: TaskCategory[] = ['personal', 'work', 'health', 'shopping', 'other'];
const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AddTaskScreen() {
  const { addTask } = useTaskContext();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeatType, setRepeatType] = useState<RepeatType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [reminderOffset, setReminderOffset] = useState('60');

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort()
    );
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (repeatType === 'weekly' && selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day for weekly tasks');
      return;
    }

    const timeString = formatTime(time);

    const newTask: TaskInsert = {
      title: title.trim(),
      scheduled_time: timeString,
      repeat_type: repeatType,
      repeat_days: repeatType === 'weekly' ? JSON.stringify(selectedDays) : JSON.stringify([]),
      category,
      priority,
      reminder_offset: parseInt(reminderOffset) || 60,
      is_active: true,
    };

    try {
      await addTask(newTask);
      Alert.alert('Success', 'Task created successfully!');

      setTitle('');
      setTime(new Date());
      setRepeatType('daily');
      setSelectedDays([1, 2, 3, 4, 5]);
      setCategory('personal');
      setPriority('medium');
      setReminderOffset('60');
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task name"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Scheduled Time *</Text>
          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Clock size={20} color="#1f376bff" />
            <Text style={styles.timeButtonText}>{formatTime(time)}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Repeat</Text>
          <View style={styles.optionGrid}>
            {REPEAT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, repeatType === option && styles.optionButtonActive]}
                onPress={() => setRepeatType(option)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    repeatType === option && styles.optionButtonTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {repeatType === 'weekly' && (
          <View style={styles.section}>
            <Text style={styles.label}>Select Days *</Text>
            <View style={styles.weekdayGrid}>
              {WEEKDAYS.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.weekdayButton,
                    selectedDays.includes(index) && styles.weekdayButtonActive,
                  ]}
                  onPress={() => toggleDay(index)}
                >
                  <Text
                    style={[
                      styles.weekdayButtonText,
                      selectedDays.includes(index) && styles.weekdayButtonTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.optionGrid}>
            {CATEGORY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, category === option && styles.optionButtonActive]}
                onPress={() => setCategory(option)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    category === option && styles.optionButtonTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.optionGrid}>
            {PRIORITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  priority === option && styles.optionButtonActive,
                  priority === option && option === 'high' && styles.priorityHigh,
                  priority === option && option === 'medium' && styles.priorityMedium,
                  priority === option && option === 'low' && styles.priorityLow,
                ]}
                onPress={() => setPriority(option)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    priority === option && styles.optionButtonTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Reminder After (minutes)</Text>
          <TextInput
            style={styles.input}
            value={reminderOffset}
            onChangeText={setReminderOffset}
            placeholder="60"
            keyboardType="numeric"
            placeholderTextColor="#94a3b8"
          />
          <Text style={styles.helperText}>
            You'll be reminded {reminderOffset || '60'} minutes after the scheduled time if not
            completed
          </Text>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Create Task</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  form: {
    padding: 16,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  timeButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  optionButtonActive: {
    backgroundColor: '#335aaeff',
    borderColor: '#152852ff',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  optionButtonTextActive: {
    color: '#ffffff',
  },
  priorityHigh: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  priorityMedium: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  priorityLow: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  weekdayGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  weekdayButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  weekdayButtonActive: {
    backgroundColor: '#000000ff',
    borderColor: '#5f5f5fff',
  },
  weekdayButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  weekdayButtonTextActive: {
    color: '#ffffff',
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#214480ff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
