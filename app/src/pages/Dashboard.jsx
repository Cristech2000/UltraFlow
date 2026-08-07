import React from 'react';
import { useAuth } from '../hooks/useAuth';
import DashboardLoader from '../components/dashboard/DashboardLoader';

function Dashboard() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return <DashboardLoader userProfile={userProfile} />;
}

export default Dashboard;