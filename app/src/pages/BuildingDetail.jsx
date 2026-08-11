import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Layers,
  Plus,
  ChevronRight,
  Home,
  TrendingUp,
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
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getBuilding, getFloorsByBuilding, deleteBuilding, createFloor, getWingsByFloor, getSpacesByWing } from '../services/spaceService';
import { getActivitiesByScope, ACTIVITY_SCOPES, createActivity, updateActivityProgress, updateActivityStatus, deleteActivity } from '../services/activityService';
import { getProject } from '../services/projectService';
import { calculateBuildingProgress, calculateWingProgress, calculateLevelProgress, calculateSpaceProgress } from '../utils/progressUtils';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
import Input from '../components/common/Input';
import { STATUS_DISPLAY_NAMES, getStatusColor } from '../constants/status';

function BuildingDetail() {
  const { projectId, buildingId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [building, setBuilding] = useState(null);
  const [project, setProject] = useState(null);
  const [floors, setFloors] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  
  const [showFloorForm, setShowFloorForm] = useState(false);
  const [floorForm, setFloorForm] = useState({ name: '', levelNumber: 0, code: '', status: 'active' });
  const [submittingFloor, setSubmittingFloor] = useState(false);
  const [floorFormError, setFloorFormError] = useState('');

  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ name: '', code: '', description: '' });
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [activityFormError, setActivityFormError] = useState('');

  const canEdit = ['director', 'engineer', 'supervisor'].includes(userRole);
  const canDelete = ['director'].includes(userRole);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const buildingData = await getBuilding(buildingId);
      if (!buildingData) {
        setError('Building not found');
        setLoading(false);
        return;
      }
      setBuilding(buildingData);

      const projectData = await getProject(projectId);
      if (projectData) setProject(projectData);

      // Get all floors
      const floorsData = await getFloorsByBuilding(buildingId);
      
      // For each floor, calculate its progress
      const floorsWithProgress = await Promise.all(
        floorsData.map(async (floor) => {
          // Get wings for this floor
          const wings = await getWingsByFloor(floor.floorId);
          
          // Calculate progress for each wing
          const wingsWithProgress = await Promise.all(
            wings.map(async (wing) => {
              // Get spaces in wing
              const spaces = await getSpacesByWing(wing.wingId);
              
              // Calculate each space's progress from its activities
              const spacesWithProgress = await Promise.all(
                spaces.map(async (space) => {
                  const spaceActs = await getActivitiesByScope(projectId, ACTIVITY_SCOPES.SPACE, space.spaceId);
                  const spaceProgress = calculateSpaceProgress(spaceActs);
                  return { ...space, progress: spaceProgress };
                })
              );
              
              // Get wing activities
              const wingActs = await getActivitiesByScope(projectId, ACTIVITY_SCOPES.WING, wing.wingId);
              
              // Calculate wing progress
              const wingProgress = calculateWingProgress(spacesWithProgress, wingActs);
              
              return { 
                ...wing, 
                progress: wingProgress,
                spaces: spacesWithProgress,
                wingActivities: wingActs
              };
            })
          );
          
          // Get floor activities
          const floorActs = await getActivitiesByScope(projectId, ACTIVITY_SCOPES.LEVEL, floor.floorId);
          
          // Calculate floor progress
          const floorProgress = calculateLevelProgress(wingsWithProgress, floorActs);
          
          return { 
            ...floor, 
            progress: floorProgress,
            wings: wingsWithProgress,
            floorActivities: floorActs
          };
        })
      );
      
      setFloors(floorsWithProgress);

      // Get building-wide activities
      const activitiesData = await getActivitiesByScope(
        projectId,
        ACTIVITY_SCOPES.BUILDING,
        buildingId
      );
      setActivities(activitiesData);
      
    } catch (err) {
      console.error('Error loading building:', err);
      setError('Failed to load building. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (buildingId) {
      loadData();
    }
  }, [buildingId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBuilding(buildingId);
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setError('Failed to delete building');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleCreateFloor = async () => {
    if (!floorForm.name.trim()) {
      setFloorFormError('Level name is required');
      return;
    }
    setSubmittingFloor(true);
    setFloorFormError('');
    try {
      await createFloor(floorForm, buildingId, projectId, user?.uid);
      setShowFloorForm(false);
      setFloorForm({ name: '', levelNumber: 0, code: '', status: 'active' });
      await loadData();
    } catch (err) {
      setFloorFormError(err.message || 'Failed to create level');
    } finally {
      setSubmittingFloor(false);
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
        floorId: null,
        wingId: null,
        spaceId: null,
        scope: ACTIVITY_SCOPES.BUILDING,
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
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      await deleteActivity(activityId);
      await loadData();
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError('Failed to delete activity');
    }
  };

  const buildingProgress = calculateBuildingProgress(floors, activities);

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
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading building...</p>
        </div>
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Building2 size={48} className="text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{error || 'Building not found'}</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            Back to Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/projects" className="hover:text-primary-500 transition-colors">Projects</Link>
        <ChevronRight size={14} />
        <Link to={`/projects/${projectId}`} className="hover:text-primary-500 transition-colors">
          {project?.name || 'Project'}
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">{building.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Building2 size={28} className="text-primary-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {building.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {project?.name || 'Project'} • {building.code || 'No code'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            {getStatusBadge(building.status)}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {floors.length} {floors.length === 1 ? 'Level' : 'Levels'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {activities.length} Building Activities
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)} icon={<ArrowLeft size={16} />}>Back</Button>
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

      {building.description && (
        <Card>
          <p className="text-gray-600 dark:text-gray-300">{building.description}</p>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Building Progress</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              (Cumulative from {floors.length} levels + {activities.length} building activities)
            </span>
          </div>
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {buildingProgress}%
          </span>
        </div>
        <ProgressBar value={buildingProgress} />
      </Card>

      {activities.length > 0 && (
        <Card title="Building-Wide Activities" subtitle="Activities that apply to the entire building">
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Levels</h2>
          {canEdit && (
            <Button variant="ghost" size="sm" icon={<Plus size={16} />} onClick={() => setShowFloorForm(true)}>
              Add Level
            </Button>
          )}
        </div>

        {floors.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <Home size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No levels yet</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {floors.map((floor) => (
              <motion.div
                key={floor.floorId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}/floors/${floor.floorId}`)}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{floor.name}</h3>
                        {floor.levelNumber > 0 && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">Level {floor.levelNumber}</p>
                        )}
                        {floor.code && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">{floor.code}</p>
                        )}
                      </div>
                      {getStatusBadge(floor.status)}
                    </div>
                    <div className="mt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{floor.progress || 0}%</span>
                      </div>
                      <ProgressBar value={floor.progress || 0} showLabel={false} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showFloorForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Level</h2>
              <button onClick={() => { setShowFloorForm(false); setFloorFormError(''); }}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {floorFormError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {floorFormError}
                </div>
              )}
              <Input label="Level Name" placeholder="e.g., Level 3" value={floorForm.name} onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })} required />
              <Input label="Level Number" type="number" placeholder="e.g., 3" value={floorForm.levelNumber} onChange={(e) => setFloorForm({ ...floorForm, levelNumber: parseInt(e.target.value) || 0 })} />
              <Input label="Level Code" placeholder="e.g., FL-03" value={floorForm.code} onChange={(e) => setFloorForm({ ...floorForm, code: e.target.value })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                <select value={floorForm.status} onChange={(e) => setFloorForm({ ...floorForm, status: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="active">Active</option>
                  <option value="planned">Planned</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" onClick={() => { setShowFloorForm(false); setFloorFormError(''); }}>Cancel</Button>
                <Button variant="primary" onClick={handleCreateFloor} loading={submittingFloor}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showActivityForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Building-Wide Activity</h2>
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
              <Input label="Activity Name" placeholder="e.g., Main Electrical Riser" value={activityForm.name} onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })} required />
              <Input label="Activity Code" placeholder="e.g., BLDG-001" value={activityForm.code} onChange={(e) => setActivityForm({ ...activityForm, code: e.target.value })} />
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Building</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <span className="font-semibold">{building.name}</span>?
              This will permanently remove all levels, wings, spaces, and activities.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
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

export default BuildingDetail;