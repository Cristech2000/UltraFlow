/**
 * UltraFlow Status Constants
 */

export const STATUSES = {
  ACTIVE: 'active',
  PLANNED: 'planned',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

export const STATUS_DISPLAY_NAMES = {
  [STATUSES.ACTIVE]: 'Active',
  [STATUSES.PLANNED]: 'Planned',
  [STATUSES.ON_HOLD]: 'On Hold',
  [STATUSES.COMPLETED]: 'Completed',
  [STATUSES.ARCHIVED]: 'Archived',
};

export const STATUS_COLORS = {
  [STATUSES.ACTIVE]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  [STATUSES.PLANNED]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  [STATUSES.ON_HOLD]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  [STATUSES.COMPLETED]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  [STATUSES.ARCHIVED]: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export const STATUS_OPTIONS = Object.values(STATUSES).map(status => ({
  value: status,
  label: STATUS_DISPLAY_NAMES[status],
}));

/**
 * Get status badge color
 */
export function getStatusColor(status) {
  return STATUS_COLORS[status] || STATUS_COLORS[STATUSES.ACTIVE];
}

/**
 * Get status display name
 */
export function getStatusDisplayName(status) {
  return STATUS_DISPLAY_NAMES[status] || status;
}

/**
 * Check if status is active
 */
export function isActive(status) {
  return status === STATUSES.ACTIVE;
}

/**
 * Check if status is archived
 */
export function isArchived(status) {
  return status === STATUSES.ARCHIVED;
}