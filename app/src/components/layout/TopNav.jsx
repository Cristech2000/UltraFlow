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
  Settings,
  UserCircle,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import Breadcrumb from './Breadcrumb';
import Avatar from '../common/Avatar';
import { cn } from '../../lib/utils';

function TopNav({ onMenuClick }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, userProfile, signOut } = useAuth();
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
      console.log('Searching for:', searchQuery);
    }
  };

  const getRoleDisplay = (role) => {
    if (!role) return 'User';
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
              aria-label="User menu"
            >
              <Avatar
                src={userProfile?.photoURL}
                name={userProfile?.fullName || user?.displayName || user?.email}
                size="sm"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userProfile?.fullName || user?.displayName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getRoleDisplay(userProfile?.role)}
                </p>
              </div>
              <ChevronDown size={16} className="text-gray-400 hidden md:block" />
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
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden"
                >
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={userProfile?.photoURL}
                        name={userProfile?.fullName || user?.displayName || user?.email}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {userProfile?.fullName || user?.displayName || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.email}
                        </p>
                        <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                          {getRoleDisplay(userProfile?.role)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <UserCircle size={16} />
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Settings size={16} />
                      Settings
                    </button>
                    {userProfile?.role === 'director' && (
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/admin');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <Shield size={16} />
                        Admin Panel
                      </button>
                    )}
                  </div>

                  {/* Sign Out */}
                  <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
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