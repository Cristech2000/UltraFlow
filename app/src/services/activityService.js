import { database } from '../lib/firebase';
import { ref, set, get, update, push, remove } from 'firebase/database';

const ACTIVITIES_PATH = 'activities';

// Activity scope types
export const ACTIVITY_SCOPES = {
  PROJECT: 'project',
  BUILDING: 'building',
  LEVEL: 'level',
  WING: 'wing',
  SPACE: 'space',
};

/**
 * Create a new activity with scope
 */
export async function createActivity(activityData, userId) {
  try {
    const activitiesRef = ref(database, ACTIVITIES_PATH);
    const newActivityRef = push(activitiesRef);
    const activityId = newActivityRef.key;

    const activity = {
      activityId,
      projectId: activityData.projectId,
      buildingId: activityData.buildingId || null,
      floorId: activityData.floorId || null,
      wingId: activityData.wingId || null,
      spaceId: activityData.spaceId || null,
      scope: activityData.scope || ACTIVITY_SCOPES.SPACE,
      name: activityData.name,
      code: activityData.code || '',
      description: activityData.description || '',
      order: activityData.order || 0,
      status: activityData.status || 'not_started',
      progress: activityData.progress || 0,
      progressSource: 'automatic',  // ← CHANGED FROM 'manual' TO 'automatic'
      automaticProgress: 0,
      manualProgress: null,
      manualOverrideReason: null,
      manualOverrideBy: null,
      manualOverrideAt: null,
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
 * Get activities by scope
 */
export async function getActivitiesByScope(projectId, scope, scopeId) {
  try {
    const activitiesRef = ref(database, ACTIVITIES_PATH);
    const snapshot = await get(activitiesRef);
    
    if (snapshot.exists()) {
      const activities = snapshot.val();
      const results = Object.keys(activities)
        .map(key => ({ 
          activityId: key,
          ...activities[key] 
        }))
        .filter(activity => {
          if (activity.projectId !== projectId) return false;
          if (activity.scope !== scope) return false;
          
          switch (scope) {
            case ACTIVITY_SCOPES.BUILDING:
              return activity.buildingId === scopeId;
            case ACTIVITY_SCOPES.LEVEL:
              return activity.floorId === scopeId;
            case ACTIVITY_SCOPES.WING:
              return activity.wingId === scopeId;
            case ACTIVITY_SCOPES.SPACE:
              return activity.spaceId === scopeId;
            case ACTIVITY_SCOPES.PROJECT:
              return true;
            default:
              return false;
          }
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      return results;
    }
    return [];
  } catch (error) {
    console.error('Error fetching activities by scope:', error);
    return [];
  }
}

/**
 * Get activities by project
 */
export async function getActivitiesByProject(projectId) {
  try {
    const activitiesRef = ref(database, ACTIVITIES_PATH);
    const snapshot = await get(activitiesRef);
    
    if (snapshot.exists()) {
      const activities = snapshot.val();
      return Object.keys(activities)
        .map(key => ({ 
          activityId: key,
          ...activities[key] 
        }))
        .filter(activity => activity.projectId === projectId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return [];
  } catch (error) {
    console.error('Error fetching activities by project:', error);
    return [];
  }
}

/**
 * Get activities by space
 */
export async function getActivitiesBySpace(spaceId) {
  try {
    const activitiesRef = ref(database, ACTIVITIES_PATH);
    const snapshot = await get(activitiesRef);
    
    if (snapshot.exists()) {
      const activities = snapshot.val();
      return Object.keys(activities)
        .map(key => ({ 
          activityId: key,
          ...activities[key] 
        }))
        .filter(activity => activity.spaceId === spaceId)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return [];
  } catch (error) {
    console.error('Error fetching activities by space:', error);
    return [];
  }
}

/**
 * Get activity by ID
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
 * Update activity
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
 * Update activity progress with manual override support
 */
export async function updateActivityProgress(activityId, progress, userId, reason = null) {
  try {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    const activity = await getActivity(activityId);
    if (!activity) throw new Error('Activity not found');

    const updates = {
      progress: progress,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
      progressSource: 'manual',
      manualProgress: progress,
      manualOverrideReason: reason || null,
      manualOverrideBy: userId || null,
      manualOverrideAt: new Date().toISOString(),
    };

    if (progress === 100) {
      updates.status = 'completed';
      updates.actualCompletionDate = new Date().toISOString();
    } else if (progress > 0) {
      updates.status = 'in_progress';
      if (!activity.actualStartDate) {
        updates.actualStartDate = new Date().toISOString();
      }
    } else {
      updates.status = 'not_started';
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
 * Restore automatic progress (remove manual override)
 */
export async function restoreAutomaticProgress(activityId, userId) {
  try {
    const activity = await getActivity(activityId);
    if (!activity) throw new Error('Activity not found');

    const automaticProgress = activity.automaticProgress || 0;
    
    const updates = {
      progress: automaticProgress,
      progressSource: 'automatic',
      manualProgress: null,
      manualOverrideReason: null,
      manualOverrideBy: null,
      manualOverrideAt: null,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    };

    if (automaticProgress === 100) {
      updates.status = 'completed';
    } else if (automaticProgress > 0) {
      updates.status = 'in_progress';
    } else {
      updates.status = 'not_started';
    }

    const activityRef = ref(database, `${ACTIVITIES_PATH}/${activityId}`);
    await update(activityRef, updates);
    return await getActivity(activityId);
  } catch (error) {
    console.error('Error restoring automatic progress:', error);
    throw error;
  }
}

/**
 * Delete activity
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
        scope: ACTIVITY_SCOPES.SPACE,
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