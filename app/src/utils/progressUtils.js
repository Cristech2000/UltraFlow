/**
 * Progress Calculation Utilities
 * Reusable functions for calculating progress at different hierarchy levels
 */

/**
 * Calculate space progress from activities
 * Equal weight average of all activities
 */
export function calculateSpaceProgress(activities) {
  if (!activities || activities.length === 0) {
    return 0;
  }

  const totalProgress = activities.reduce((sum, activity) => {
    return sum + (activity.progress || 0);
  }, 0);

  return Math.round(totalProgress / activities.length);
}

/**
 * Calculate progress for a collection of items (wings, floors, buildings)
 * Each child has equal weight
 */
export function calculateAggregateProgress(items) {
  if (!items || items.length === 0) {
    return 0;
  }

  const totalProgress = items.reduce((sum, item) => {
    return sum + (item.progress || 0);
  }, 0);

  return Math.round(totalProgress / items.length);
}

/**
 * Get activity status display name
 */
export function getActivityStatusDisplay(status) {
  const statusMap = {
    'not_started': 'Not Started',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'on_hold': 'On Hold',
    'blocked': 'Blocked',
    'archived': 'Archived',
  };
  return statusMap[status] || status;
}

/**
 * Get activity status color for Badge component
 */
export function getActivityStatusColor(status) {
  const colorMap = {
    'not_started': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'in_progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'on_hold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'blocked': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'archived': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };
  return colorMap[status] || colorMap['not_started'];
}

/**
 * Check if activity is complete
 */
export function isActivityComplete(activity) {
  return activity.status === 'completed' || activity.progress === 100;
}

/**
 * Check if activity is in progress
 */
export function isActivityInProgress(activity) {
  return activity.status === 'in_progress' || (activity.progress > 0 && activity.progress < 100);
}

/**
 * Check if activity is blocked
 */
export function isActivityBlocked(activity) {
  return activity.status === 'blocked';
}

/**
 * Get progress color based on percentage
 */
export function getProgressColor(progress) {
  if (progress === 100) return 'bg-green-500';
  if (progress >= 70) return 'bg-green-400';
  if (progress >= 40) return 'bg-yellow-500';
  if (progress > 0) return 'bg-orange-500';
  return 'bg-gray-300 dark:bg-gray-600';
}

/**
 * Get progress text color based on percentage
 */
export function getProgressTextColor(progress) {
  if (progress === 100) return 'text-green-600 dark:text-green-400';
  if (progress >= 70) return 'text-green-600 dark:text-green-400';
  if (progress >= 40) return 'text-yellow-600 dark:text-yellow-400';
  if (progress > 0) return 'text-orange-600 dark:text-orange-400';
  return 'text-gray-500 dark:text-gray-400';
}