import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

function AuthLayout() {
  const location = useLocation();
  
  // Get page title based on route
  const getTitle = () => {
    if (location.pathname === '/login') return 'Sign In';
    if (location.pathname === '/signup') return 'Sign Up';
    if (location.pathname === '/forgot-password') return 'Reset Password';
    return 'Authentication';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-700 dark:text-primary-400 tracking-tight">
            UltraFlow
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {getTitle()} • Construction Intelligence
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}

export default AuthLayout;