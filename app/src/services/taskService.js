import { database } from '../lib/firebase';
import { ref, set, get, update, push, remove } from 'firebase/database';
import { getActivity, getActivitiesByScope, getActivitiesByProject } from './activityService';
import { getBuilding, getFloor, getWing, getSpace, getSpacesByWing, getSpacesByFloor, getSpacesByBuilding, getFloorsByBuilding, getWingsByFloor } from './spaceService';
import { getProject } from './projectService';

const TASKS_PATH = 'tasks';
const TASK_SUBMISSIONS_PATH = 'taskSubmissions';

/**
 * Create a new task with intelligent hierarchical expansion
 */
export async function createTask(taskData, userId) {
  try {
    const resolvedScopes = await resolveTaskScope(taskData);
    const templateActivity = await getActivity(taskData.activityId);

    const tasksRef = ref(database, TASKS_PATH);
    const newTaskRef = push(tasksRef);
    const taskId = newTaskRef.key;

    const isOverall = resolvedScopes.length === 0;

    const task = {
      taskId,
      activityId: taskData.activityId,
      activityName: templateActivity?.name || '',
      projectId: taskData.projectId,
      buildingId: taskData.buildingId || null,
      floorId: taskData.floorId || null,
      wingId: taskData.wingId || null,
      scopeType: taskData.scopeType,
      scopeIds: resolvedScopes.map(s => s.id),
      scopeNames: resolvedScopes.map(s => s.name),
      responsiblePerson: taskData.responsiblePerson || null,
      teamName: taskData.teamName || '',
      teamMembers: taskData.teamMembers || [],
      status: 'pending',
      approvedProgress: 0,
      submittedProgress: 0,
      spaceProgress: {},
      isOverallProgress: isOverall, 
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
 * Intelligently resolve scopes by bubbling down to child nodes
 */
export async function resolveTaskScope(taskData) {
  const { scopeType, buildingId, floorId, wingId, selectedSpaceIds, activityId } = taskData;
  let items = [];
  
  try {
    const templateActivity = await getActivity(activityId);
    const activityScope = templateActivity?.scope || 'space';

    if (scopeType === 'building' && buildingId) {
      const floors = await getFloorsByBuilding(buildingId);
      if (activityScope === 'level') {
        items = floors.map(f => ({ id: f.floorId, name: f.name }));
      } else {
        for (const f of floors) {
          const wings = await getWingsByFloor(f.floorId);
          for (const w of wings) {
            const spaces = await getSpacesByWing(w.wingId);
            items.push(...spaces.map(s => ({ id: s.spaceId, name: `${f.name} → ${w.name} → ${s.name}` })));
          }
        }
      }
    } else if (scopeType === 'level' && floorId) {
      const wings = await getWingsByFloor(floorId);
      if (activityScope === 'wing') {
        items = wings.map(w => ({ id: w.wingId, name: w.name }));
      } else {
        for (const w of wings) {
          const spaces = await getSpacesByWing(w.wingId);
          items.push(...spaces.map(s => ({ id: s.spaceId, name: `${w.name} → ${s.name}` })));
        }
      }
    } else if (scopeType === 'wing' && wingId) {
      const spaces = await getSpacesByWing(wingId);
      items = spaces.map(s => ({ id: s.spaceId, name: s.name }));
    } else if ((scopeType === 'space' || scopeType === 'spaces') && selectedSpaceIds?.length > 0) {
      const spaces = await Promise.all(selectedSpaceIds.map(id => getSpace(id)));
      items = spaces.filter(s => s !== null).map(s => ({ id: s.spaceId, name: s.name }));
    }
  } catch (err) {
    console.error('Error resolving task scope bubbling:', err);
  }
  
  return items;
}

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

export async function getTasksForUser(userId) {
  try {
    const tasksRef = ref(database, TASKS_PATH);
    const snapshot = await get(tasksRef);
    
    if (snapshot.exists()) {
      const tasks = snapshot.val();
      return Object.keys(tasks)
        .map(key => ({ ...tasks[key] }))
        .filter(task => task.responsiblePerson === userId || 
                        (task.teamMembers && task.teamMembers.includes(userId)))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return [];
  } catch (error) {
    console.error('Error fetching tasks for user:', error);
    return [];
  }
}

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

export async function submitTaskProgress(taskId, progress, userId, notes = '') {
  try {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');
    
    const scopeIds = task.scopeIds || [];
    const spaceProgress = task.spaceProgress || {};
    
    for (const sid of scopeIds) {
      spaceProgress[sid] = {
        ...spaceProgress[sid],
        submitted: progress,
        notes: notes || spaceProgress[sid]?.notes || '',
        updatedAt: new Date().toISOString(),
        updatedBy: userId || '',
      };
    }
    
    let totalProgress = 0;
    let count = 0;
    for (const sid of scopeIds) {
      if (spaceProgress[sid] && spaceProgress[sid].submitted !== undefined) {
        totalProgress += spaceProgress[sid].submitted;
        count++;
      }
    }
    const overallProgress = count > 0 ? Math.round(totalProgress / count) : 0;
    
    const taskRef = ref(database, `${TASKS_PATH}/${taskId}`);
    await update(taskRef, {
      spaceProgress: spaceProgress,
      submittedProgress: overallProgress,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    });
    
    const submissionsRef = ref(database, TASK_SUBMISSIONS_PATH);
    const newSubmissionRef = push(submissionsRef);
    await set(newSubmissionRef, {
      submissionId: newSubmissionRef.key,
      taskId: taskId,
      activityId: task.activityId,
      submittedProgress: overallProgress,
      previousApprovedProgress: task.approvedProgress || 0,
      spaceProgress: spaceProgress,
      status: 'pending',
      notes: notes || '',
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

export async function updateTaskSpaceProgress(taskId, spaceId, progress, userId, notes = '') {
  try {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');
    
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    
    const spaceProgress = task.spaceProgress || {};
    spaceProgress[spaceId] = {
      ...spaceProgress[spaceId],
      submitted: progress,
      notes: notes || spaceProgress[spaceId]?.notes || '',
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    };
    
    const scopeIds = task.scopeIds || [];
    let totalProgress = 0;
    let count = 0;
    
    for (const sid of scopeIds) {
      if (spaceProgress[sid] && spaceProgress[sid].submitted !== undefined) {
        totalProgress += spaceProgress[sid].submitted;
        count++;
      }
    }
    
    const overallProgress = count > 0 ? Math.round(totalProgress / count) : 0;
    
    let status = task.status;
    if (status === 'pending' || status === 'in_progress') {
      status = overallProgress > 0 ? 'in_progress' : 'pending';
    }
    
    const taskRef = ref(database, `${TASKS_PATH}/${taskId}`);
    await update(taskRef, {
      spaceProgress: spaceProgress,
      submittedProgress: overallProgress,
      status: status,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    });
    
    return await getTask(taskId);
  } catch (error) {
    console.error('Error updating task space progress:', error);
    throw error;
  }
}

export async function updateTaskOverallProgress(taskId, progress, userId, notes = '') {
  try {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');
    
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    let status = task.status;
    if (status === 'pending' || status === 'in_progress') {
      status = progress > 0 ? 'in_progress' : 'pending';
    }
    
    const taskRef = ref(database, `${TASKS_PATH}/${taskId}`);
    await update(taskRef, {
      submittedProgress: progress,
      status: status,
      overallNotes: notes,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    });
    
    return await getTask(taskId);
  } catch (error) {
    console.error('Error updating overall task progress:', error);
    throw error;
  }
}

export async function bulkUpdateTaskSpaces(taskId, progress, userId, notes = '') {
  try {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');
    
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    
    const scopeIds = task.scopeIds || [];
    const spaceProgress = task.spaceProgress || {};
    
    for (const sid of scopeIds) {
      spaceProgress[sid] = {
        ...spaceProgress[sid],
        submitted: progress,
        notes: notes || spaceProgress[sid]?.notes || '',
        updatedAt: new Date().toISOString(),
        updatedBy: userId || '',
      };
    }
    
    const overallProgress = scopeIds.length > 0 ? progress : 0;
    let status = task.status;
    if (status === 'pending' || status === 'in_progress') {
      status = overallProgress > 0 ? 'in_progress' : 'pending';
    }
    
    const taskRef = ref(database, `${TASKS_PATH}/${taskId}`);
    await update(taskRef, {
      spaceProgress: spaceProgress,
      submittedProgress: overallProgress,
      status: status,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    });
    
    return await getTask(taskId);
  } catch (error) {
    console.error('Error bulk updating task spaces:', error);
    throw error;
  }
}

export async function submitTaskForApproval(taskId, userId) {
  try {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');
    
    if (task.isOverallProgress) {
      if ((task.submittedProgress || 0) === 0) {
        throw new Error('Cannot submit task with 0% progress');
      }
    } else {
      const spaceProgress = task.spaceProgress || {};
      const scopeIds = task.scopeIds || [];
      let hasProgress = false;
      
      for (const sid of scopeIds) {
        if (spaceProgress[sid] && spaceProgress[sid].submitted !== undefined && spaceProgress[sid].submitted > 0) {
          hasProgress = true;
          break;
        }
      }
      
      if (!hasProgress) {
        throw new Error('Cannot submit task with no progress.');
      }
    }
    
    const taskRef = ref(database, `${TASKS_PATH}/${taskId}`);
    await update(taskRef, {
      status: 'submitted',
      submittedProgress: task.submittedProgress || 0,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    });
    
    const submissionsRef = ref(database, TASK_SUBMISSIONS_PATH);
    const newSubmissionRef = push(submissionsRef);
    await set(newSubmissionRef, {
      submissionId: newSubmissionRef.key,
      taskId: taskId,
      activityId: task.activityId,
      submittedProgress: task.submittedProgress || 0,
      previousApprovedProgress: task.approvedProgress || 0,
      spaceProgress: task.spaceProgress || {},
      status: 'pending',
      notes: task.overallNotes || '',
      submittedBy: userId || '',
      submittedAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
    });
    
    return await getTask(taskId);
  } catch (error) {
    console.error('Error submitting task for approval:', error);
    throw error;
  }
}

/**
 * 🔥 FIXED & ROBUST: Automatically syncs approved progress upward and across all matching hierarchical activities in the project
 */
async function syncHierarchicalActivitiesProgress(task, userId) {
  try {
    const templateActivity = await getActivity(task.activityId);
    if (!templateActivity) return;

    const scopeIds = task.scopeIds || [];
    const spaceProgress = task.spaceProgress || {};
    const allProjectActivities = await getActivitiesByProject(task.projectId);

    // Update each specific scope item's matching activity record
    const updatePromises = scopeIds.map(async (sid) => {
      const progObj = spaceProgress[sid];
      if (!progObj || progObj.approved === undefined) return;

      const progressVal = progObj.approved;

      // Find all activities tied directly to this specific scope ID (floorId, wingId, or spaceId)
      const matchingActs = allProjectActivities.filter(a => 
        (a.floorId === sid || a.wingId === sid || a.spaceId === sid) && 
        a.name.toLowerCase() === templateActivity.name.toLowerCase()
      );

      for (const act of matchingActs) {
        await updateLinkedActivityProgress(act.activityId, progressVal, userId);
      }
    });

    await Promise.all(updatePromises);

    // Also update the primary task template activity reference
    const totalAppr = scopeIds.reduce((sum, sid) => sum + (spaceProgress[sid]?.approved || 0), 0);
    const avgAppr = scopeIds.length > 0 ? Math.round(totalAppr / scopeIds.length) : 0;
    await updateLinkedActivityProgress(task.activityId, avgAppr, userId);

  } catch (error) {
    console.error('❌ Error syncing hierarchical activities:', error);
  }
}

export async function approveTaskAll(taskId, userId, notes = '') {
  try {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');
    
    const spaceProgress = task.spaceProgress || {};
    const scopeIds = task.scopeIds || [];
    
    for (const sid of scopeIds) {
      if (spaceProgress[sid] && spaceProgress[sid].submitted !== undefined) {
        spaceProgress[sid] = {
          ...spaceProgress[sid],
          approved: spaceProgress[sid].submitted,
          approvedAt: new Date().toISOString(),
          approvedBy: userId || '',
        };
      }
    }
    
    let totalProgress = 0;
    let count = 0;
    if (task.isOverallProgress || scopeIds.length === 0) {
      totalProgress = task.submittedProgress;
      count = 1;
    } else {
      for (const sid of scopeIds) {
        if (spaceProgress[sid] && spaceProgress[sid].approved !== undefined) {
          totalProgress += spaceProgress[sid].approved;
          count++;
        }
      }
    }
    
    const overallProgress = count > 0 ? Math.round(totalProgress / count) : 0;
    
    const taskRef = ref(database, `${TASKS_PATH}/${taskId}`);
    await update(taskRef, {
      spaceProgress: spaceProgress,
      approvedProgress: overallProgress,
      status: 'approved',
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    });
    
    task.spaceProgress = spaceProgress;
    await syncHierarchicalActivitiesProgress(task, userId);
    await updateSubmissionStatus(taskId, 'approved', userId, notes);
    
    return await getTask(taskId);
  } catch (error) {
    console.error('Error approving task:', error);
    throw error;
  }
}

export async function approveTaskSpaces(taskId, targetIds, userId, notes = '') {
  try {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');
    
    const spaceProgress = task.spaceProgress || {};
    const allScopeIds = task.scopeIds || [];
    
    for (const sid of targetIds) {
      if (spaceProgress[sid] && spaceProgress[sid].submitted !== undefined) {
        spaceProgress[sid] = {
          ...spaceProgress[sid],
          approved: spaceProgress[sid].submitted,
          approvedAt: new Date().toISOString(),
          approvedBy: userId || '',
        };
      }
    }
    
    let totalProgress = 0;
    let count = 0;
    for (const sid of allScopeIds) {
      if (spaceProgress[sid] && spaceProgress[sid].approved !== undefined) {
        totalProgress += spaceProgress[sid].approved;
        count++;
      }
    }
    const overallProgress = count > 0 ? Math.round(totalProgress / count) : 0;
    
    const allApproved = allScopeIds.every(sid => 
      spaceProgress[sid] && spaceProgress[sid].approved !== undefined
    );
    
    let status = task.status;
    if (allApproved) {
      status = 'approved';
    } else if (task.status === 'submitted') {
      status = 'in_progress';
    }
    
    const taskRef = ref(database, `${TASKS_PATH}/${taskId}`);
    await update(taskRef, {
      spaceProgress: spaceProgress,
      approvedProgress: overallProgress,
      status: status,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    });
    
    task.spaceProgress = spaceProgress;
    await syncHierarchicalActivitiesProgress(task, userId);
    await updateSubmissionStatus(taskId, 'approved', userId, notes);
    
    return await getTask(taskId);
  } catch (error) {
    console.error('Error approving task spaces:', error);
    throw error;
  }
}

export async function rejectTaskSpaces(taskId, targetIds, userId, reason = '') {
  try {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');
    
    if (!reason) {
      throw new Error('Rejection reason is required');
    }
    
    const spaceProgress = task.spaceProgress || {};
    
    for (const sid of targetIds) {
      if (spaceProgress[sid]) {
        spaceProgress[sid] = {
          ...spaceProgress[sid],
          rejected: true,
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
          rejectedBy: userId || '',
        };
      }
    }
    
    const taskRef = ref(database, `${TASKS_PATH}/${taskId}`);
    await update(taskRef, {
      spaceProgress: spaceProgress,
      status: 'rejected',
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
    });
    
    await updateSubmissionStatus(taskId, 'rejected', userId, reason);
    
    return await getTask(taskId);
  } catch (error) {
    console.error('Error rejecting task spaces:', error);
    throw error;
  }
}

async function updateLinkedActivityProgress(activityId, progress, userId) {
  try {
    const activity = await getActivity(activityId);
    if (!activity) return;

    if (activity.progressSource === 'manual' && activity.manualOverrideReason) return;

    const updates = {
      progress: progress,
      automaticProgress: progress,
      updatedAt: new Date().toISOString(),
      updatedBy: userId || '',
      manualOverrideReason: null,
      manualOverrideBy: null,
      manualOverrideAt: null,
      manualProgress: null,
    };

    if (progress === 100) {
      updates.status = 'completed';
      updates.actualCompletionDate = new Date().toISOString();
    } else if (progress > 0) {
      updates.status = 'in_progress';
      if (!activity.actualStartDate) updates.actualStartDate = new Date().toISOString();
    } else {
      updates.status = 'not_started';
    }

    const activityRef = ref(database, `activities/${activityId}`);
    await update(activityRef, updates);
  } catch (error) {
    console.error('❌ Error updating linked activity:', error);
  }
}

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

export async function getTaskLocation(task) {
  try {
    const location = { projectName: '', buildingName: '', floorName: '', wingName: '', spaceCount: 0 };

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