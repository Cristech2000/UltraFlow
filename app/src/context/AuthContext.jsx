import React, { createContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getUserProfile, updateLastLogin, createUserProfile } from '../services/userService';
import { getUserProjects } from '../services/membershipService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        console.log('🔐 Auth state changed:', firebaseUser?.uid || 'No user');
        setLoading(true);
        
        try {
          if (firebaseUser) {
            setUser(firebaseUser);
            console.log('👤 User authenticated:', firebaseUser.uid);
            
            const profile = await getUserProfile(firebaseUser.uid);
            console.log('📦 Profile data:', profile);
            
            if (profile) {
              setUserProfile(profile);
              await updateLastLogin(firebaseUser.uid);
              
              // Load user's assigned projects
              const projects = await getUserProjects(firebaseUser.uid);
              setUserProjects(projects);
              console.log('📋 User projects:', projects);
            } else {
              console.log('⚠️ Profile missing, creating one...');
              const newProfile = await createUserProfile(firebaseUser.uid, {
                fullName: firebaseUser.displayName || '',
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || '',
              });
              setUserProfile(newProfile);
            }
            
            setError(null);
          } else {
            setUser(null);
            setUserProfile(null);
            setUserProjects([]);
            setError(null);
          }
        } catch (err) {
          console.error('❌ Auth state change error:', err);
          setError(err);
        } finally {
          console.log('🏁 Loading complete');
          setLoading(false);
        }
      },
      (error) => {
        console.error('❌ Auth state error:', error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setUserProjects([]);
    } catch (error) {
      setError(error);
      throw error;
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    if (user) {
      try {
        const projects = await getUserProjects(user.uid);
        setUserProjects(projects);
        return projects;
      } catch (error) {
        console.error('Error refreshing projects:', error);
      }
    }
    return [];
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setUserProfile(profile);
        }
        return profile;
      } catch (error) {
        console.error('Error refreshing profile:', error);
        throw error;
      }
    }
    return null;
  }, [user]);

  const isGlobalRole = ['hr', 'director'].includes(userProfile?.role);
  const projectIds = userProjects.map(p => p.projectId);

  const value = {
    user,
    userProfile,
    userProjects,
    projectIds,
    isGlobalRole,
    loading,
    error,
    signOut,
    refreshProfile,
    refreshProjects,
    isAuthenticated: !!user,
    userRole: userProfile?.role || 'documentation_assistant',
    organizationId: userProfile?.organizationId || 'ultrapower',
    userStatus: userProfile?.status || 'active',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}