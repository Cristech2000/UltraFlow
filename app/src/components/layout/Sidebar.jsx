import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Clock,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  PenTool,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  CheckSquare,
  UserPlus,
  X // ← Added X for the mobile close button
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

const navigation = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'Timeline', path: '/timeline', icon: Clock },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Assessments', path: '/assessments', icon: ClipboardCheck },
  { name: 'Issues', path: '/issues', icon: AlertTriangle },
  { name: 'Drawings', path: '/drawings', icon: PenTool },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'People', path: '/people', icon: Users },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const taskNav = [
  { name: 'Task Allocation', path: '/tasks', icon: UserPlus },
  { name: 'My Tasks', path: '/my-tasks', icon: CheckSquare },
  { name: 'Pending Approvals', path: '/pending-approvals', icon: Clock },
];

function Sidebar({ isOpen, onToggle }) {
  const { userRole } = useAuth();
  const isAdmin = ['hr', 'director'].includes(userRole);
  const canManageTasks = ['director', 'supervisor', 'foreman'].includes(userRole);
  const isElectrician = userRole === 'electrician';

  const showTaskNav = canManageTasks || isElectrician;

  // 🔥 NEW: Detect if we are on a mobile screen
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔥 NEW: Auto-close sidebar on mobile when a link is clicked
  const handleNavClick = () => {
    if (isMobile && isOpen) {
      onToggle();
    }
  };

  return (
    <>
      {/* 🔥 NEW: Mobile Overlay Backdrop */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={
          isMobile
            ? { width: 260, x: isOpen ? 0 : '-100%' } // Drawer slides entirely off screen on mobile
            : { width: isOpen ? 240 : 64, x: 0 }      // Shrinks to icons on desktop
        }
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          "flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white flex-shrink-0 h-full overflow-hidden shadow-xl dark:shadow-none",
          isMobile ? "fixed z-50 top-0 left-0" : "relative"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <Zap className="w-6 h-6 text-primary-600 dark:text-primary-500 flex-shrink-0" />
            <motion.span
              animate={{
                opacity: (isMobile || isOpen) ? 1 : 0,
                width: (isMobile || isOpen) ? 'auto' : 0,
              }}
              transition={{ duration: 0.2 }}
              className="font-bold text-lg whitespace-nowrap text-gray-900 dark:text-white"
            >
              UltraFlow
            </motion.span>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 flex-shrink-0 transition-colors shadow-sm"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {/* Show an X to close on mobile, and the Chevrons on desktop */}
            {isMobile ? <X size={18} /> : (isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />)}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all-200 group',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400 font-medium shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <motion.span
                animate={{
                  opacity: (isMobile || isOpen) ? 1 : 0,
                  width: (isMobile || isOpen) ? 'auto' : 0,
                }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden"
              >
                {item.name}
              </motion.span>
            </NavLink>
          ))}

          {/* Task Management Section */}
          {showTaskNav && (
            <>
              <div className="my-2 border-t border-gray-200 dark:border-gray-800" />
              <p className={`text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 ${(!isMobile && !isOpen) && 'sr-only'}`}>
                Tasks
              </p>
              {taskNav.map((item) => {
                if ((item.path === '/tasks' || item.path === '/pending-approvals') && !canManageTasks) {
                  return null;
                }
                if (item.path === '/my-tasks' && !isElectrician && !canManageTasks) {
                  return null;
                }
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all-200 group',
                        isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400 font-medium shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      )
                    }
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <motion.span
                      animate={{
                        opacity: (isMobile || isOpen) ? 1 : 0,
                        width: (isMobile || isOpen) ? 'auto' : 0,
                      }}
                      transition={{ duration: 0.2 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  </NavLink>
                );
              })}
            </>
          )}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="my-2 border-t border-gray-200 dark:border-gray-800" />
              <p className={`text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 ${(!isMobile && !isOpen) && 'sr-only'}`}>
                Admin
              </p>
              <NavLink
                to="/admin/users"
                onClick={handleNavClick}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all-200 group',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400 font-medium shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  )
                }
              >
                <Shield className="w-5 h-5 flex-shrink-0" />
                <motion.span
                  animate={{
                    opacity: (isMobile || isOpen) ? 1 : 0,
                    width: (isMobile || isOpen) ? 'auto' : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  User Management
                </motion.span>
              </NavLink>
            </>
          )}
        </nav>

        {/* Bottom */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm">
              UP
            </div>
            <motion.div
              animate={{
                opacity: (isMobile || isOpen) ? 1 : 0,
                width: (isMobile || isOpen) ? 'auto' : 0,
              }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">Ultra Power</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Systems Ltd</p>
            </motion.div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

export default Sidebar;