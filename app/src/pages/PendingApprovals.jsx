import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTasksByProject, approveTaskProgress, rejectTaskProgress, getTaskLocation } from '../services/taskService';
import { getProjectsByOrganization } from '../services/projectService';
import { getActivity } from '../services/activityService';
import { getUserProfile } from '../services/userService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { CheckCircle, XCircle, Clock, Users, Building2, Home, Layers, History } from 'lucide-react';

function PendingApprovals() {
  const { user, userProfile, userRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [approvedTasks, setApprovedTasks] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [userNames, setUserNames] = useState({});

  const canApprove = ['director', 'supervisor', 'foreman'].includes(userRole);

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const orgId = userProfile?.organizationId || 'ultrapower';
        const projectsData = await getProjectsByOrganization(orgId);
        setProjects(projectsData);
      } catch (err) {
        console.error('Error loading projects:', err);
      }
    };
    loadProjects();
  }, [userProfile]);

  const getUserName = async (userId) => {
    if (userNames[userId]) return userNames[userId];
    try {
      const profile = await getUserProfile(userId);
      const name = profile?.fullName || userId;
      setUserNames(prev => ({ ...prev, [userId]: name }));
      return name;
    } catch {
      return userId;
    }
  };

  const loadTasks = async (projectId) => {
    setLoading(true);
    setError('');
    try {
      const tasks = await getTasksByProject(projectId);
      const pending = tasks.filter(t => t.status === 'submitted');
      const approved = tasks.filter(t => t.status === 'approved' || t.status === 'rejected');
      
      const enrichedPending = await Promise.all(
        pending.map(async (task) => {
          const activity = await getActivity(task.activityId);
          const submittedByName = await getUserName(task.updatedBy);
          const location = await getTaskLocation(task);
          return { ...task, activity, submittedByName, location };
        })
      );
      setPendingTasks(enrichedPending);

      const enrichedApproved = await Promise.all(
        approved.map(async (task) => {
          const activity = await getActivity(task.activityId);
          const submittedByName = await getUserName(task.updatedBy);
          const location = await getTaskLocation(task);
          return { ...task, activity, submittedByName, location };
        })
      );
      setApprovedTasks(enrichedApproved);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = (projectId) => {
    const project = projects.find(p => p.projectId === projectId);
    setSelectedProject(project);
    if (projectId) {
      loadTasks(projectId);
    } else {
      setPendingTasks([]);
      setApprovedTasks([]);
    }
  };

  const handleApprove = async (taskId) => {
    setProcessing(taskId);
    setError('');
    try {
      await approveTaskProgress(taskId, user?.uid, reviewNotes);
      setSuccess('✅ Task approved successfully!');
      setReviewNotes('');
      await loadTasks(selectedProject?.projectId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to approve task');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (taskId) => {
    if (!reviewNotes) {
      setError('Please provide a reason for rejection');
      return;
    }
    setProcessing(taskId);
    setError('');
    try {
      await rejectTaskProgress(taskId, user?.uid, reviewNotes);
      setSuccess('❌ Task rejected');
      setReviewNotes('');
      await loadTasks(selectedProject?.projectId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reject task');
    } finally {
      setProcessing(null);
    }
  };

  const getTaskStatusBadge = (status) => {
    const map = {
      'submitted': { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'approved': { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };
    return map[status] || map['submitted'];
  };

  if (!canApprove) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <XCircle size={48} className="text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Only Supervisors, Foremen, and Directors can approve tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pending Approvals</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Review and approve/reject progress submissions
        </p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Project Selection */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Select Project
            </label>
            <select
              value={selectedProject?.projectId || ''}
              onChange={(e) => handleProjectSelect(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a project...</option>
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              icon={<History size={16} />}
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Hide History' : 'Show History'}
            </Button>
          </div>
        </div>
      </Card>

      {selectedProject && (
        <>
          {loading ? (
            <div className="py-8 text-center">Loading tasks...</div>
          ) : (
            <>
              {/* Pending Tasks */}
              {pendingTasks.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pending Submissions</h2>
                  {pendingTasks.map((task) => (
                    <Card key={task.taskId} className="overflow-hidden">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {task.activity?.name || 'Unknown Activity'}
                            </h3>
                            <Badge className={getTaskStatusBadge(task.status).color}>
                              {getTaskStatusBadge(task.status).label}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Team: {task.teamName} • Submitted by: {task.submittedByName || task.updatedBy || 'Unknown'}
                          </div>
                          
                          {/* LOCATION DISPLAY */}
                          {task.location && (
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                              {task.location.projectName && (
                                <span className="flex items-center gap-1">
                                  <Building2 size={12} />
                                  {task.location.projectName}
                                </span>
                              )}
                              {task.location.buildingName && <span>• {task.location.buildingName}</span>}
                              {task.location.floorName && <span>• {task.location.floorName}</span>}
                              {task.location.wingName && <span>• {task.location.wingName}</span>}
                              <span>• {task.location.spaceCount || 0} spaces</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Progress: {task.submittedProgress || 0}%
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Previous: {task.approvedProgress || 0}%
                            </span>
                            <span className="text-sm text-green-500">
                              +{(task.submittedProgress || 0) - (task.approvedProgress || 0)}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            📅 Submitted: {new Date(task.updatedAt).toLocaleString()}
                          </div>
                        </div>

                        {/* Approval Actions */}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Review Notes
                              </label>
                              <input
                                type="text"
                                placeholder="Add notes (required for rejection)"
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                            <div className="flex items-end gap-3">
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleReject(task.taskId)}
                                loading={processing === task.taskId}
                              >
                                <XCircle size={14} className="mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleApprove(task.taskId)}
                                loading={processing === task.taskId}
                              >
                                <CheckCircle size={14} className="mr-1" />
                                Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {pendingTasks.length === 0 && (
                <Card>
                  <div className="py-8 text-center">
                    <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No pending approvals</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">All tasks are up to date</p>
                  </div>
                </Card>
              )}

              {/* Approval History */}
              {showHistory && approvedTasks.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Approval History</h2>
                  <div className="space-y-3">
                    {approvedTasks.map((task) => (
                      <Card key={task.taskId} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {task.activity?.name || 'Unknown Activity'}
                              </h4>
                              <Badge className={getTaskStatusBadge(task.status).color}>
                                {getTaskStatusBadge(task.status).label}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Team: {task.teamName} • Submitted by: {task.submittedByName || task.updatedBy || 'Unknown'}
                            </div>
                            {task.location && (
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                {task.location.projectName && (
                                  <span className="flex items-center gap-1">
                                    <Building2 size={12} />
                                    {task.location.projectName}
                                  </span>
                                )}
                                {task.location.buildingName && <span>• {task.location.buildingName}</span>}
                                {task.location.floorName && <span>• {task.location.floorName}</span>}
                                {task.location.wingName && <span>• {task.location.wingName}</span>}
                              </div>
                            )}
                            <div className="mt-1 flex items-center gap-4 text-sm">
                              <span>Progress: {task.approvedProgress || 0}%</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                📅 {new Date(task.updatedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {task.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {showHistory && approvedTasks.length === 0 && (
                <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
                  No approval history yet
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default PendingApprovals;