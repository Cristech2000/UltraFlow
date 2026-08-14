import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Building2, Home, Layers, ChevronRight, CheckCircle, 
  XCircle, Clock, Send, Edit2, Save, AlertTriangle, AlertCircle, X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
  getTask, updateTaskSpaceProgress, updateTaskOverallProgress,
  bulkUpdateTaskSpaces, submitTaskForApproval, getTaskLocation 
} from '../services/taskService';
import { getActivity } from '../services/activityService';
import { getSpace, getFloor, getWing } from '../services/spaceService';
import { getUserProfile } from '../services/userService';
// 🔥 NEW IMPORT HERE
import { reportIssueFromTask } from '../services/issueService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
import Input from '../components/common/Input';

function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [task, setTask] = useState(null);
  const [activity, setActivity] = useState(null);
  const [location, setLocation] = useState(null);
  const [scopeDetails, setScopeDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updating, setUpdating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [itemProgress, setItemProgress] = useState({});
  const [itemNotes, setItemNotes] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [responsibleName, setResponsibleName] = useState('');
  
  const [overallProgressInput, setOverallProgressInput] = useState('');
  const [overallNotesInput, setOverallNotesInput] = useState('');

  // 🔥 NEW ISSUE MODAL STATE
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({ title: '', details: '' });
  const [submittingIssue, setSubmittingIssue] = useState(false);

  const isResponsible = task?.responsiblePerson === user?.uid;
  const canApprove = ['director', 'supervisor', 'foreman'].includes(userRole);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const taskData = await getTask(taskId);
      if (!taskData) {
        setError('Task not found');
        setLoading(false);
        return;
      }
      setTask(taskData);

      if (taskData.isOverallProgress) {
        setOverallProgressInput(taskData.submittedProgress || 0);
        setOverallNotesInput(taskData.overallNotes || '');
      }

      if (taskData.responsiblePerson) {
        try {
          const profile = await getUserProfile(taskData.responsiblePerson);
          setResponsibleName(profile?.fullName || taskData.responsiblePerson);
        } catch {
          setResponsibleName(taskData.responsiblePerson);
        }
      }

      const activityData = await getActivity(taskData.activityId);
      setActivity(activityData);

      const locationData = await getTaskLocation(taskData);
      setLocation(locationData);

      const scopeIds = taskData.scopeIds || [];
      const scopeNames = taskData.scopeNames || [];
      const details = [];
      const prog = {};
      
      for (let i = 0; i < scopeIds.length; i++) {
        const sid = scopeIds[i];
        let sName = scopeNames[i];

        if (!sName || sName === sid) {
          if (taskData.scopeType === 'building') {
            const floor = await getFloor(sid);
            sName = floor?.name || sid;
          } else if (taskData.scopeType === 'level') {
            const wing = await getWing(sid);
            sName = wing?.name || sid;
          } else {
            const space = await getSpace(sid);
            sName = space?.name || sid;
          }
        }

        const sp = taskData.spaceProgress?.[sid] || {};
        const progress = {
          approved: sp.approved || 0,
          submitted: sp.submitted || 0,
          notes: sp.notes || '',
          rejected: sp.rejected || false,
          rejectionReason: sp.rejectionReason || '',
        };
        details.push({ id: sid, name: sName, ...progress });
        prog[sid] = progress;
      }
      
      setScopeDetails(details);
      setItemProgress(prog);
      
    } catch (err) {
      console.error('Error loading task:', err);
      setError('Failed to load task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) loadData();
  }, [taskId]);

  // 🔥 NEW SUBMIT ISSUE LOGIC
  const handleReportIssue = async () => {
    if (!issueForm.title || !issueForm.details) return alert("Title and details are required.");
    setSubmittingIssue(true);
    try {
      const taskLocation = {
        projectId: task.projectId,
        buildingId: task.buildingId,
        floorId: task.floorId,
        wingId: task.wingId,
        description: `${location?.buildingName || ''} > ${location?.floorName || ''} > ${location?.wingName || ''}`
      };
      
      await reportIssueFromTask(taskId, taskLocation, issueForm, user.uid);
      setSuccess('✅ Issue logged and sent for Supervisor review.');
      setShowIssueModal(false);
      setIssueForm({ title: '', details: '' });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to report issue.');
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleUpdateOverallProgress = async () => {
    if (task.status === 'submitted' || task.status === 'approved') return setError('Cannot update progress on a submitted or approved task');
    const progress = parseInt(overallProgressInput);
    if (isNaN(progress) || progress < 0 || progress > 100) return setError('Please enter a valid progress between 0 and 100');

    setUpdating(true);
    try {
      await updateTaskOverallProgress(taskId, progress, user?.uid, overallNotesInput);
      setSuccess('✅ Overall progress updated successfully!');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update overall progress');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateItemProgress = async (itemId, progress, notes = '') => {
    if (task.status === 'submitted' || task.status === 'approved') return setError('Cannot update progress on a submitted or approved task');
    setUpdating(true);
    try {
      await updateTaskSpaceProgress(taskId, itemId, progress, user?.uid, notes);
      setSuccess('✅ Progress updated successfully!');
      await loadData();
      setEditingItem(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (task.status === 'submitted' || task.status === 'approved') return setError('Cannot update progress on a submitted or approved task');
    const progress = parseInt(bulkProgress);
    if (isNaN(progress) || progress < 0 || progress > 100) return setError('Please enter a valid progress between 0 and 100');
    setUpdating(true);
    try {
      await bulkUpdateTaskSpaces(taskId, progress, user?.uid, `Bulk update: ${progress}%`);
      setSuccess(`✅ All items updated to ${progress}%!`);
      setBulkProgress('');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update items');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!task.isOverallProgress) {
      let hasProgress = false;
      for (const sid of Object.keys(itemProgress)) {
        if (itemProgress[sid].submitted > 0) { hasProgress = true; break; }
      }
      if (!hasProgress) return setError('Cannot submit task with no progress. Please update at least one item.');
    }
    
    setSubmitting(true);
    try {
      await submitTaskForApproval(taskId, user?.uid);
      setSuccess('✅ Task submitted for approval!');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'pending': { label: 'Pending', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      'in_progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      'submitted': { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'approved': { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };
    const info = map[status] || map['pending'];
    return (
      <span className={`text-xs px-3 py-1 rounded-full font-medium ${info.color}`}>
        {info.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{error || 'Task not found'}</p>
          <Button variant="primary" className="mt-4" onClick={() => navigate('/my-tasks')}>
            Back to My Tasks
          </Button>
        </div>
      </div>
    );
  }

  const scopeIds = task.scopeIds || [];
  let totalApproved = 0;
  let totalSubmitted = 0;
  let count = 0;
  
  if (task.isOverallProgress) {
    totalApproved = task.approvedProgress || 0;
    totalSubmitted = task.submittedProgress || 0;
  } else {
    for (const sid of scopeIds) {
      if (itemProgress[sid]) {
        totalApproved += itemProgress[sid].approved || 0;
        totalSubmitted += itemProgress[sid].submitted || 0;
        count++;
      }
    }
  }

  const overallApproved = task.isOverallProgress ? totalApproved : (count > 0 ? Math.round(totalApproved / count) : 0);
  const overallSubmitted = task.isOverallProgress ? totalSubmitted : (count > 0 ? Math.round(totalSubmitted / count) : 0);
  const scopeTypeLabel = task.scopeType === 'building' ? 'Levels' : task.scopeType === 'level' ? 'Wings' : 'Spaces';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/my-tasks" className="hover:text-primary-500 transition-colors">My Tasks</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">{activity?.name || 'Task'}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {activity?.name || 'Unknown Activity'}
            </h1>
            {getStatusBadge(task.status)}
          </div>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>Responsible: {responsibleName || task.responsiblePerson || 'Not assigned'}</span>
            <span className="mx-2">•</span>
            <span>Scope: {task.scopeType}</span>
          </div>
          {location && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {location.projectName && (
                <span className="flex items-center gap-1">
                  <Building2 size={14} />
                  {location.projectName}
                </span>
              )}
              {location.buildingName && <span>• {location.buildingName}</span>}
              {location.floorName && <span>• {location.floorName}</span>}
              {location.wingName && <span>• {location.wingName}</span>}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate('/my-tasks')} icon={<ArrowLeft size={16} />}>Back</Button>
          
          {/* 🔥 NEW REPORT ISSUE BUTTON */}
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" icon={<AlertCircle size={16} />} onClick={() => setShowIssueModal(true)}>
            Report Issue
          </Button>

          {isResponsible && task.status !== 'submitted' && task.status !== 'approved' && (
            <Button variant="primary" icon={<Send size={16} />} onClick={handleSubmitForApproval} loading={submitting}>
              Submit for Approval
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">Approved Progress</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{overallApproved}%</p>
          <ProgressBar value={overallApproved} />
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">Submitted Progress</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{overallSubmitted}%</p>
          <ProgressBar value={overallSubmitted} />
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">{scopeTypeLabel}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {task.isOverallProgress ? 'Building Wide' : scopeDetails.length}
          </p>
        </Card>
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

      {/* Bulk Update */}
      {!task.isOverallProgress && isResponsible && task.status !== 'submitted' && task.status !== 'approved' && (
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Bulk Update All {scopeTypeLabel}
              </label>
              <div className="flex gap-3">
                <input
                  type="number" min="0" max="100" value={bulkProgress} onChange={(e) => setBulkProgress(e.target.value)}
                  placeholder="Enter progress (0-100)"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button variant="primary" onClick={handleBulkUpdate} loading={updating}>Update All</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">{scopeTypeLabel}</h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {scopeDetails.filter(s => s.submitted > 0).length} / {scopeDetails.length} updated
          </span>
        </div>

        {scopeDetails.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No items in scope</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {scopeDetails.map((item) => {
              const isEditing = editingItem === item.id;
              const isRejected = item.rejected;
              
              return (
                <div key={item.id} className={`p-3 rounded-lg border ${
                    isRejected ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' :
                    item.submitted > 0 ? 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10' :
                    item.approved > 0 ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10' :
                    'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                      {isRejected && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ Rejected: {item.rejectionReason || 'No reason provided'}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {item.approved > 0 && <span className="text-xs text-green-600 dark:text-green-400">✅ {item.approved}%</span>}
                      {item.submitted > 0 && item.approved !== item.submitted && <span className="text-xs text-yellow-600 dark:text-yellow-400">📤 {item.submitted}%</span>}
                      {!isEditing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-20">
                            <ProgressBar value={item.approved || item.submitted || 0} showLabel={false} />
                          </div>
                          <span className="text-sm font-medium min-w-[40px]">{item.approved || item.submitted || 0}%</span>
                          {isResponsible && task.status !== 'submitted' && task.status !== 'approved' && !isRejected && (
                            <button
                              onClick={() => { setEditingItem(item.id); setItemNotes({ [item.id]: item.notes || '' }); }}
                              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <Edit2 size={14} className="text-gray-400 hover:text-primary-500" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                          <input
                            type="number" min="0" max="100" value={itemProgress[item.id]?.submitted || 0}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                              setItemProgress(prev => ({...prev, [item.id]: { ...prev[item.id], submitted: val }}));
                            }}
                            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-center text-sm"
                          />
                          <input
                            type="text" placeholder="Notes" value={itemNotes[item.id] || ''}
                            onChange={(e) => setItemNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="flex-1 min-w-[150px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                          />
                          <Button size="sm" variant="primary" onClick={() => handleUpdateItemProgress(item.id, itemProgress[item.id]?.submitted || 0, itemNotes[item.id] || '')} loading={updating}>
                            <Save size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>Cancel</Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {item.notes && !isEditing && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{item.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 🔥 NEW ISSUE MODAL */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><AlertCircle className="text-red-500"/> Report Task Issue</h2>
              <button onClick={() => setShowIssueModal(false)}><X size={20}/></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">This will alert your supervisor and halt task approval until resolved.</p>
            <div className="space-y-4">
              <Input label="Issue Title" value={issueForm.title} onChange={e => setIssueForm({...issueForm, title: e.target.value})} />
              <div>
                <label className="block text-sm font-medium mb-1">Details & Roadblocks</label>
                <textarea rows="4" value={issueForm.details} onChange={e => setIssueForm({...issueForm, details: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              </div>
              <Button variant="danger" className="w-full" onClick={handleReportIssue} loading={submittingIssue}>Submit Issue</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskDetail;