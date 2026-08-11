import { database } from '../lib/firebase';
import { ref, set, get, update, push, remove, query, orderByChild, equalTo } from 'firebase/database';

const MEMBERSHIP_PATH = 'projectMembers';

/**
 * Assign a user to a project
 */
export async function assignUserToProject(projectId, userId, userData, assignedBy) {
  try {
    const memberRef = ref(database, `${MEMBERSHIP_PATH}/${projectId}/${userId}`);
    await set(memberRef, {
      uid: userId,
      fullName: userData.fullName || '',
      email: userData.email || '',
      role: userData.role || '',
      assignedAt: new Date().toISOString(),
      assignedBy: assignedBy || '',
    });
    return true;
  } catch (error) {
    console.error('Error assigning user to project:', error);
    throw error;
  }
}

/**
 * Remove a user from a project
 */
export async function removeUserFromProject(projectId, userId) {
  try {
    const memberRef = ref(database, `${MEMBERSHIP_PATH}/${projectId}/${userId}`);
    await remove(memberRef);
    return true;
  } catch (error) {
    console.error('Error removing user from project:', error);
    throw error;
  }
}

/**
 * Get all members of a project
 */
export async function getProjectMembers(projectId) {
  try {
    const membersRef = ref(database, `${MEMBERSHIP_PATH}/${projectId}`);
    const snapshot = await get(membersRef);
    
    if (snapshot.exists()) {
      const members = snapshot.val();
      return Object.keys(members).map(key => ({
        uid: key,
        ...members[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching project members:', error);
    return [];
  }
}

/**
 * Get members of a project by role
 */
export async function getProjectMembersByRole(projectId, role) {
  try {
    const members = await getProjectMembers(projectId);
    return members.filter(member => member.role === role);
  } catch (error) {
    console.error('Error fetching project members by role:', error);
    return [];
  }
}

/**
 * Check if a user is a member of a project
 */
export async function isProjectMember(projectId, userId) {
  try {
    const memberRef = ref(database, `${MEMBERSHIP_PATH}/${projectId}/${userId}`);
    const snapshot = await get(memberRef);
    return snapshot.exists();
  } catch (error) {
    console.error('Error checking project membership:', error);
    return false;
  }
}

/**
 * Get all projects a user is assigned to
 */
export async function getUserProjects(userId) {
  try {
    // Get all project memberships
    const membershipRef = ref(database, MEMBERSHIP_PATH);
    const snapshot = await get(membershipRef);
    
    if (snapshot.exists()) {
      const allProjects = snapshot.val();
      const userProjects = [];
      
      for (const [projectId, members] of Object.entries(allProjects)) {
        if (members[userId]) {
          userProjects.push({
            projectId: projectId,
            ...members[userId]
          });
        }
      }
      
      return userProjects;
    }
    return [];
  } catch (error) {
    console.error('Error fetching user projects:', error);
    return [];
  }
}

/**
 * Get eligible users for task assignment (project members with specific roles)
 */
export async function getEligibleTaskMembers(projectId) {
  try {
    const members = await getProjectMembers(projectId);
    // Filter to electricians and foremen (eligible for task assignment)
    return members.filter(m => ['electrician', 'foreman'].includes(m.role));
  } catch (error) {
    console.error('Error fetching eligible task members:', error);
    return [];
  }
}

/**
 * Get project IDs a user is assigned to (for filtering)
 */
export async function getUserProjectIds(userId) {
  try {
    const userProjects = await getUserProjects(userId);
    return userProjects.map(p => p.projectId);
  } catch (error) {
    console.error('Error fetching user project IDs:', error);
    return [];
  }
}