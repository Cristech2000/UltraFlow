import React, { createContext, useState, useEffect, useCallback } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { getUserProfile, updateLastLogin, createUserProfile } from '../services/userService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
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
            // User is authenticated
            setUser(firebaseUser);
            console.log('👤 User authenticated:', firebaseUser.uid);
            
            // Load user profile from Realtime Database
            console.log('📡 Fetching user profile...');
            const profile = await getUserProfile(firebaseUser.uid);
            console.log('📦 Profile data:', profile);
            
            if (profile) {
              console.log('✅ Profile found, setting...');
              setUserProfile(profile);
              // Update last login
              await updateLastLogin(firebaseUser.uid);
            } else {
              // Profile doesn't exist - create it
              console.log('⚠️ Profile missing, creating one...');
              const newProfile = await createUserProfile(firebaseUser.uid, {
                fullName: firebaseUser.displayName || '',
                email: firebaseUser.email || '',
                photoURL: firebaseUser.photoURL || '',
              });
              console.log('✅ New profile created:', newProfile);
              setUserProfile(newProfile);
            }
            
            setError(null);
          } else {
            // User is signed out
            console.log('👋 User signed out');
            setUser(null);
            setUserProfile(null);
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
    } catch (error) {
      setError(error);
      throw error;
    }
  }, []);

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

  const value = {
    user,
    userProfile,
    loading,
    error,
    signOut,
    refreshProfile,
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