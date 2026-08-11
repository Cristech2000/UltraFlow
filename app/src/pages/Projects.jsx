import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, FolderKanban, Calendar, MapPin, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjectsByOrganization, getAllProjects } from '../services/projectService';
import { getProjectMembers } from '../services/membershipService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { STATUS_DISPLAY_NAMES, getStatusColor } from '../constants/status';
import CreateProjectModal from '../components/projects/CreateProjectModal';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const { userProfile, userRole, isGlobalRole, projectIds, user } = useAuth();
  const navigate = useNavigate();

  const canCreateProject = ['director', 'engineer'].includes(userRole);  // ← CHANGED: removed 'supervisor'
  const isElectrician = userRole === 'electrician';

  // Load projects
  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const organizationId = userProfile?.organizationId || 'ultrapower';
      
      let projectsData;
      
      // Global roles see all projects
      if (isGlobalRole) {
        projectsData = await getAllProjects();
      } else {
        // Non-global roles see only their assigned projects
        const allProjects = await getProjectsByOrganization(organizationId);
        const userProjectIds = projectIds || [];
        projectsData = allProjects.filter(p => userProjectIds.includes(p.projectId));
      }
      
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
  }, [userProfile, isGlobalRole, projectIds]);

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

  // Electrician simplified view
  if (isElectrician) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Projects you are assigned to work on
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-12 text-center">
            <FolderKanban size={48} className="text-gray-400 mx-auto" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">No projects assigned to you yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.projectId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full">
                  <div className="flex flex-col h-full">
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
                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 flex-1">
                        {project.description}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate('/my-tasks')}
                      >
                        View My Tasks
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Normal projects view for other roles
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isGlobalRole ? 'All organization projects' : 'Your assigned projects'}
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
              : isGlobalRole 
                ? 'No projects have been created yet'
                : 'You are not assigned to any projects yet'}
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
              onClick={() => navigate(`/projects/${project.projectId}`)}
              className="cursor-pointer"
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <div className="flex flex-col h-full">
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
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
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