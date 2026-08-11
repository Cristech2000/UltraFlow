import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  CheckSquare,        // ← Add this
  UserPlus,           // ← Add this (for Task Allocation)
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

// Task management navigation items (shown to appropriate roles)
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

  // Show My Tasks to electricians, Task Allocation and Pending Approvals to supervisors/foremen/directors
  const showTaskNav = canManageTasks || isElectrician;

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isOpen ? 240 : 64,
      }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col bg-sidebar text-white relative flex-shrink-0 h-full overflow-hidden shadow-xl"
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <Zap className="w-6 h-6 text-accent-500 flex-shrink-0" />
          <motion.span
            animate={{
              opacity: isOpen ? 1 : 0,
              width: isOpen ? 'auto' : 0,
            }}
            transition={{ duration: 0.2 }}
            className="font-bold text-lg whitespace-nowrap"
          >
            UltraFlow
          </motion.span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-gray-700/50 transition-colors flex-shrink-0"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all-200 group',
                'hover:bg-gray-700/50 hover:text-white',
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                  : 'text-gray-300'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <motion.span
              animate={{
                opacity: isOpen ? 1 : 0,
                width: isOpen ? 'auto' : 0,
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
            <div className="my-2 border-t border-gray-700/50" />
            <p className={`text-xs text-gray-500 uppercase tracking-wider px-3 py-2 ${!isOpen && 'sr-only'}`}>
              Tasks
            </p>
            {taskNav.map((item) => {
              // Only show Task Allocation and Pending Approvals to supervisors/foremen/directors
              if ((item.path === '/tasks' || item.path === '/pending-approvals') && !canManageTasks) {
                return null;
              }
              // Only show My Tasks to electricians
              if (item.path === '/my-tasks' && !isElectrician && !canManageTasks) {
                return null;
              }
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all-200 group',
                      'hover:bg-gray-700/50 hover:text-white',
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                        : 'text-gray-300'
                    )
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <motion.span
                    animate={{
                      opacity: isOpen ? 1 : 0,
                      width: isOpen ? 'auto' : 0,
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
            <div className="my-2 border-t border-gray-700/50" />
            <p className={`text-xs text-gray-500 uppercase tracking-wider px-3 py-2 ${!isOpen && 'sr-only'}`}>
              Admin
            </p>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all-200 group',
                  'hover:bg-gray-700/50 hover:text-white',
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/25'
                    : 'text-gray-300'
                )
              }
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              <motion.span
                animate={{
                  opacity: isOpen ? 1 : 0,
                  width: isOpen ? 'auto' : 0,
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
      <div className="border-t border-gray-700/50 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
            UP
          </div>
          <motion.div
            animate={{
              opacity: isOpen ? 1 : 0,
              width: isOpen ? 'auto' : 0,
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap"
          >
            <p className="text-sm font-medium">Ultra Power</p>
            <p className="text-xs text-gray-400">Systems Ltd</p>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
}

export default Sidebar;