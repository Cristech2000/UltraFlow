import { database } from '../lib/firebase';
import { ref, set, get, update, push, remove, query, orderByChild, equalTo } from 'firebase/database';

const PROJECTS_PATH = 'projects';

export async function createProject(projectData, organizationId, userId) {
  try {
    const projectsRef = ref(database, PROJECTS_PATH);
    const newProjectRef = push(projectsRef);
    const projectId = newProjectRef.key;

    const project = {
      projectId,
      organizationId: organizationId || 'ultrapower',
      name: projectData.name,
      code: projectData.code || '',
      description: projectData.description || '',
      location: projectData.location || '',
      client: projectData.client || '',
      status: projectData.status || 'planned',
      startDate: projectData.startDate || null,
      expectedCompletionDate: projectData.expectedCompletionDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId || '',
    };

    await set(newProjectRef, project);
    return project;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

export async function getProject(projectId) {
  try {
    const projectRef = ref(database, `${PROJECTS_PATH}/${projectId}`);
    const snapshot = await get(projectRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
}

export async function getProjectsByOrganization(organizationId) {
  try {
    const projectsRef = ref(database, PROJECTS_PATH);
    const snapshot = await get(projectsRef);
    
    if (snapshot.exists()) {
      const projects = snapshot.val();
      return Object.keys(projects)
        .map(key => ({ ...projects[key] }))
        .filter(project => project.organizationId === organizationId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

export async function getAllProjects() {
  try {
    const projectsRef = ref(database, PROJECTS_PATH);
    const snapshot = await get(projectsRef);
    
    if (snapshot.exists()) {
      const projects = snapshot.val();
      return Object.keys(projects)
        .map(key => ({ ...projects[key] }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return [];
  } catch (error) {
    console.error('Error fetching all projects:', error);
    throw error;
  }
}

export async function updateProject(projectId, updates) {
  try {
    const projectRef = ref(database, `${PROJECTS_PATH}/${projectId}`);
    await update(projectRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return await getProject(projectId);
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function archiveProject(projectId) {
  try {
    const projectRef = ref(database, `${PROJECTS_PATH}/${projectId}`);
    await update(projectRef, {
      status: 'archived',
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error archiving project:', error);
    throw error;
  }
}

export async function restoreProject(projectId) {
  try {
    const projectRef = ref(database, `${PROJECTS_PATH}/${projectId}`);
    await update(projectRef, {
      status: 'active',
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error restoring project:', error);
    throw error;
  }
}

export async function hardDeleteProject(projectId) {
  try {
    console.log(`🗑️ Starting deep hard delete for project: ${projectId}`);

    const collectionsToWipe = ['buildings', 'floors', 'wings', 'spaces', 'activities'];
    
    // 1. Wipe all hierarchical data connected to the project
    for (const collection of collectionsToWipe) {
      const q = query(ref(database, collection), orderByChild('projectId'), equalTo(projectId));
      const snapshot = await get(q);
      if (snapshot.exists()) {
        const items = snapshot.val();
        for (const key of Object.keys(items)) {
          await remove(ref(database, `${collection}/${key}`));
        }
      }
    }

    // 2. Wipe Tasks and Submissions
    const qTasks = query(ref(database, 'tasks'), orderByChild('projectId'), equalTo(projectId));
    const snapTasks = await get(qTasks);
    if (snapTasks.exists()) {
      const tasks = snapTasks.val();
      const taskIds = Object.keys(tasks);

      const subSnap = await get(ref(database, 'taskSubmissions'));
      if (subSnap.exists()) {
        const subs = subSnap.val();
        for (const [key, sub] of Object.entries(subs)) {
          if (taskIds.includes(sub.taskId)) {
            await remove(ref(database, `taskSubmissions/${key}`));
          }
        }
      }

      for (const key of taskIds) {
        await remove(ref(database, `tasks/${key}`));
      }
    }

    // 3. Wipe Project Members
    await remove(ref(database, `projectMembers/${projectId}`));

    // 4. Wipe the Project itself
    await remove(ref(database, `${PROJECTS_PATH}/${projectId}`));
    
    console.log(`✅ Successfully wiped project and all child data for: ${projectId}`);
    return true;
  } catch (error) {
    console.error('Error hard deleting project:', error);
    throw error;
  }
}

export async function deleteProject(projectId) {
  return hardDeleteProject(projectId);
}