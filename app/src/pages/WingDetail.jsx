import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Layers,
  Plus,
  ChevronRight,
  Building2,
  Home,
  TrendingUp,
  Grid,
  Trash2,
  AlertTriangle,
  X,
  FileText,
  CheckCircle,
  Clock,
  PlayCircle,
  PauseCircle,
  XCircle,
  Edit2,
  Copy
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
// Notice we imported deleteSpace here!
import { getWing, getSpacesByWing, deleteWing, createSpace, bulkCloneSpace, SPACE_TYPES, deleteSpace } from '../services/spaceService';
import { getActivitiesByScope, ACTIVITY_SCOPES, createActivity, updateActivityProgress, updateActivityStatus, deleteActivity } from '../services/activityService';
import { getFloor, getBuilding } from '../services/spaceService';
import { getProject } from '../services/projectService';
import { calculateWingProgress, calculateSpaceProgress } from '../utils/progressUtils';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
import Input from '../components/common/Input';
import { STATUS_DISPLAY_NAMES, getStatusColor } from '../constants/status';
import ProjectGuard from '../components/common/ProjectGuard';

function WingDetail() {
  const { projectId, buildingId, floorId, wingId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [wing, setWing] = useState(null);
  const [building, setBuilding] = useState(null);
  const [floor, setFloor] = useState(null);
  const [project, setProject] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Wing Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Space Delete State
  const [spaceToDelete, setSpaceToDelete] = useState(null);
  const [isDeletingSpace, setIsDeletingSpace] = useState(false);

  const [editingActivity, setEditingActivity] = useState(null);
  
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  const [spaceForm, setSpaceForm] = useState({ name: '', code: '', type: 'Other', description: '', status: 'active' });
  const [submittingSpace, setSubmittingSpace] = useState(false);
  const [spaceFormError, setSpaceFormError] = useState('');

  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ name: '', code: '', description: '' });
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [activityFormError, setActivityFormError] = useState('');

  // Smart Clone State
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloningSpace, setCloningSpace] = useState(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneConfig, setCloneConfig] = useState({
    count: 1,
    prefix: '',
    startNumber: 1
  });

  const canEdit = ['director', 'engineer', 'supervisor'].includes(userRole);
  const canDelete = ['director'].includes(userRole);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const wingData = await getWing(wingId);
      if (!wingData) {
        setError('Wing not found');
        setLoading(false);
        return;
      }
      setWing(wingData);

      const floorData = await getFloor(floorId);
      if (floorData) setFloor(floorData);

      const buildingData = await getBuilding(buildingId);
      if (buildingData) setBuilding(buildingData);

      const projectData = await getProject(projectId);
      if (projectData) setProject(projectData);

      const spacesData = await getSpacesByWing(wingId);
      
      const spacesWithProgress = await Promise.all(
        spacesData.map(async (space) => {
          const spaceActs = await getActivitiesByScope(projectId, ACTIVITY_SCOPES.SPACE, space.spaceId);
          const spaceProgress = calculateSpaceProgress(spaceActs);
          return { ...space, progress: spaceProgress };
        })
      );
      setSpaces(spacesWithProgress);

      const activitiesData = await getActivitiesByScope(
        projectId,
        ACTIVITY_SCOPES.WING,
        wingId
      );
      setActivities(activitiesData);
      
    } catch (err) {
      console.error('Error loading wing:', err);
      setError('Failed to load wing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (wingId) {
      loadData();
    }
  }, [wingId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteWing(wingId);
      navigate(`/projects/${projectId}/buildings/${buildingId}/floors/${floorId}`);
    } catch (err) {
      setError('Failed to delete wing');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // 🔥 NEW: Space Deletion Logic
  const handleDeleteSpace = async () => {
    if (!spaceToDelete) return;
    setIsDeletingSpace(true);
    try {
      await deleteSpace(spaceToDelete.spaceId);
      setSpaceToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting space:', err);
      alert('Failed to delete space');
    } finally {
      setIsDeletingSpace(false);
    }
  };

  const handleCreateSpace = async () => {
    if (!spaceForm.name.trim()) {
      setSpaceFormError('Space name is required');
      return;
    }
    setSubmittingSpace(true);
    setSpaceFormError('');
    try {
      await createSpace(spaceForm, wingId, floorId, buildingId, projectId, user?.uid);
      setShowSpaceForm(false);
      setSpaceForm({ name: '', code: '', type: 'Other', description: '', status: 'active' });
      await loadData();
    } catch (err) {
      setSpaceFormError(err.message || 'Failed to create space');
    } finally {
      setSubmittingSpace(false);
    }
  };

  const openCloneModal = (space) => {
    setCloningSpace(space);
    
    const match = space.name.match(/^(.*?)(\d+)$/);
    let defaultPrefix = space.name + ' ';
    let defaultStart = 1;
    
    if (match) {
      defaultPrefix = match[1];
      defaultStart = parseInt(match[2], 10) + 1;
    }

    setCloneConfig({
      count: 1,
      prefix: defaultPrefix,
      startNumber: defaultStart
    });
    setShowCloneModal(true);
  };

  const handleCloneSpace = async () => {
    if (cloneConfig.count < 1 || cloneConfig.count > 100) {
      setSpaceFormError('Please enter a number of copies between 1 and 100');
      return;
    }
    if (cloneConfig.startNumber < 0) {
      setSpaceFormError('Starting number cannot be negative');
      return;
    }
    
    setIsCloning(true);
    setSpaceFormError('');
    try {
      await bulkCloneSpace(cloningSpace.spaceId, cloneConfig, user?.uid);
      setShowCloneModal(false);
      setCloningSpace(null);
      await loadData();
    } catch (err) {
      setSpaceFormError(err.message || 'Failed to clone space');
    } finally {
      setIsCloning(false);
    }
  };

  const handleCreateActivity = async () => {
    if (!activityForm.name.trim()) {
      setActivityFormError('Activity name is required');
      return;
    }
    setSubmittingActivity(true);
    setActivityFormError('');
    try {
      await createActivity({
        projectId: projectId,
        buildingId: buildingId,
        floorId: floorId,
        wingId: wingId,
        spaceId: null,
        scope: ACTIVITY_SCOPES.WING,
        name: activityForm.name,
        code: activityForm.code || '',
        description: activityForm.description || '',
        order: activities.length + 1,
        status: 'not_started',
        progress: 0,
      }, user?.uid);
      setShowActivityForm(false);
      setActivityForm({ name: '', code: '', description: '' });
      await loadData();
    } catch (err) {
      setActivityFormError(err.message || 'Failed to create activity');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleUpdateProgress = async (activityId, progress) => {
    try {
      await updateActivityProgress(activityId, progress, user?.uid);
      await loadData();
      setEditingActivity(null);
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to update progress');
    }
  };

  const handleUpdateStatus = async (activityId, status) => {
    try {
      await updateActivityStatus(activityId, status, user?.uid);
      await loadData();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      await deleteActivity(activityId);
      await loadData();
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError('Failed to delete activity');
    }
  };

  const wingProgress = calculateWingProgress(spaces, activities);

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    const label = STATUS_DISPLAY_NAMES[status] || status;
    return (
      <span className={`text-xs px-3 py-1 rounded-full font-medium ${color}`}>
        {label}
      </span>
    );
  };

  const getActivityStatusDisplay = (status) => {
    const map = {
      'not_started': 'Not Started',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'on_hold': 'On Hold',
      'blocked': 'Blocked',
    };
    return map[status] || status;
  };

  const getActivityStatusColor = (status) => {
    const map = {
      'not_started': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      'in_progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'on_hold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'blocked': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return map[status] || map['not_started'];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'in_progress': return <PlayCircle size={16} className="text-blue-500" />;
      case 'on_hold': return <PauseCircle size={16} className="text-yellow-500" />;
      case 'blocked': return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading wing...</p>
        </div>
      </div>
    );
  }

  if (error || !wing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Layers size={48} className="text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{error || 'Wing not found'}</p>
          <Button variant="primary" className="mt-4" onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}/floors/${floorId}`)}>
            Back to Level
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProjectGuard projectId={projectId}>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 overflow-x-auto whitespace-nowrap pb-2">
          <Link to="/projects" className="hover:text-primary-500 transition-colors">Projects</Link>
          <ChevronRight size={14} className="flex-shrink-0" />
          <Link to={`/projects/${projectId}`} className="hover:text-primary-500 transition-colors">
            {project?.name || 'Project'}
          </Link>
          <ChevronRight size={14} className="flex-shrink-0" />
          <Link to={`/projects/${projectId}/buildings/${buildingId}`} className="hover:text-primary-500 transition-colors">
            {building?.name || 'Building'}
          </Link>
          <ChevronRight size={14} className="flex-shrink-0" />
          <Link to={`/projects/${projectId}/buildings/${buildingId}/floors/${floorId}`} className="hover:text-primary-500 transition-colors">
            {floor?.name || 'Level'}
          </Link>
          <ChevronRight size={14} className="flex-shrink-0" />
          <span className="text-gray-900 dark:text-white font-medium">{wing.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Layers size={28} className="text-primary-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{wing.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {building?.name || 'Building'} • {floor?.name || 'Level'} • {project?.name || 'Project'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              {getStatusBadge(wing.status)}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {spaces.length} {spaces.length === 1 ? 'Space' : 'Spaces'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {activities.length} Wing Activities
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}/floors/${floorId}`)} icon={<ArrowLeft size={16} />}>Back</Button>
            {canEdit && (
              <Button variant="accent" size="sm" icon={<FileText size={16} />} onClick={() => setShowActivityForm(true)}>
                Add Activity
              </Button>
            )}
            {canDelete && (
              <Button variant="danger" size="sm" icon={<Trash2 size={16} />} onClick={() => setShowDeleteModal(true)}>
                Delete
              </Button>
            )}
          </div>
        </div>

        {wing.description && (
          <Card>
            <p className="text-gray-600 dark:text-gray-300">{wing.description}</p>
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Wing Progress</h3>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                (Cumulative from {spaces.length} spaces + {activities.length} wing activities)
              </span>
            </div>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {wingProgress}%
            </span>
          </div>
          <ProgressBar value={wingProgress} />
        </Card>

        {activities.length > 0 && (
          <Card title="Wing-Wide Activities" subtitle="Activities that apply to the entire wing">
            <div className="space-y-2">
              {activities.map((activity) => (
                <ActivityItem
                  key={activity.activityId}
                  activity={activity}
                  isEditing={editingActivity === activity.activityId}
                  onEdit={() => setEditingActivity(activity.activityId)}
                  onCancelEdit={() => setEditingActivity(null)}
                  onUpdateProgress={(progress) => handleUpdateProgress(activity.activityId, progress)}
                  onUpdateStatus={(status) => handleUpdateStatus(activity.activityId, status)}
                  onDelete={() => handleDeleteActivity(activity.activityId)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  getActivityStatusDisplay={getActivityStatusDisplay}
                  getActivityStatusColor={getActivityStatusColor}
                  getStatusIcon={getStatusIcon}
                />
              ))}
            </div>
          </Card>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Spaces</h2>
            {canEdit && (
              <Button variant="ghost" size="sm" icon={<Plus size={16} />} onClick={() => setShowSpaceForm(true)}>
                Add Space
              </Button>
            )}
          </div>

          {spaces.length === 0 ? (
            <Card>
              <div className="py-8 text-center">
                <Grid size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No spaces yet</p>
                {canEdit && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowSpaceForm(true)}>
                    Create the first template space
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {spaces.map((space) => (
                <motion.div key={space.spaceId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow p-3 relative group" onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}/floors/${floorId}/wings/${wingId}/spaces/${space.spaceId}`)}>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm pr-6">{space.name}</h4>
                      {space.code && <p className="text-xs text-gray-400 dark:text-gray-500">{space.code}</p>}
                      {space.type && space.type !== 'Other' && <p className="text-xs text-gray-400 dark:text-gray-500">{space.type}</p>}
                      <div className="mt-1">{getStatusBadge(space.status)}</div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Progress</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{space.progress || 0}%</span>
                        </div>
                        <ProgressBar value={space.progress || 0} showLabel={false} />
                      </div>
                    </div>
                    
                    {/* Hover Smart Clone & Delete Buttons */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-all">
                      {canEdit && (
                        <button
                          className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow shadow-black/10 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-500 transition-colors"
                          onClick={(e) => { e.stopPropagation(); openCloneModal(space); }}
                          title="Smart Clone Space"
                        >
                          <Copy size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow shadow-black/10 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                          onClick={(e) => { e.stopPropagation(); setSpaceToDelete(space); }}
                          title="Delete Space"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Space Modal */}
        {spaceToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} className="text-red-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Space</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete <span className="font-semibold">{spaceToDelete.name}</span>?
                This will permanently remove all activities attached to it.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setSpaceToDelete(null)}>Cancel</Button>
                <Button variant="danger" onClick={handleDeleteSpace} loading={isDeletingSpace}>Delete</Button>
              </div>
            </div>
          </div>
        )}

        {/* Smart Clone Space Modal */}
        {showCloneModal && cloningSpace && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Smart Clone Space</h2>
                <button onClick={() => { setShowCloneModal(false); setSpaceFormError(''); }}>
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                {spaceFormError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                    {spaceFormError}
                  </div>
                )}
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Template: <strong>{cloningSpace.name}</strong><br/>
                    <span className="text-xs opacity-80">All activities assigned to this template will be perfectly copied.</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Prefix (e.g., Room)</label>
                    <input
                      type="text"
                      value={cloneConfig.prefix}
                      onChange={(e) => setCloneConfig({ ...cloneConfig, prefix: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Starting Number</label>
                    <input
                      type="number"
                      value={cloneConfig.startNumber}
                      onChange={(e) => setCloneConfig({ ...cloneConfig, startNumber: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">How many spaces to generate?</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={cloneConfig.count}
                    onChange={(e) => setCloneConfig({ ...cloneConfig, count: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Live Preview */}
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-900 dark:text-white">Preview: </span>
                  {cloneConfig.prefix}{cloneConfig.startNumber}
                  {cloneConfig.count > 1 && (
                    <span> ... to {cloneConfig.prefix}{cloneConfig.startNumber + cloneConfig.count - 1}</span>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" onClick={() => { setShowCloneModal(false); setSpaceFormError(''); }}>Cancel</Button>
                  <Button variant="primary" onClick={handleCloneSpace} loading={isCloning} icon={<Copy size={16} />}>Generate Spaces</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSpaceForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Space</h2>
                <button onClick={() => { setShowSpaceForm(false); setSpaceFormError(''); }}>
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                {spaceFormError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                    {spaceFormError}
                  </div>
                )}
                <Input label="Space Name" placeholder="e.g., Room A301" value={spaceForm.name} onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })} required />
                <Input label="Space Code" placeholder="e.g., S-A301" value={spaceForm.code} onChange={(e) => setSpaceForm({ ...spaceForm, code: e.target.value })} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Space Type</label>
                  <select value={spaceForm.type} onChange={(e) => setSpaceForm({ ...spaceForm, type: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {SPACE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <Input label="Description" placeholder="Brief description" value={spaceForm.description} onChange={(e) => setSpaceForm({ ...spaceForm, description: e.target.value })} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                  <select value={spaceForm.status} onChange={(e) => setSpaceForm({ ...spaceForm, status: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <option value="active">Active</option>
                    <option value="planned">Planned</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" onClick={() => { setShowSpaceForm(false); setSpaceFormError(''); }}>Cancel</Button>
                  <Button variant="primary" onClick={handleCreateSpace} loading={submittingSpace}>Create</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showActivityForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Wing-Wide Activity</h2>
                <button onClick={() => { setShowActivityForm(false); setActivityFormError(''); }}>
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                {activityFormError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                    {activityFormError}
                  </div>
                )}
                <Input label="Activity Name" placeholder="e.g., Corridor Wiring" value={activityForm.name} onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })} required />
                <Input label="Activity Code" placeholder="e.g., WNG-001" value={activityForm.code} onChange={(e) => setActivityForm({ ...activityForm, code: e.target.value })} />
                <Input label="Description" placeholder="Brief description" value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} />
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" onClick={() => { setShowActivityForm(false); setActivityFormError(''); }}>Cancel</Button>
                  <Button variant="primary" onClick={handleCreateActivity} loading={submittingActivity}>Create</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} className="text-red-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Wing</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete <span className="font-semibold">{wing.name}</span>?
                This will permanently remove all spaces and activities.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProjectGuard>
  );
}

function ActivityItem({ 
  activity, 
  isEditing, 
  onEdit, 
  onCancelEdit, 
  onUpdateProgress, 
  onUpdateStatus, 
  onDelete, 
  canEdit, 
  canDelete,
  getActivityStatusDisplay,
  getActivityStatusColor,
  getStatusIcon
}) {
  const [progress, setProgress] = useState(activity.progress || 0);
  const statusDisplay = getActivityStatusDisplay(activity.status);
  const statusColor = getActivityStatusColor(activity.status);

  const handleSaveProgress = () => {
    if (progress < 0 || progress > 100) {
      alert('Progress must be between 0 and 100');
      return;
    }
    onUpdateProgress(progress);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {activity.order ? `${activity.order}.` : ''} {activity.name}
            </span>
            {activity.code && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{activity.code}</span>
            )}
            <Badge size="sm" className={statusColor}>
              <span className="flex items-center gap-1">
                {getStatusIcon(activity.status)}
                {statusDisplay}
              </span>
            </Badge>
          </div>
          {activity.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.description}</p>
          )}
          {activity.actualStartDate && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Started: {new Date(activity.actualStartDate).toLocaleDateString()}
            </p>
          )}
          {activity.actualCompletionDate && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Completed: {new Date(activity.actualCompletionDate).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => setProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-center text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-500">%</span>
              <Button size="sm" variant="primary" onClick={handleSaveProgress}>Save</Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 min-w-[120px]">
              <div className="w-20">
                <ProgressBar value={activity.progress || 0} showLabel={false} />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[40px]">
                {activity.progress || 0}%
              </span>
              {canEdit && (
                <button onClick={onEdit} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Update Progress">
                  <Edit2 size={14} className="text-gray-400 hover:text-primary-500" />
                </button>
              )}
              {canDelete && (
                <button onClick={onDelete} className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="Delete Activity">
                  <XCircle size={14} className="text-gray-400 hover:text-red-500" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default WingDetail;