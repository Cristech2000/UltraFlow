import { database } from '../lib/firebase';
import { ref, set, get, update, push, remove } from 'firebase/database';
import { getActivity } from './activityService';
import { getBuilding, getFloor, getWing, getSpace } from './spaceService';
import { getProject } from './projectService';

const TASKS_PATH = 'tasks';
const TASK_SUBMISSIONS_PATH = 'taskSubmissions';

/**
 * Create a new task from an existing activity
 */
export async function createTask(taskData, userId) {
  try {
    const tasksRef = ref(database, TASKS_PATH);
    const newTaskRef = push(tasksRef);
    const taskId = newTaskRef.key;

    const task = {
      taskId,
      activityId: taskData.activityId,
      projectId: taskData.projectId,
      buildingId: taskData.buildingId || null,
      floorId: taskData.floorId || null,
      wingId: taskData.wingId || null,
      scopeType: taskData.scopeType,
      scopeIds: taskData.scopeIds || [],
      teamName: taskData.teamName || '',
      teamMembers: taskData.teamMembers || [],
      status: 'pending',
      approvedProgress: 0,
      submittedProgress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId || '',
      updatedBy: userId || '',
    };

    await set(newTaskRef, task);
    return task;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

/**
 * Get tasks for a user (assigned team member)
 */
export async function getTasksForUser(userId) {
  try {
    const tasksRef = ref(database, TASKS_PATH);
    const snapshot = await get(tasksRef);
    
    if (snapshot.exists()) {
      const tasks = snapshot.val();
      return Object.keys(tasks)
        .map(key => ({ ...tasks[key] }))
        .filter(task => task.teamMembers && task.teamMembers.includes(userId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return [];
  } catch (error) {
    console.error('Error fetching tasks for user:', error);
    return [];
  }
}

/**
 * Get tasks for a project
 */
export async function getTasksByProject(projectId) {
  try {
    const tasksRef = ref(database, TASKS_PATH);
    const snapshot = await get(tasksRef);
    
    if (snapshot.exists()) {
      const tasks = snapshot.val();
      return Object.keys(tasks)
        .map(key => ({ ...tasks[key] }))
        .filter(task => task.projectId === projectId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return [];
  } catch (error) {
    console.error('Error fetching tasks by project:', error);
    return [];
  }
}

/**
 * Get pending approvals for a supervisor/foreman
 */
export async function getPendingApprovals(projectId) {
  try {
    const tasksRef = ref(database, TASKS_PATH);
    const snapshot = await get(tasksRef);
    
    if (snapshot.exists()) {
      const tasks = snapshot.val();
      return Object.keys(tasks)
        .map(key => ({ ...tasks[key] }))
        .filter(task => task.projectId === projectId && task.status === 'submitted')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    return [];
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return [];
  }
}

/**
 * Submit task progress for approval
 */
export async function submitTaskProgress(taskId, progress, userId, notes = '') {
  try {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');

    const updates = {
      submittedProgress: progress,
      status: 'submitted',
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    };

    const taskRef = ref(database, `${TASKS_PATH}/${taskId}`);
    await update(taskRef, updates);

    // Create submission record
    const submissionsRef = ref(database, TASK_SUBMISSIONS_PATH);
    const newSubmissionRef = push(submissionsRef);
    await set(newSubmissionRef, {
      submissionId: newSubmissionRef.key,
      taskId: taskId,
      activityId: task.activityId,
      previousProgress: task.approvedProgress || 0,
      submittedProgress: progress,
      status: 'pending',
      notes: notes,
      submittedBy: userId || '',
      submittedAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
    });

    return await getTask(taskId);
  } catch (error) {
    console.error('Error submitting task progress:', error);
    throw error;
  }
}

/**
 * Approve task progress submission - THIS NEEDS TO UPDATE THE ACTIVITY
 */
export async function approveTaskProgress(taskId, userId, notes = '') {
  try {
    console.log('📌 Approving task:', taskId);
    
    const task = await getTask(taskId);
    if (!task) {
      console.error('❌ Task not found:', taskId);
      throw new Error('Task not found');
    }

    const progress = task.submittedProgress || 0;
    console.log(`📌 Progress to approve: ${progress}%`);

    // 1. Update the task
    const taskRef = ref(database, `${TASKS_PATH}/${taskId}`);
    await update(taskRef, {
      approvedProgress: progress,
      status: 'approved',
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    });

    // 2. ✅ UPDATE THE LINKED ACTIVITY PROGRESS
    console.log(`📌 Updating activity: ${task.activityId} to ${progress}%`);
    await updateLinkedActivityProgress(task.activityId, progress, userId);

    // 3. Update submission record
    await updateSubmissionStatus(taskId, 'approved', userId, notes);

    console.log(`✅ Task ${taskId} approved successfully!`);
    return await getTask(taskId);
  } catch (error) {
    console.error('❌ Error approving task progress:', error);
    throw error;
  }
}

/**
 * Reject task progress submission
 */
export async function rejectTaskProgress(taskId, userId, reason = '') {
  try {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');

    const taskRef = ref(database, `${TASKS_PATH}/${taskId}`);
    await update(taskRef, {
      status: 'rejected',
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    });

    await updateSubmissionStatus(taskId, 'rejected', userId, reason);

    return await getTask(taskId);
  } catch (error) {
    console.error('Error rejecting task progress:', error);
    throw error;
  }
}

/**
 * Get a task by ID
 */
export async function getTask(taskId) {
  try {
    const taskRef = ref(database, `${TASKS_PATH}/${taskId}`);
    const snapshot = await get(taskRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
}

/**
 * Update linked activity progress - FIXED
 */
async function updateLinkedActivityProgress(activityId, progress, userId) {
  try {
    console.log(`📌 Getting activity: ${activityId}`);
    
    // Get the activity
    const activity = await getActivity(activityId);
    if (!activity) {
      console.error('❌ Activity not found:', activityId);
      return;
    }

    console.log(`📌 Current activity:`, activity);
    console.log(`📌 Current progress: ${activity.progress || 0}%, progressSource: ${activity.progressSource || 'auto'}`);

    // Don't override if manual override exists
    if (activity.progressSource === 'manual') {
      console.log('ℹ️ Activity has manual override, skipping auto-update');
      return;
    }

    // Build updates
    const updates = {
      progress: progress,
      automaticProgress: progress,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    };

    // Update status based on progress
    if (progress === 100) {
      updates.status = 'completed';
      updates.actualCompletionDate = new Date().toISOString();
    } else if (progress > 0) {
      updates.status = 'in_progress';
      // Only set start date if it wasn't already set
      if (!activity.actualStartDate) {
        updates.actualStartDate = new Date().toISOString();
      }
    } else {
      updates.status = 'not_started';
    }

    // ✅ UPDATE THE ACTIVITY
    console.log(`📌 Updating activity with:`, updates);
    const activityRef = ref(database, `activities/${activityId}`);
    await update(activityRef, updates);
    
    console.log(`✅ Activity ${activityId} updated to ${progress}%`);
    
  } catch (error) {
    console.error('❌ Error updating linked activity:', error);
    // Don't throw - we don't want to fail the whole approval if activity update fails
  }
}

/**
 * Update submission status
 */
async function updateSubmissionStatus(taskId, status, userId, notes = '') {
  try {
    const submissionsRef = ref(database, TASK_SUBMISSIONS_PATH);
    const snapshot = await get(submissionsRef);
    
    if (snapshot.exists()) {
      const submissions = snapshot.val();
      const submissionKey = Object.keys(submissions).find(
        key => submissions[key].taskId === taskId && submissions[key].status === 'pending'
      );
      
      if (submissionKey) {
        const submissionRef = ref(database, `${TASK_SUBMISSIONS_PATH}/${submissionKey}`);
        await update(submissionRef, {
          status: status,
          reviewedBy: userId || '',
          reviewedAt: new Date().toISOString(),
          reviewNotes: notes || '',
        });
      }
    }
  } catch (error) {
    console.error('Error updating submission:', error);
  }
}

/**
 * Get full location info for a task
 */
export async function getTaskLocation(task) {
  try {
    const location = {
      projectName: '',
      buildingName: '',
      floorName: '',
      wingName: '',
      spaceCount: 0,
    };

    if (task.projectId) {
      const project = await getProject(task.projectId);
      if (project) location.projectName = project.name;
    }

    if (task.buildingId) {
      const building = await getBuilding(task.buildingId);
      if (building) location.buildingName = building.name;
    }

    if (task.floorId) {
      const floor = await getFloor(task.floorId);
      if (floor) location.floorName = floor.name;
    }

    if (task.wingId) {
      const wing = await getWing(task.wingId);
      if (wing) location.wingName = wing.name;
    }

    location.spaceCount = task.scopeIds?.length || 0;
    return location;
  } catch (error) {
    console.error('Error fetching task location:', error);
    return { projectName: '', buildingName: '', floorName: '', wingName: '', spaceCount: 0 };
  }
}