import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getTasksForUser, getTaskLocation } from '../services/taskService';
import { getActivity } from '../services/activityService';
import { getUserProfile } from '../services/userService';
import { getSpace } from '../services/spaceService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
import { CheckCircle, Clock, XCircle, Users, Building2, Home, Layers, Eye, ChevronDown, ChevronRight } from 'lucide-react';

function MyTasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTasks, setExpandedTasks] = useState({});
  const [userNames, setUserNames] = useState({});

  const getUserName = async (userId) => {
    if (!userId) return 'Not assigned';
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

  const loadTasks = async () => {
    setLoading(true);
    try {
      const tasksData = await getTasksForUser(user?.uid);
      
      const enrichedTasks = await Promise.all(
        tasksData.map(async (task) => {
          const activity = await getActivity(task.activityId);
          const location = await getTaskLocation(task);
          const responsibleName = await getUserName(task.responsiblePerson);
          
          const scopeIds = task.scopeIds || [];
          const scopeNames = task.scopeNames || [];
          
          const scopeDetails = scopeIds.map((sid, idx) => {
            const progress = task.spaceProgress?.[sid] || {};
            return {
              id: sid,
              name: scopeNames[idx] || sid,
              approved: progress.approved || 0,
              submitted: progress.submitted || 0,
              rejected: progress.rejected || false,
              rejectionReason: progress.rejectionReason || '',
              notes: progress.notes || '',
            };
          });
          
          return { ...task, activity, location, responsibleName, scopeDetails };
        })
      );
      
      setTasks(enrichedTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadTasks();
    }
  }, [user]);

  const toggleTaskExpanded = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const getTaskStatusBadge = (status) => {
    const map = {
      'pending': { label: 'Pending', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      'in_progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      'submitted': { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'approved': { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };
    return map[status] || map['pending'];
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          View and update progress on your assigned tasks
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Users size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No tasks assigned to you yet</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isExpanded = expandedTasks[task.taskId];
            const scopeDetails = task.scopeDetails || [];
            const scopeTypeLabel = task.scopeType === 'building' ? 'levels' : task.scopeType === 'level' ? 'wings' : 'spaces';
            
            return (
              <Card key={task.taskId} className="overflow-hidden">
                <div 
                  className="flex flex-col gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors p-4"
                  onClick={() => toggleTaskExpanded(task.taskId)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {task.activity?.name || task.activityName || 'Unknown Activity'}
                      </h3>
                      <Badge className={getTaskStatusBadge(task.status).color}>
                        {getTaskStatusBadge(task.status).label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {scopeDetails.filter(s => s.submitted > 0).length} / {scopeDetails.length} {scopeTypeLabel}
                      </span>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span>Responsible: {task.responsibleName || 'Not assigned'}</span>
                    <span className="mx-2">•</span>
                    <span>Scope: {task.scopeType}</span>
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
                    <div className="flex-1 max-w-[200px]">
                      <ProgressBar value={task.approvedProgress || 0} showLabel={false} />
                    </div>
                    <span className="text-sm font-medium">
                      {task.approvedProgress || 0}% Approved
                    </span>
                    {task.submittedProgress > 0 && task.submittedProgress !== task.approvedProgress && (
                      <span className="text-sm text-yellow-500">
                        ({task.submittedProgress}% submitted)
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    📅 Assigned: {new Date(task.createdAt).toLocaleString()}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {scopeDetails.length === 0 ? (
                        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No items in this task</p>
                      ) : (
                        scopeDetails.map((item) => {
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-2 rounded-lg border ${
                                item.rejected ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10' :
                                item.submitted > 0 ? 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10' :
                                item.approved > 0 ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10' :
                                'border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                                {item.rejected && (
                                  <p className="text-xs text-red-600 dark:text-red-400">⚠️ Rejected: {item.rejectionReason || 'No reason'}</p>
                                )}
                                {item.notes && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500">{item.notes}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {item.approved > 0 && (
                                  <span className="text-xs text-green-600 dark:text-green-400">✅ {item.approved}%</span>
                                )}
                                {item.submitted > 0 && item.approved !== item.submitted && (
                                  <span className="text-xs text-yellow-600 dark:text-yellow-400">📤 {item.submitted}%</span>
                                )}
                                {!item.approved && !item.submitted && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500">⏳ 0%</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tasks/${task.taskId}`);
                        }}
                        icon={<Eye size={14} />}
                      >
                        View Full Details
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyTasks;