// NOTE: Push functionality (push.ts) uses Node.js modules and should only
// be imported in server-side code (API routes). Do not export from here.

// Notification templates
export {
  notificationTemplates,
  createCustomNotification,
  getNotificationTypeIcon,
  getNotificationTypeColor
} from './templates'

// Scheduler utilities
export {
  isQuietHours,
  shouldSendNotification,
  generateWaterReminders,
  getMealReminderTimes,
  getNextNotificationTime,
  createScheduledNotification,
  generateDailyNotifications,
  getNotificationsDue
} from './scheduler'
