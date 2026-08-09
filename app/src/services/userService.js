import { database } from '../lib/firebase';
import { ref, set, get, update, child, push, onValue, remove } from 'firebase/database';

/**
 * User Service - Handles all Realtime Database operations for users
 */

// Collection reference
const USERS_PATH = 'users';

/**
 * Create a new user profile in Realtime Database
 */
export async function createUserProfile(userId, userData) {
  try {
    const userRef = ref(database, `${USERS_PATH}/${userId}`);
    
    const profile = {
      uid: userId,
      fullName: userData.fullName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      role: 'documentation_assistant', // Default role - Site Secretary
      organizationId: 'ultrapower', // Default organization
      status: 'active',
      photoURL: userData.photoURL || '',
      position: userData.position || '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    
    await set(userRef, profile);
    return profile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Get user profile by UID
 */
export async function getUserProfile(userId) {
  try {
    const userRef = ref(database, `${USERS_PATH}/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.warn('No user profile found for UID:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  try {
    const userRef = ref(database, `${USERS_PATH}/${userId}`);
    await update(userRef, updates);
    return await getUserProfile(userId);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId) {
  try {
    const userRef = ref(database, `${USERS_PATH}/${userId}`);
    await update(userRef, {
      lastLogin: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

/**
 * Get user role
 */
export async function getUserRole(userId) {
  try {
    const profile = await getUserProfile(userId);
    return profile?.role || 'documentation_assistant';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'documentation_assistant';
  }
}

/**
 * Check if user has a specific role
 */
export async function userHasRole(userId, requiredRole) {
  try {
    const role = await getUserRole(userId);
    return role === requiredRole;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

/**
 * List all users
 */
export async function listAllUsers() {
  try {
    const usersRef = ref(database, USERS_PATH);
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      return Object.keys(users).map(key => ({
        uid: key,
        ...users[key]
      }));
    }
    return [];
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
}

/**
 * Get users by role
 */
export async function getUsersByRole(role) {
  try {
    const allUsers = await listAllUsers();
    return allUsers.filter(user => user.role === role);
  } catch (error) {
    console.error('Error getting users by role:', error);
    return [];
  }
}

/**
 * Update user role (HR/Director only)
 */
export async function updateUserRole(userId, newRole, currentUserRole) {
  try {
    // Check if current user has permission
    if (!['hr', 'director'].includes(currentUserRole)) {
      throw new Error('You do not have permission to change roles');
    }
    
    // Only Director can assign Director role
    if (newRole === 'director' && currentUserRole !== 'director') {
      throw new Error('Only Directors can assign the Director role');
    }
    
    // Prevent changing your own role to something else
    const currentProfile = await getUserProfile(userId);
    if (currentProfile && currentProfile.role === currentUserRole) {
      // You can change your own role if you're Director or HR
      // But HR cannot remove their own HR status without Director
      if (currentUserRole === 'hr' && newRole !== 'hr') {
        throw new Error('HR cannot change their own role. Please contact a Director.');
      }
    }
    
    const userRef = ref(database, `${USERS_PATH}/${userId}`);
    await update(userRef, {
      role: newRole,
      updatedAt: new Date().toISOString(),
    });
    
    return await getUserProfile(userId);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

/**
 * Update user status (Active/Inactive/Suspended)
 */
export async function updateUserStatus(userId, newStatus, currentUserRole) {
  try {
    // Check if current user has permission
    if (!['hr', 'director'].includes(currentUserRole)) {
      throw new Error('You do not have permission to change user status');
    }
    
    const userRef = ref(database, `${USERS_PATH}/${userId}`);
    await update(userRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    
    return await getUserProfile(userId);
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}

/**
 * Delete user (HR/Director only)
 */
export async function deleteUser(userId, currentUserRole) {
  try {
    // Check if current user has permission
    if (!['hr', 'director'].includes(currentUserRole)) {
      throw new Error('You do not have permission to delete users');
    }
    
    // Prevent deleting self
    const currentProfile = await getUserProfile(userId);
    if (currentProfile && currentProfile.uid === userId) {
      throw new Error('You cannot delete your own account');
    }
    
    const userRef = ref(database, `${USERS_PATH}/${userId}`);
    await remove(userRef);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  try {
    const allUsers = await listAllUsers();
    return allUsers.find(user => user.email === email) || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

/**
 * Get user by full name
 */
export async function getUsersByName(name) {
  try {
    const allUsers = await listAllUsers();
    return allUsers.filter(user => 
      user.fullName && user.fullName.toLowerCase().includes(name.toLowerCase())
    );
  } catch (error) {
    console.error('Error getting users by name:', error);
    return [];
  }
}

/**
 * Get all active users
 */
export async function getActiveUsers() {
  try {
    const allUsers = await listAllUsers();
    return allUsers.filter(user => user.status === 'active');
  } catch (error) {
    console.error('Error getting active users:', error);
    return [];
  }
}

/**
 * Get all inactive users
 */
export async function getInactiveUsers() {
  try {
    const allUsers = await listAllUsers();
    return allUsers.filter(user => user.status === 'inactive');
  } catch (error) {
    console.error('Error getting inactive users:', error);
    return [];
  }
}

/**
 * Get all suspended users
 */
export async function getSuspendedUsers() {
  try {
    const allUsers = await listAllUsers();
    return allUsers.filter(user => user.status === 'suspended');
  } catch (error) {
    console.error('Error getting suspended users:', error);
    return [];
  }
}