import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { TaskWithCompletion } from '@/types/tasks';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') {
    console.log('Notifications are not supported on web');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }

  return true;
}

export async function scheduleTaskReminder(task: TaskWithCompletion) {
  if (Platform.OS === 'web') {
    console.log('Notifications are not supported on web');
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const [hours, minutes] = task.scheduled_time.split(':').map(Number);

  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  const reminderTime = new Date(scheduledTime.getTime() + task.reminder_offset * 60 * 1000);

  if (reminderTime <= now) {
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: `Don't forget: ${task.title}`,
        data: { taskId: task.id },
        sound: true,
      },
      trigger: {
        type: 'date' as const,
        date: reminderTime,
      } as any,
    });

    console.log(`Scheduled notification for task: ${task.title} at ${reminderTime}`);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

export async function cancelTaskReminder(taskId: string) {
  if (Platform.OS === 'web') return;

  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of scheduledNotifications) {
    if (notification.content.data?.taskId === taskId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      console.log(`Cancelled notification for task: ${taskId}`);
    }
  }
}

export async function scheduleAllTaskReminders(tasks: TaskWithCompletion[]) {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const task of tasks) {
    if (!task.isCompletedToday) {
      await scheduleTaskReminder(task);
    }
  }
}

export async function scheduleDailyReset() {
  if (Platform.OS === 'web') return;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const now = new Date();
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  midnight.setDate(midnight.getDate() + 1);

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Day, New Tasks!',
        body: 'Your daily tasks have been reset',
        data: { type: 'daily_reset' },
      },
      trigger: {
        type: 'date' as const,
        date: midnight,
        repeats: true,
      } as any,
    });
  } catch (error) {
    console.error('Error scheduling daily reset notification:', error);
  }
}
