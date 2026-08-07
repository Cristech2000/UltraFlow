import { database } from '../lib/firebase';
import { ref, set, get, update, child, push, onValue } from 'firebase/database';

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
      role: 'documentation_assistant', // Default role
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
 * List all users (Admin only)
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