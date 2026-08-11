import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Home,
  Layers,
  ChevronRight,
  Plus,
  Edit2,
  CheckCircle,
  Clock,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Zap,
  FileText,
  TrendingUp,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getSpace, deleteSpace } from '../services/spaceService';
import { getBuilding, getFloor, getWing } from '../services/spaceService';
import {
  getActivitiesBySpace,
  createActivity,
  updateActivityProgress,
  updateActivityStatus,
  createActivitiesFromTemplate,
  deleteActivity,
} from '../services/activityService';
import { ACTIVITY_TEMPLATES, getTemplateNames } from '../constants/activityTemplates';
import { calculateSpaceProgress, getActivityStatusDisplay, getActivityStatusColor } from '../utils/progressUtils';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
import Input from '../components/common/Input';
import ProjectGuard from '../components/common/ProjectGuard';

function SpaceDetail() {
  const { spaceId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [space, setSpace] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [parentNames, setParentNames] = useState({
    projectName: '',
    buildingName: '',
    floorName: '',
    wingName: '',
    projectId: '',
    buildingId: '',
    floorId: '',
    wingId: '',
  });
  const [newActivity, setNewActivity] = useState({
    name: '',
    code: '',
    description: '',
    order: 0,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit = ['director', 'engineer', 'supervisor', 'foreman', 'documentation_assistant'].includes(userRole);
  const canCreateActivities = ['director', 'engineer', 'supervisor'].includes(userRole);
  const canDelete = ['director'].includes(userRole);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const spaceData = await getSpace(spaceId);
      if (!spaceData) {
        setError('Space not found');
        setLoading(false);
        return;
      }
      setSpace(spaceData);

      const parentData = {
        projectName: '',
        buildingName: '',
        floorName: '',
        wingName: '',
        projectId: spaceData.projectId || '',
        buildingId: spaceData.buildingId || '',
        floorId: spaceData.floorId || '',
        wingId: spaceData.wingId || '',
      };

      if (spaceData.buildingId) {
        const building = await getBuilding(spaceData.buildingId);
        parentData.buildingName = building?.name || spaceData.buildingId;
      }
      
      if (spaceData.floorId) {
        const floor = await getFloor(spaceData.floorId);
        parentData.floorName = floor?.name || spaceData.floorId;
      }
      
      if (spaceData.wingId) {
        const wing = await getWing(spaceData.wingId);
        parentData.wingName = wing?.name || spaceData.wingId;
      }

      setParentNames(parentData);

      const activitiesData = await getActivitiesBySpace(spaceId);
      setActivities(activitiesData);
    } catch (err) {
      console.error('Error loading space:', err);
      setError('Failed to load space. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (spaceId) {
      loadData();
    }
  }, [spaceId]);

  const handleDeleteSpace = async () => {
    setDeleting(true);
    try {
      await deleteSpace(spaceId);
      navigate(`/projects/${space?.projectId}`);
    } catch (err) {
      setError('Failed to delete space');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const spaceProgress = calculateSpaceProgress(activities);
  const completedCount = activities.filter(a => a.status === 'completed' || a.progress === 100).length;
  const inProgressCount = activities.filter(a => a.status === 'in_progress' || (a.progress > 0 && a.progress < 100)).length;
  const blockedCount = activities.filter(a => a.status === 'blocked').length;

  const handleCreateActivity = async () => {
    if (!newActivity.name.trim()) {
      setFormError('Activity name is required');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await createActivity({
        projectId: space.projectId,
        buildingId: space.buildingId,
        floorId: space.floorId,
        wingId: space.wingId,
        spaceId: space.spaceId,
        name: newActivity.name,
        code: newActivity.code || '',
        description: newActivity.description || '',
        order: newActivity.order || activities.length + 1,
        status: 'not_started',
        progress: 0,
      }, user?.uid);

      setNewActivity({ name: '', code: '', description: '', order: 0 });
      setShowAddActivity(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create activity');
    } finally {
      setSubmitting(false);
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

  const handleApplyTemplate = async (templateId) => {
    setSubmitting(true);
    setFormError('');
    try {
      const template = ACTIVITY_TEMPLATES[templateId];
      if (!template) {
        setFormError('Template not found');
        return;
      }

      await createActivitiesFromTemplate(
        {
          projectId: space.projectId,
          buildingId: space.buildingId,
          floorId: space.floorId,
          wingId: space.wingId,
          spaceId: space.spaceId,
        },
        template.activities,
        user?.uid
      );

      setShowTemplateModal(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to apply template');
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading space...</p>
        </div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Building2 size={48} className="text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{error || 'Space not found'}</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate(`/projects/${space?.projectId}`)}
          >
            Back to Project
          </Button>
        </div>
      </div>
    );
  }

  const buildBreadcrumb = () => {
    const items = [];
    items.push({ name: 'Dashboard', path: '/', isLink: true });
    
    const projectName = parentNames.projectName || 'Project';
    items.push({ 
      name: projectName, 
      path: `/projects/${space.projectId}`, 
      isLink: true 
    });
    
    if (parentNames.buildingId) {
      items.push({ 
        name: parentNames.buildingName || 'Building', 
        path: `/projects/${space.projectId}/buildings/${parentNames.buildingId}`, 
        isLink: true 
      });
    }
    
    if (parentNames.floorId) {
      items.push({ 
        name: parentNames.floorName || 'Level', 
        path: `/projects/${space.projectId}/buildings/${parentNames.buildingId}/floors/${parentNames.floorId}`, 
        isLink: true 
      });
    }
    
    if (parentNames.wingId) {
      items.push({ 
        name: parentNames.wingName || 'Wing', 
        path: `/projects/${space.projectId}/buildings/${parentNames.buildingId}/floors/${parentNames.floorId}/wings/${parentNames.wingId}`, 
        isLink: true 
      });
    }
    
    items.push({ 
      name: space.name, 
      path: '', 
      isLink: false 
    });
    
    return items;
  };

  const breadcrumbItems = buildBreadcrumb();

  return (
    <ProjectGuard projectId={space?.projectId}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={item.path + index}>
              {index > 0 && (
                <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
              )}
              {item.isLink ? (
                <Link
                  to={item.path}
                  className="hover:text-primary-500 transition-colors truncate max-w-[120px]"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                  {item.name}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {space.name}
              </h1>
              <Badge variant="primary" size="sm">{space.type || 'Space'}</Badge>
              <Badge variant="secondary" size="sm">
                {space.status || 'Active'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
              {parentNames.buildingName && (
                <>
                  <Building2 size={14} className="text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{parentNames.buildingName}</span>
                </>
              )}
              
              {parentNames.floorName && (
                <>
                  <span className="text-gray-400">•</span>
                  <Home size={14} className="text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{parentNames.floorName}</span>
                </>
              )}
              
              {parentNames.wingName && (
                <>
                  <span className="text-gray-400">•</span>
                  <Layers size={14} className="text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{parentNames.wingName}</span>
                </>
              )}
            </div>

            {space.code && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Code: {space.code}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate(`/projects/${space.projectId}`)}
              icon={<ArrowLeft size={16} />}
            >
              Back
            </Button>
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={16} />}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Space
              </Button>
            )}
          </div>
        </div>

        {/* Description */}
        {space.description && (
          <Card>
            <p className="text-gray-600 dark:text-gray-300">{space.description}</p>
          </Card>
        )}

        {/* Space Progress */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Overall Progress</h3>
            </div>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {spaceProgress}%
            </span>
          </div>
          <ProgressBar value={spaceProgress} />
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activities.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgressCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{blockedCount}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Blocked</p>
            </div>
          </div>
        </Card>

        {/* Activities Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Construction Activities</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track progress for each activity in this space
              </p>
            </div>
            <div className="flex gap-2">
              {canCreateActivities && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<FileText size={16} />}
                  onClick={() => setShowTemplateModal(true)}
                >
                  Apply Template
                </Button>
              )}
              {canCreateActivities && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={16} />}
                  onClick={() => setShowAddActivity(true)}
                >
                  Add Activity
                </Button>
              )}
            </div>
          </div>

          {activities.length === 0 ? (
            <Card>
              <div className="py-8 text-center">
                <Zap size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No activities have been assigned</p>
                {canCreateActivities && (
                  <div className="flex justify-center gap-3 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTemplateModal(true)}
                    >
                      Apply Template
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowAddActivity(true)}
                    >
                      Add First Activity
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
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
                />
              ))}
            </div>
          )}
        </div>

        {/* Add Activity Modal */}
        <AnimatePresence>
          {showAddActivity && (
            <Modal
              title="Add Activity"
              onClose={() => { setShowAddActivity(false); setFormError(''); }}
              onSubmit={handleCreateActivity}
              submitting={submitting}
              error={formError}
            >
              <Input
                label="Activity Name"
                name="name"
                placeholder="e.g., Routing"
                value={newActivity.name}
                onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                required
              />
              <Input
                label="Activity Code"
                name="code"
                placeholder="e.g., ELEC-001"
                value={newActivity.code}
                onChange={(e) => setNewActivity({ ...newActivity, code: e.target.value })}
              />
              <Input
                label="Description"
                name="description"
                placeholder="Brief description"
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              />
              <Input
                label="Order"
                name="order"
                type="number"
                placeholder="1"
                value={newActivity.order}
                onChange={(e) => setNewActivity({ ...newActivity, order: parseInt(e.target.value) || 0 })}
              />
            </Modal>
          )}
        </AnimatePresence>

        {/* Template Modal */}
        <AnimatePresence>
          {showTemplateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowTemplateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Apply Activity Template</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Select a template to create multiple activities at once
                  </p>
                </div>
                <div className="p-6 space-y-4">
                  {formError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                      {formError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getTemplateNames().map((template) => (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                        onClick={() => handleApplyTemplate(template.id)}
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{template.discipline}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {template.activityCount} activities
                        </p>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="ghost" onClick={() => setShowTemplateModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Space Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} className="text-red-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Space</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete <span className="font-semibold">{space.name}</span>?
                This will permanently remove all activities.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                <Button variant="danger" onClick={handleDeleteSpace} loading={deleting}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProjectGuard>
  );
}

// Activity Item Component
function ActivityItem({ 
  activity, 
  isEditing, 
  onEdit, 
  onCancelEdit, 
  onUpdateProgress, 
  onUpdateStatus, 
  onDelete, 
  canEdit, 
  canDelete
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'in_progress': return <PlayCircle size={16} className="text-blue-500" />;
      case 'on_hold': return <PauseCircle size={16} className="text-yellow-500" />;
      case 'blocked': return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
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
                <button
                  onClick={onEdit}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Update Progress"
                >
                  <Edit2 size={14} className="text-gray-400 hover:text-primary-500" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={onDelete}
                  className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  title="Delete Activity"
                >
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

// Modal Component
function Modal({ title, children, onClose, onSubmit, submitting, error }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          {children}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" onClick={onSubmit} loading={submitting}>
              Create
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SpaceDetail;