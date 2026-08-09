import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  FolderKanban, 
  Calendar, 
  MapPin, 
  Building2, 
  Users,
  Trash2,
  Archive,
  RotateCcw,
  MoreVertical,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjectsByOrganization, hardDeleteProject, archiveProject, restoreProject } from '../services/projectService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { STATUS_DISPLAY_NAMES, getStatusColor, STATUSES } from '../constants/status';
import CreateProjectModal from '../components/projects/CreateProjectModal';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionType, setActionType] = useState('archive'); // 'archive' or 'delete'
  const { userProfile, userRole } = useAuth();
  const navigate = useNavigate();

  const canCreateProject = ['director', 'engineer', 'supervisor'].includes(userRole);
  const canDeleteProject = ['director'].includes(userRole); // Only directors can hard delete

  // Load projects
  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const organizationId = userProfile?.organizationId || 'ultrapower';
      const projectsData = await getProjectsByOrganization(organizationId);
      setProjects(projectsData);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [userProfile]);

  // Handle archive/delete
  const handleArchiveProject = async () => {
    if (!selectedProject) return;
    setDeleting(true);
    try {
      await archiveProject(selectedProject.projectId);
      await loadProjects();
      setShowDeleteModal(false);
      setSelectedProject(null);
    } catch (err) {
      console.error('Error archiving project:', err);
      setError('Failed to archive project. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    setDeleting(true);
    try {
      await hardDeleteProject(selectedProject.projectId);
      await loadProjects();
      setShowDeleteModal(false);
      setSelectedProject(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestoreProject = async (projectId) => {
    try {
      await restoreProject(projectId);
      await loadProjects();
    } catch (err) {
      console.error('Error restoring project:', err);
      setError('Failed to restore project. Please try again.');
    }
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    const label = STATUS_DISPLAY_NAMES[status] || status;
    return (
      <span className={`text-xs px-3 py-1 rounded-full font-medium ${color}`}>
        {label}
      </span>
    );
  };

  // Open delete modal
  const openDeleteModal = (project, type) => {
    setSelectedProject(project);
    setActionType(type);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage all construction projects
          </p>
        </div>
        {canCreateProject && (
          <Button
            variant="primary"
            icon={<Plus size={18} />}
            onClick={() => setShowCreateModal(true)}
          >
            New Project
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects by name, code, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all-200"
            />
          </div>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all-200"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="planned">Planned</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Project List */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-12 text-center">
          <FolderKanban size={48} className="text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all' 
              ? 'No projects match your filters'
              : 'No projects have been created yet'}
          </p>
          {canCreateProject && !searchTerm && filterStatus === 'all' && (
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => setShowCreateModal(true)}
            >
              Create Your First Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.projectId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <Card className="h-full hover:shadow-lg transition-shadow relative">
                <div 
                  className="flex flex-col h-full cursor-pointer"
                  onClick={() => navigate(`/projects/${project.projectId}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {project.name}
                      </h3>
                      {project.code && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {project.code}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(project.status)}
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 flex-1">
                      {project.description}
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                    {project.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <MapPin size={14} />
                        <span>{project.location}</span>
                      </div>
                    )}
                    {project.client && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Users size={14} />
                        <span>{project.client}</span>
                      </div>
                    )}
                    {project.startDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar size={14} />
                        <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Updated: {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons - Show on hover */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Restore button for archived projects */}
                  {project.status === 'archived' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreProject(project.projectId);
                      }}
                      className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      title="Restore Project"
                    >
                      <RotateCcw size={14} className="text-green-600 dark:text-green-400" />
                    </button>
                  )}

                  {/* Archive button */}
                  {project.status !== 'archived' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(project, 'archive');
                      }}
                      className="p-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                      title="Archive Project"
                    >
                      <Archive size={14} className="text-yellow-600 dark:text-yellow-400" />
                    </button>
                  )}

                  {/* Hard Delete button - Directors only */}
                  {canDeleteProject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(project, 'delete');
                      }}
                      className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      title="Delete Permanently"
                    >
                      <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete/Archive Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    actionType === 'delete' 
                      ? 'bg-red-100 dark:bg-red-900/30' 
                      : 'bg-yellow-100 dark:bg-yellow-900/30'
                  }`}>
                    {actionType === 'delete' ? (
                      <AlertTriangle size={24} className="text-red-500" />
                    ) : (
                      <Archive size={24} className="text-yellow-500" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {actionType === 'delete' ? 'Delete Project' : 'Archive Project'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  {actionType === 'delete' ? (
                    <>
                      Are you sure you want to <span className="text-red-500 font-semibold">permanently delete</span> 
                      the project <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedProject.name}
                      </span>?
                    </>
                  ) : (
                    <>
                      Are you sure you want to <span className="text-yellow-500 font-semibold">archive</span> 
                      the project <span className="font-semibold text-gray-900 dark:text-white">
                        {selectedProject.name}
                      </span>?
                    </>
                  )}
                </p>

                {actionType === 'delete' && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                      ⚠️ This action cannot be undone. All data associated with this project will be permanently removed.
                    </p>
                  </div>
                )}

                {actionType === 'archive' && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      📁 The project will be hidden from active views but can be restored later.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>Project: <span className="font-medium">{selectedProject.code || selectedProject.name}</span></span>
                  <span>•</span>
                  <span>Created: {new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={actionType === 'delete' ? 'danger' : 'secondary'}
                    onClick={actionType === 'delete' ? handleDeleteProject : handleArchiveProject}
                    loading={deleting}
                    className={actionType === 'archive' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''}
                  >
                    {actionType === 'delete' ? 'Delete Permanently' : 'Archive Project'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadProjects();
          }}
        />
      )}
    </div>
  );
}

export default Projects;