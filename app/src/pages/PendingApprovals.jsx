import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  getTasksByProject, 
  getTask,
  approveTaskAll, 
  approveTaskSpaces, 
  rejectTaskSpaces,
  getTaskLocation 
} from '../services/taskService';
import { getProjectsByOrganization } from '../services/projectService';
import { getActivity } from '../services/activityService';
import { getUserProfile } from '../services/userService';
import { getSpace } from '../services/spaceService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Building2, 
  Home, 
  Layers, 
  History,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

function PendingApprovals() {
  const { user, userProfile, userRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [approvedTasks, setApprovedTasks] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedSpaces, setSelectedSpaces] = useState({});
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
      
      // Enrich pending tasks with space details
      const enrichedPending = await Promise.all(
        pending.map(async (task) => {
          const activity = await getActivity(task.activityId);
          const submittedByName = await getUserName(task.updatedBy);
          const location = await getTaskLocation(task);
          
          // Get space details for all spaces in this task
          const spaceIds = task.scopeIds || [];
          const spaceDetails = await Promise.all(
            spaceIds.map(async (sid) => {
              const space = await getSpace(sid);
              const progress = task.spaceProgress?.[sid] || {};
              return {
                spaceId: sid,
                name: space?.name || sid,
                code: space?.code || '',
                approved: progress.approved || 0,
                submitted: progress.submitted || 0,
                rejected: progress.rejected || false,
                rejectionReason: progress.rejectionReason || '',
                notes: progress.notes || '',
              };
            })
          );
          
          return { ...task, activity, submittedByName, location, spaceDetails };
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
      
      // Initialize selection state for each task
      const selectionState = {};
      enrichedPending.forEach(task => {
        selectionState[task.taskId] = {};
        task.spaceDetails?.forEach(space => {
          selectionState[task.taskId][space.spaceId] = false;
        });
      });
      setSelectedSpaces(prev => ({ ...prev, ...selectionState }));
      
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

  const toggleTaskExpanded = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const toggleSpaceSelection = (taskId, spaceId) => {
    setSelectedSpaces(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [spaceId]: !prev[taskId]?.[spaceId]
      }
    }));
  };

  const toggleAllSpacesSelection = (taskId, spaceIds) => {
    const allSelected = spaceIds.every(sid => selectedSpaces[taskId]?.[sid]);
    const newState = {};
    spaceIds.forEach(sid => {
      newState[sid] = !allSelected;
    });
    setSelectedSpaces(prev => ({
      ...prev,
      [taskId]: newState
    }));
  };

  const handleApproveAll = async (taskId) => {
    setProcessing(taskId);
    setError('');
    try {
      await approveTaskAll(taskId, user?.uid, reviewNotes);
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

  const handleApproveSelected = async (taskId, spaceIds) => {
    if (spaceIds.length === 0) {
      setError('Please select at least one space to approve');
      return;
    }
    setProcessing(taskId);
    setError('');
    try {
      await approveTaskSpaces(taskId, spaceIds, user?.uid, reviewNotes);
      setSuccess(`✅ ${spaceIds.length} space(s) approved successfully!`);
      setReviewNotes('');
      await loadTasks(selectedProject?.projectId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to approve spaces');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectSelected = async (taskId, spaceIds) => {
    if (spaceIds.length === 0) {
      setError('Please select at least one space to reject');
      return;
    }
    if (!reviewNotes) {
      setError('Please provide a reason for rejection');
      return;
    }
    setProcessing(taskId);
    setError('');
    try {
      await rejectTaskSpaces(taskId, spaceIds, user?.uid, reviewNotes);
      setSuccess(`❌ ${spaceIds.length} space(s) rejected`);
      setReviewNotes('');
      await loadTasks(selectedProject?.projectId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reject spaces');
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
          Review and approve/reject progress submissions with granular space control
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
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pending Submissions</h2>
                  {pendingTasks.map((task) => {
                    const isExpanded = expandedTasks[task.taskId];
                    const spaceIds = task.spaceDetails?.map(s => s.spaceId) || [];
                    const selectedCount = spaceIds.filter(sid => selectedSpaces[task.taskId]?.[sid]).length;
                    const hasSelected = selectedCount > 0;
                    const allSelected = spaceIds.length > 0 && spaceIds.every(sid => selectedSpaces[task.taskId]?.[sid]);
                    
                    return (
                      <Card key={task.taskId} className="overflow-hidden">
                        <div className="space-y-4">
                          {/* Task Header */}
                          <div className="flex flex-col gap-2">
                            <div 
                              className="flex items-center justify-between cursor-pointer"
                              onClick={() => toggleTaskExpanded(task.taskId)}
                            >
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {task.activity?.name || 'Unknown Activity'}
                                </h3>
                                <Badge className={getTaskStatusBadge(task.status).color}>
                                  {getTaskStatusBadge(task.status).label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {task.spaceDetails?.filter(s => s.submitted > 0).length || 0} / {task.spaceDetails?.length || 0} spaces
                                </span>
                                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                              </div>
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
                            
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Overall Progress: {task.submittedProgress || 0}%
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

                          {/* Expanded Space Details */}
                          {isExpanded && task.spaceDetails && (
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                              {/* Select All */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={() => toggleAllSpacesSelection(task.taskId, spaceIds)}
                                    className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                                  />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Select All Spaces
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {selectedCount} selected
                                </span>
                              </div>

                              {/* Spaces List */}
                              <div className="space-y-2 max-h-80 overflow-y-auto">
                                {task.spaceDetails.map((space) => {
                                  const isSelected = selectedSpaces[task.taskId]?.[space.spaceId];
                                  const isRejected = space.rejected;
                                  const hasSubmitted = space.submitted > 0;
                                  
                                  return (
                                    <div
                                      key={space.spaceId}
                                      className={`flex items-center justify-between p-2 rounded-lg border ${
                                        isRejected ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10' :
                                        isSelected ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/30' :
                                        'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="checkbox"
                                          checked={isSelected || false}
                                          onChange={() => toggleSpaceSelection(task.taskId, space.spaceId)}
                                          className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                                          disabled={!hasSubmitted || isRejected}
                                        />
                                        <div>
                                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {space.name}
                                          </p>
                                          {space.code && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{space.code}</p>
                                          )}
                                          {isRejected && (
                                            <p className="text-xs text-red-600 dark:text-red-400">
                                              ⚠️ Rejected: {space.rejectionReason || 'No reason'}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          Previous: {space.approved}%
                                        </span>
                                        <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                                          {space.submitted}% submitted
                                        </span>
                                        {space.notes && (
                                          <span className="text-xs text-gray-400 dark:text-gray-500">
                                            📝 {space.notes}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Review Notes */}
                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Review Notes {!hasSelected && '(Select spaces first)'}
                                </label>
                                <textarea
                                  placeholder="Add review notes (required for rejection)..."
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleApproveAll(task.taskId)}
                                  loading={processing === task.taskId}
                                >
                                  <CheckCircle size={14} className="mr-1" />
                                  Approve All
                                </Button>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => handleApproveSelected(task.taskId, spaceIds.filter(sid => selectedSpaces[task.taskId]?.[sid]))}
                                  loading={processing === task.taskId}
                                  disabled={!hasSelected}
                                >
                                  <CheckCircle size={14} className="mr-1" />
                                  Approve Selected ({selectedCount})
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleRejectSelected(task.taskId, spaceIds.filter(sid => selectedSpaces[task.taskId]?.[sid]))}
                                  loading={processing === task.taskId}
                                  disabled={!hasSelected || !reviewNotes}
                                >
                                  <XCircle size={14} className="mr-1" />
                                  Reject Selected ({selectedCount})
                                </Button>
                              </div>
                              {!reviewNotes && hasSelected && (
                                <p className="text-xs text-red-500 mt-2">⚠️ Review notes are required for rejection</p>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
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