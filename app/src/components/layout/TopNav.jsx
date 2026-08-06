import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import Breadcrumb from './Breadcrumb';
import { cn } from '../../lib/utils';

function TopNav({ onMenuClick }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search logic
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
      <div className="flex items-center justify-between h-16 px-4 gap-4">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <Breadcrumb />
        </div>

        {/* Center - Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects, spaces, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all-200"
            />
            <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 hidden md:inline-block">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold">
                {user?.displayName?.[0] || user?.email?.[0] || 'U'}
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowProfileMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium">
                      {user?.displayName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopNav;