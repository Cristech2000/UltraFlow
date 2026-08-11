import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  FolderKanban,
  Plus,
  ChevronRight,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProject, hardDeleteProject } from '../services/projectService';
import { getBuildingsByProject, createBuilding, deleteBuilding } from '../services/spaceService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import { STATUS_DISPLAY_NAMES, getStatusColor } from '../constants/status';

function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [project, setProject] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [buildingForm, setBuildingForm] = useState({ name: '', code: '', description: '', status: 'active' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canEdit = ['director', 'engineer', 'supervisor'].includes(userRole);
  const canDelete = ['director'].includes(userRole);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const projectData = await getProject(projectId);
      if (!projectData) {
        setError('Project not found');
        setLoading(false);
        return;
      }
      setProject(projectData);

      const buildingsData = await getBuildingsByProject(projectId);
      setBuildings(buildingsData);
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Failed to load project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const handleCreateBuilding = async () => {
    if (!buildingForm.name.trim()) {
      setFormError('Building name is required');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await createBuilding(buildingForm, projectId, user?.uid);
      setShowBuildingForm(false);
      setBuildingForm({ name: '', code: '', description: '', status: 'active' });
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create building');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await hardDeleteProject(projectId);
      navigate('/projects');
    } catch (err) {
      setError('Failed to delete project');
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    const label = STATUS_DISPLAY_NAMES[status] || status;
    return (
      <span className={`text-xs px-3 py-1 rounded-full font-medium ${color}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FolderKanban size={48} className="text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{error || 'Project not found'}</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate('/projects')}
          >
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/projects" className="hover:text-primary-500 transition-colors">Projects</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            {getStatusBadge(project.status)}
          </div>
          {project.code && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Code: {project.code}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/projects')}
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
              Delete Project
            </Button>
          )}
        </div>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {project.client && <InfoCard label="Client" value={project.client} icon={Users} />}
        {project.location && <InfoCard label="Location" value={project.location} icon={MapPin} />}
        {project.startDate && (
          <InfoCard label="Start Date" value={new Date(project.startDate).toLocaleDateString()} icon={Calendar} />
        )}
        {project.expectedCompletionDate && (
          <InfoCard label="Expected Completion" value={new Date(project.expectedCompletionDate).toLocaleDateString()} icon={Calendar} />
        )}
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <p className="text-gray-600 dark:text-gray-300">{project.description}</p>
        </Card>
      )}

      {/* Buildings Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Buildings
          </h2>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setShowBuildingForm(true)}
            >
              Add Building
            </Button>
          )}
        </div>

        {buildings.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <Building2 size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No buildings yet</p>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowBuildingForm(true)}
                >
                  Add First Building
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildings.map((building) => (
              <BuildingCard 
                key={building.buildingId} 
                building={building} 
                projectId={projectId} 
                getStatusBadge={getStatusBadge}
                onDelete={loadData}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Project Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Project</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <span className="font-semibold">{project.name}</span>?
              This will permanently remove all buildings, levels, wings, spaces, and activities.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDeleteProject} loading={deleting}>
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Building Modal */}
      {showBuildingForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Building</h2>
              <button onClick={() => { setShowBuildingForm(false); setFormError(''); }}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {formError}
                </div>
              )}
              <Input
                label="Building Name"
                placeholder="e.g., Block A"
                value={buildingForm.name}
                onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                required
              />
              <Input
                label="Building Code"
                placeholder="e.g., B-A"
                value={buildingForm.code}
                onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })}
              />
              <Input
                label="Description"
                placeholder="Brief description"
                value={buildingForm.description}
                onChange={(e) => setBuildingForm({ ...buildingForm, description: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Status
                </label>
                <select
                  value={buildingForm.status}
                  onChange={(e) => setBuildingForm({ ...buildingForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="planned">Planned</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" onClick={() => { setShowBuildingForm(false); setFormError(''); }}>Cancel</Button>
                <Button variant="primary" onClick={handleCreateBuilding} loading={submitting}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Building Card Component with Delete
function BuildingCard({ building, projectId, getStatusBadge, onDelete, canDelete }) {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { name, code, status, description, buildingId } = building;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBuilding(buildingId);
      onDelete();
    } catch (err) {
      console.error('Error deleting building:', err);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow relative group"
        onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}`)}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
              {code && <p className="text-xs text-gray-500 dark:text-gray-400">{code}</p>}
            </div>
            {getStatusBadge(status)}
          </div>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{description}</p>
          )}
          <div className="mt-3 flex items-center text-sm text-primary-600 dark:text-primary-400">
            Click to view <ChevronRight size={16} className="ml-1" />
          </div>
          {canDelete && (
            <button
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
              onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
            >
              <Trash2 size={16} className="text-red-500" />
            </button>
          )}
        </div>
      </Card>

      {/* Delete Building Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Building</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <span className="font-semibold">{name}</span>?
              This will permanently remove all levels, wings, spaces, and activities.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoCard({ label, value, icon: Icon }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Icon size={16} className="text-gray-500" />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default ProjectDetail;