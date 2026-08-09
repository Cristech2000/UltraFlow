import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Shield,
  UserCheck,
  UserX,
  Clock,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
  listAllUsers, 
  updateUserRole, 
  updateUserStatus, 
  deleteUser,
  getActiveUsers,
  getUsersByRole,
} from '../services/userService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Avatar from '../components/common/Avatar';
import Input from '../components/common/Input';
import { ROLES, ROLE_DISPLAY_NAMES, ROLE_HIERARCHY } from '../constants/roles';

function UserManagement() {
  const { userProfile, userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Permission checks
  const canManageUsers = ['hr', 'director'].includes(userRole);
  const canAssignDirector = userRole === 'director';

  // Load users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await listAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers) {
      loadUsers();
    }
  }, [canManageUsers]);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await updateUserRole(userId, newRole, userRole);
      setSuccess('✅ User role updated successfully!');
      await loadUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to update role');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (userId, newStatus) => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await updateUserStatus(userId, newStatus, userRole);
      setSuccess(`✅ User status updated to ${newStatus}!`);
      await loadUsers();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await deleteUser(userId, userRole);
      setSuccess('✅ User deleted successfully!');
      await loadUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to delete user');
    } finally {
      setIsSaving(false);
    }
  };

  // Get role badge color
  const getRoleColor = (role) => {
    const colors = {
      [ROLES.ELECTRICIAN]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      [ROLES.FOREMAN]: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      [ROLES.DOCUMENTATION_ASSISTANT]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      [ROLES.SUPERVISOR]: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      [ROLES.ENGINEER]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      [ROLES.HR]: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
      [ROLES.DIRECTOR]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[role] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const variants = {
      active: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
      suspended: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
    };
    const variant = variants[status] || variants.active;
    const Icon = variant.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variant.color}`}>
        <Icon size={12} />
        {status || 'Active'}
      </span>
    );
  };

  // Get role display name
  const getRoleDisplay = (role) => ROLE_DISPLAY_NAMES[role] || role;

  // Get role options based on user's permission
  const getAvailableRoles = () => {
    const roles = Object.values(ROLES);
    if (!canAssignDirector) {
      return roles.filter(role => role !== ROLES.DIRECTOR);
    }
    return roles;
  };

  // Count users by role
  const getRoleCount = (role) => {
    return users.filter(u => u.role === role).length;
  };

  // Count users by status
  const getStatusCount = (status) => {
    return users.filter(u => u.status === status).length;
  };

  if (!canManageUsers) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage all users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadUsers}
            icon={<RefreshCw size={16} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              // Will implement Add User in Sprint 3
              alert('Add User feature coming soon!');
            }}
          >
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard 
          label="Total Users" 
          value={users.length} 
          icon={Users} 
          color="text-primary-500" 
        />
        <StatCard 
          label="Active" 
          value={getStatusCount('active')} 
          icon={UserCheck} 
          color="text-green-500" 
        />
        <StatCard 
          label="Inactive" 
          value={getStatusCount('inactive')} 
          icon={UserX} 
          color="text-gray-500" 
        />
        <StatCard 
          label="Suspended" 
          value={getStatusCount('suspended')} 
          icon={AlertCircle} 
          color="text-red-500" 
        />
      </div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400"
        >
          {success}
        </motion.div>
      )}
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all-200"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all-200"
            >
              <option value="all">All Roles</option>
              {Object.values(ROLES).map(role => (
                <option key={role} value={role}>
                  {getRoleDisplay(role)} ({getRoleCount(role)})
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </Card>

      {/* User List */}
      <Card>
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={48} className="text-gray-400 mx-auto" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Last Login</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.photoURL}
                          name={user.fullName}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.fullName || 'Unnamed User'}
                          </p>
                          {user.uid === userProfile?.uid && (
                            <span className="text-xs text-primary-500 font-medium">(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getRoleColor(user.role)}`}>
                        {getRoleDisplay(user.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Role Button */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Edit Role"
                          disabled={user.uid === userProfile?.uid && userRole === 'hr'}
                        >
                          <Edit2 size={16} className="text-gray-500 hover:text-primary-500" />
                        </button>
                        
                        {/* Status Toggle */}
                        <button
                          onClick={() => {
                            const newStatus = user.status === 'active' ? 'inactive' : 'active';
                            handleStatusChange(user.uid, newStatus);
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                          disabled={user.uid === userProfile?.uid}
                        >
                          {user.status === 'active' ? (
                            <UserX size={16} className="text-gray-500 hover:text-red-500" />
                          ) : (
                            <UserCheck size={16} className="text-gray-500 hover:text-green-500" />
                          )}
                        </button>
                        
                        {/* Delete Button */}
                        {user.uid !== userProfile?.uid && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={16} className="text-gray-500 hover:text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit User Role</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <XCircle size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Avatar
                    src={selectedUser.photoURL}
                    name={selectedUser.fullName}
                    size="md"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedUser.fullName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Current Role
                  </label>
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${getRoleColor(selectedUser.role)}`}>
                    {getRoleDisplay(selectedUser.role)}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Assign New Role
                  </label>
                  <select
                    defaultValue={selectedUser.role}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onChange={(e) => {
                      const newRole = e.target.value;
                      handleRoleChange(selectedUser.uid, newRole);
                    }}
                  >
                    {getAvailableRoles().map(role => (
                      <option key={role} value={role}>
                        {getRoleDisplay(role)}
                      </option>
                    ))}
                  </select>
                  {selectedUser.role === ROLES.DIRECTOR && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Changing Director role requires careful consideration</p>
                  )}
                </div>

                {selectedUser.uid === userProfile?.uid && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      ⚠️ You are changing your own role. Make sure you can still access this page.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    // Reset to current role
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete User</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-white">{selectedUser.fullName}</span>?
                  This action cannot be undone.
                </p>
                <div className="flex justify-center gap-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteUser(selectedUser.uid)}
                    loading={isSaving}
                  >
                    Delete User
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`${color} bg-gray-100 dark:bg-gray-800 p-2 rounded-lg`}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}

export default UserManagement;