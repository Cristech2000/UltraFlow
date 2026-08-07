import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * RoleGuard - Protects routes based on user roles
 * 
 * @param {string|string[]} roles - Required role(s) to access the route
 * @param {React.ReactNode} children - Content to render if authorized
 * @param {string} redirectTo - Where to redirect if unauthorized (default: '/')
 * @param {React.ReactNode} fallback - Optional fallback UI when unauthorized
 */
function RoleGuard({ 
  roles, 
  children, 
  redirectTo = '/',
  fallback = null 
}) {
  const { user, userProfile, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If no roles specified, just check authentication
  if (!roles) {
    return children;
  }

  // Check if user has required role
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  const userRole = userProfile?.role || 'documentation_assistant';
  const hasRequiredRole = requiredRoles.includes(userRole);

  // If user doesn't have required role
  if (!hasRequiredRole) {
    if (fallback) {
      return fallback;
    }
    return <Navigate to={redirectTo} replace />;
  }

  // User is authorized
  return children;
}

export default RoleGuard;