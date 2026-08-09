import { database } from '../lib/firebase';
import { ref, set, get, update, push, remove } from 'firebase/database';

/**
 * Project Service - Handles all project-related Realtime Database operations
 */

const PROJECTS_PATH = 'projects';

/**
 * Create a new project
 */
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

/**
 * Get a project by ID
 */
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

/**
 * Get all projects for an organization
 */
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

/**
 * Get all projects (Admin only)
 */
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

/**
 * Update a project
 */
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

/**
 * Archive a project (Soft delete - keeps data but hides from active view)
 */
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

/**
 * Restore an archived project
 */
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

/**
 * Hard delete a project (Permanently removes from database)
 * Use with caution - this cannot be undone
 */
export async function hardDeleteProject(projectId) {
  try {
    const projectRef = ref(database, `${PROJECTS_PATH}/${projectId}`);
    await remove(projectRef);
    return true;
  } catch (error) {
    console.error('Error hard deleting project:', error);
    throw error;
  }
}

/**
 * Delete a project (Alias for hardDeleteProject - maintained for backward compatibility)
 */
export async function deleteProject(projectId) {
  return hardDeleteProject(projectId);
}