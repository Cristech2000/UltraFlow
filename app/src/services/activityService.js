import { database } from '../lib/firebase';
import { ref, set, get, update, push, remove, query, orderByChild, equalTo } from 'firebase/database';

/**
 * Activity Service - Handles all activity-related Realtime Database operations
 */

const ACTIVITIES_PATH = 'activities';

/**
 * Create a new activity
 */
export async function createActivity(activityData, userId) {
  try {
    const activitiesRef = ref(database, ACTIVITIES_PATH);
    const newActivityRef = push(activitiesRef);
    const activityId = newActivityRef.key;

    const activity = {
      activityId,
      projectId: activityData.projectId,
      buildingId: activityData.buildingId,
      floorId: activityData.floorId,
      wingId: activityData.wingId,
      spaceId: activityData.spaceId,
      name: activityData.name,
      code: activityData.code || '',
      description: activityData.description || '',
      order: activityData.order || 0,
      status: activityData.status || 'not_started',
      progress: activityData.progress || 0,
      plannedStartDate: activityData.plannedStartDate || null,
      plannedEndDate: activityData.plannedEndDate || null,
      actualStartDate: activityData.actualStartDate || null,
      actualCompletionDate: activityData.actualCompletionDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId || '',
      updatedBy: userId || '',
    };

    await set(newActivityRef, activity);
    return activity;
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
}

/**
 * Get an activity by ID
 */
export async function getActivity(activityId) {
  try {
    const activityRef = ref(database, `${ACTIVITIES_PATH}/${activityId}`);
    const snapshot = await get(activityRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching activity:', error);
    throw error;
  }
}

/**
 * Get all activities for a space
 */
export async function getActivitiesBySpace(spaceId) {
  try {
    const activitiesRef = ref(database, ACTIVITIES_PATH);
    const snapshot = await get(activitiesRef);
    
    if (snapshot.exists()) {
      const activities = snapshot.val();
      return Object.keys(activities)
        .map(key => ({ ...activities[key] }))
        .filter(activity => activity.spaceId === spaceId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return [];
  } catch (error) {
    console.error('Error fetching activities by space:', error);
    throw error;
  }
}

/**
 * Get all activities for a wing
 */
export async function getActivitiesByWing(wingId) {
  try {
    const activitiesRef = ref(database, ACTIVITIES_PATH);
    const snapshot = await get(activitiesRef);
    
    if (snapshot.exists()) {
      const activities = snapshot.val();
      return Object.keys(activities)
        .map(key => ({ ...activities[key] }))
        .filter(activity => activity.wingId === wingId);
    }
    return [];
  } catch (error) {
    console.error('Error fetching activities by wing:', error);
    throw error;
  }
}

/**
 * Get all activities for a floor
 */
export async function getActivitiesByFloor(floorId) {
  try {
    const activitiesRef = ref(database, ACTIVITIES_PATH);
    const snapshot = await get(activitiesRef);
    
    if (snapshot.exists()) {
      const activities = snapshot.val();
      return Object.keys(activities)
        .map(key => ({ ...activities[key] }))
        .filter(activity => activity.floorId === floorId);
    }
    return [];
  } catch (error) {
    console.error('Error fetching activities by floor:', error);
    throw error;
  }
}

/**
 * Get all activities for a building
 */
export async function getActivitiesByBuilding(buildingId) {
  try {
    const activitiesRef = ref(database, ACTIVITIES_PATH);
    const snapshot = await get(activitiesRef);
    
    if (snapshot.exists()) {
      const activities = snapshot.val();
      return Object.keys(activities)
        .map(key => ({ ...activities[key] }))
        .filter(activity => activity.buildingId === buildingId);
    }
    return [];
  } catch (error) {
    console.error('Error fetching activities by building:', error);
    throw error;
  }
}

/**
 * Get all activities for a project
 */
export async function getActivitiesByProject(projectId) {
  try {
    const activitiesRef = ref(database, ACTIVITIES_PATH);
    const snapshot = await get(activitiesRef);
    
    if (snapshot.exists()) {
      const activities = snapshot.val();
      return Object.keys(activities)
        .map(key => ({ ...activities[key] }))
        .filter(activity => activity.projectId === projectId);
    }
    return [];
  } catch (error) {
    console.error('Error fetching activities by project:', error);
    throw error;
  }
}

/**
 * Update an activity
 */
export async function updateActivity(activityId, updates, userId) {
  try {
    const activityRef = ref(database, `${ACTIVITIES_PATH}/${activityId}`);
    await update(activityRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    });
    return await getActivity(activityId);
  } catch (error) {
    console.error('Error updating activity:', error);
    throw error;
  }
}

/**
 * Update activity progress (auto-updates status)
 */
export async function updateActivityProgress(activityId, progress, userId) {
  try {
    // Validate progress
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    // Determine status based on progress
    let status = 'not_started';
    if (progress === 100) {
      status = 'completed';
    } else if (progress > 0) {
      status = 'in_progress';
    }

    const updates = {
      progress: progress,
      status: status,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    };

    // If progress is 100, set completion date
    if (progress === 100) {
      updates.actualCompletionDate = new Date().toISOString();
    }

    // If progress goes from 0 to >0, set actual start date
    const activity = await getActivity(activityId);
    if (activity && activity.progress === 0 && progress > 0) {
      updates.actualStartDate = new Date().toISOString();
    }

    const activityRef = ref(database, `${ACTIVITIES_PATH}/${activityId}`);
    await update(activityRef, updates);
    return await getActivity(activityId);
  } catch (error) {
    console.error('Error updating activity progress:', error);
    throw error;
  }
}

/**
 * Update activity status
 */
export async function updateActivityStatus(activityId, status, userId) {
  try {
    const activityRef = ref(database, `${ACTIVITIES_PATH}/${activityId}`);
    await update(activityRef, {
      status: status,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    });
    return await getActivity(activityId);
  } catch (error) {
    console.error('Error updating activity status:', error);
    throw error;
  }
}

/**
 * Archive an activity
 */
export async function archiveActivity(activityId, userId) {
  try {
    const activityRef = ref(database, `${ACTIVITIES_PATH}/${activityId}`);
    await update(activityRef, {
      status: 'archived',
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    });
    return true;
  } catch (error) {
    console.error('Error archiving activity:', error);
    throw error;
  }
}

/**
 * Delete an activity (hard delete)
 */
export async function deleteActivity(activityId) {
  try {
    const activityRef = ref(database, `${ACTIVITIES_PATH}/${activityId}`);
    await remove(activityRef);
    return true;
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
}

/**
 * Create multiple activities from a template
 */
export async function createActivitiesFromTemplate(spaceData, templateActivities, userId) {
  try {
    const results = [];
    for (let i = 0; i < templateActivities.length; i++) {
      const template = templateActivities[i];
      const activity = await createActivity({
        projectId: spaceData.projectId,
        buildingId: spaceData.buildingId,
        floorId: spaceData.floorId,
        wingId: spaceData.wingId,
        spaceId: spaceData.spaceId,
        name: template.name,
        code: template.code || '',
        description: template.description || '',
        order: template.order || i + 1,
        status: 'not_started',
        progress: 0,
      }, userId);
      results.push(activity);
    }
    return results;
  } catch (error) {
    console.error('Error creating activities from template:', error);
    throw error;
  }
}