import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTasksForUser, submitTaskProgress, getTaskLocation } from '../services/taskService';
import { getActivity } from '../services/activityService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
import { CheckCircle, Clock, XCircle, Send, Users, Building2, Home, Layers } from 'lucide-react';

function MyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [progressInput, setProgressInput] = useState(0);
  const [notes, setNotes] = useState('');

  const loadTasks = async () => {
    setLoading(true);
    try {
      const tasksData = await getTasksForUser(user?.uid);
      const enrichedTasks = await Promise.all(
        tasksData.map(async (task) => {
          const activity = await getActivity(task.activityId);
          const location = await getTaskLocation(task);
          return { ...task, activity, location };
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

  const handleSubmitProgress = async (taskId) => {
    if (progressInput < 0 || progressInput > 100) {
      setError('Progress must be between 0 and 100');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await submitTaskProgress(taskId, progressInput, user?.uid, notes);
      setSelectedTask(null);
      setProgressInput(0);
      setNotes('');
      await loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to submit progress');
    } finally {
      setSubmitting(false);
    }
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

  const getTaskStatusColor = (status) => {
    const map = {
      'pending': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      'in_progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'submitted': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'approved': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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
          {tasks.map((task) => (
            <Card key={task.taskId} className="overflow-hidden">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {task.activity?.name || 'Unknown Activity'}
                      </h3>
                      <Badge className={getTaskStatusColor(task.status)}>
                        {getTaskStatusBadge(task.status).label}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>Team: {task.teamName}</span>
                      <span>•</span>
                      <span>Scope: {task.scopeType}</span>
                      <span>•</span>
                      <span>{task.teamMembers?.length || 0} members</span>
                    </div>
                    
                    {/* LOCATION DISPLAY */}
                    {task.location && (
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
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
                    
                    <div className="mt-2 flex items-center gap-4">
                      <div className="w-32">
                        <ProgressBar value={task.approvedProgress || 0} showLabel={false} />
                      </div>
                      <span className="text-sm font-medium">
                        {task.approvedProgress || 0}% Approved
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                      <span>📅 Assigned: {new Date(task.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span>🔄 Updated: {new Date(task.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {task.status !== 'approved' && task.status !== 'submitted' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setSelectedTask(task.taskId);
                        setProgressInput(task.approvedProgress || 0);
                      }}
                    >
                      Update Progress
                    </Button>
                  )}

                  {task.status === 'submitted' && (
                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                      <Clock size={16} />
                      <span className="text-sm font-medium">Pending Approval</span>
                    </div>
                  )}

                  {task.status === 'approved' && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Approved</span>
                    </div>
                  )}

                  {task.status === 'rejected' && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <XCircle size={16} />
                      <span className="text-sm font-medium">Rejected</span>
                    </div>
                  )}
                </div>

                {/* Submit Progress Modal */}
                {selectedTask === task.taskId && (
                  <div className="mt-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Progress (%)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={progressInput}
                            onChange={(e) => setProgressInput(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notes (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Add notes about progress..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSubmitProgress(task.taskId)}
                        loading={submitting}
                      >
                        <Send size={14} className="mr-1" />
                        Submit for Approval
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTask(null);
                          setNotes('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTasks;