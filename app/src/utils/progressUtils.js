/**
 * Progress Calculation Utilities
 */

export function calculateSpaceProgress(activities) {
  if (!activities || activities.length === 0) return 0;
  const total = activities.reduce((sum, a) => sum + (a.progress || 0), 0);
  return Math.round(total / activities.length);
}

export function calculateAverageProgress(items) {
  if (!items || items.length === 0) return 0;
  const total = items.reduce((sum, item) => sum + (item.progress || 0), 0);
  return Math.round(total / items.length);
}

export function calculateWingProgress(spaces, wingActivities) {
  const spacesProgress = calculateAverageProgress(spaces);
  const wingActivitiesProgress = calculateAverageProgress(wingActivities);
  
  if (spaces.length === 0 && wingActivities.length === 0) return 0;
  if (wingActivities.length === 0) return spacesProgress;
  if (spaces.length === 0) return wingActivitiesProgress;
  
  return Math.round((spacesProgress + wingActivitiesProgress) / 2);
}

export function calculateLevelProgress(wings, levelActivities) {
  const wingsProgress = calculateAverageProgress(wings);
  const levelActivitiesProgress = calculateAverageProgress(levelActivities);
  
  if (wings.length === 0 && levelActivities.length === 0) return 0;
  if (levelActivities.length === 0) return wingsProgress;
  if (wings.length === 0) return levelActivitiesProgress;
  
  return Math.round((wingsProgress + levelActivitiesProgress) / 2);
}

export function calculateBuildingProgress(levels, buildingActivities) {
  const levelsProgress = calculateAverageProgress(levels);
  const buildingActivitiesProgress = calculateAverageProgress(buildingActivities);
  
  if (levels.length === 0 && buildingActivities.length === 0) return 0;
  if (buildingActivities.length === 0) return levelsProgress;
  if (levels.length === 0) return buildingActivitiesProgress;
  
  return Math.round((levelsProgress + buildingActivitiesProgress) / 2);
}

export function getActivityStatusDisplay(status) {
  const map = {
    'not_started': 'Not Started',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'on_hold': 'On Hold',
    'blocked': 'Blocked',
  };
  return map[status] || status;
}

export function getActivityStatusColor(status) {
  const map = {
    'not_started': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'in_progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'on_hold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'blocked': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return map[status] || map['not_started'];
}