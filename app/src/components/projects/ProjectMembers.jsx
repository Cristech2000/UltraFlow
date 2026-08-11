import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, X, Trash2, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getProjectMembers, 
  assignUserToProject, 
  removeUserFromProject,
  getEligibleTaskMembers
} from '../../services/membershipService';
import { listAllUsers } from '../../services/userService';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Avatar from '../common/Avatar';
import Input from '../common/Input';
import { getRoleDisplayName } from '../../constants/roles';

function ProjectMembers({ projectId, projectName, onUpdate }) {
  const { user, userProfile } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const canManageMembers = ['hr', 'director'].includes(userProfile?.role);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const membersData = await getProjectMembers(projectId);
      setMembers(membersData);
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const users = await listAllUsers();
      // Filter out users already in this project
      const memberIds = members.map(m => m.uid);
      const availableUsers = users.filter(u => !memberIds.includes(u.uid));
      setAllUsers(availableUsers);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadMembers();
    }
  }, [projectId]);

  useEffect(() => {
    if (showAssignModal) {
      loadAllUsers();
    }
  }, [showAssignModal, members]);

  const handleAssignUsers = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      for (const userId of selectedUsers) {
        const userData = allUsers.find(u => u.uid === userId);
        if (userData) {
          await assignUserToProject(
            projectId,
            userId,
            {
              fullName: userData.fullName || '',
              email: userData.email || '',
              role: userData.role || '',
            },
            user?.uid
          );
        }
      }

      setSuccess(`✅ ${selectedUsers.length} user(s) assigned successfully!`);
      setSelectedUsers([]);
      await loadMembers();
      if (onUpdate) onUpdate();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to assign users');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveUser = async (userId, fullName) => {
    if (!confirm(`Are you sure you want to remove ${fullName} from this project?`)) return;
    
    try {
      await removeUserFromProject(projectId, userId);
      await loadMembers();
      if (onUpdate) onUpdate();
      setSuccess(`✅ User removed successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to remove user');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredAvailableUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredAvailableUsers.map(u => u.uid));
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || m.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const filteredAvailableUsers = allUsers.filter(u => {
    const matchesSearch = u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Group members by role
  const membersByRole = {};
  members.forEach(m => {
    const role = m.role || 'unknown';
    if (!membersByRole[role]) membersByRole[role] = [];
    membersByRole[role].push(m);
  });

  if (!canManageMembers) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Members</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage team members assigned to this project
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<UserPlus size={16} />}
          onClick={() => setShowAssignModal(true)}
        >
          Assign User
        </Button>
      </div>

      {/* Success/Error */}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Roles</option>
          <option value="director">Director</option>
          <option value="hr">HR</option>
          <option value="engineer">Engineer</option>
          <option value="supervisor">Supervisor</option>
          <option value="foreman">Foreman</option>
          <option value="documentation_assistant">Documentation Assistant</option>
          <option value="electrician">Electrician</option>
        </select>
      </div>

      {/* Members List - Grouped by Role */}
      {loading ? (
        <div className="py-8 text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading members...</p>
        </div>
      ) : members.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <Users size={32} className="text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No members assigned yet</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.keys(membersByRole).map(role => (
            <div key={role}>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                {getRoleDisplayName(role)}s
              </h4>
              <div className="space-y-2">
                {membersByRole[role].map(member => (
                  <div
                    key={member.uid}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={member.photoURL}
                        name={member.fullName}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.fullName || member.email || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge size="sm" variant="secondary">
                        {getRoleDisplayName(member.role)}
                      </Badge>
                      <button
                        onClick={() => handleRemoveUser(member.uid, member.fullName)}
                        className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        title="Remove from project"
                      >
                        <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Users Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Users</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add users to <span className="font-medium">{projectName}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {allUsers.length} available users
                  </p>
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-primary-500 hover:text-primary-600"
                  >
                    {selectedUsers.length === filteredAvailableUsers.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {allUsers.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No users available to assign
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredAvailableUsers.map(u => (
                      <label
                        key={u.uid}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedUsers.includes(u.uid)
                            ? 'bg-primary-50 dark:bg-primary-950/30 border border-primary-300 dark:border-primary-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.uid)}
                          onChange={() => toggleUserSelection(u.uid)}
                          className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                        />
                        <Avatar
                          src={u.photoURL}
                          name={u.fullName}
                          size="sm"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {u.fullName || u.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {u.email} • {getRoleDisplayName(u.role)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAssignUsers}
                    loading={submitting}
                    disabled={selectedUsers.length === 0}
                  >
                    Assign {selectedUsers.length} User{selectedUsers.length !== 1 ? 's' : ''}
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

export default ProjectMembers;