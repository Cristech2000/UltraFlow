import { useAuth } from './useAuth';
import { isProjectMember } from '../services/membershipService';
import { useState, useEffect } from 'react';

export function useProjectAccess(projectId) {
  const { user, isGlobalRole, projectIds } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user || !projectId) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Global roles (HR, Director) have access to all projects
      if (isGlobalRole) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Check if user is a member of this project
      const isMember = await isProjectMember(projectId, user.uid);
      setHasAccess(isMember);
      setLoading(false);
    };

    checkAccess();
  }, [user, projectId, isGlobalRole]);

  return { hasAccess, loading };
}