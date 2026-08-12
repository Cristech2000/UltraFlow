import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Plus,
  Users,
  Building2,
  Home,
  Layers,
  Grid,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Target,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjectsByOrganization, getAllProjects } from '../services/projectService';
import { getActivitiesByProject, getActivity } from '../services/activityService';
import { 
  getBuildingsByProject, 
  getFloorsByBuilding, 
  getWingsByFloor, 
  getSpacesByWing,
  getSpacesByFloor,
  getSpacesByBuilding,
  getSpace,
} from '../services/spaceService';
import { createTask, getTasksByProject, getTaskLocation, resolveTaskScope } from '../services/taskService';
import { getEligibleTaskMembers } from '../services/membershipService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import ProgressBar from '../components/common/ProgressBar';
import { getRoleDisplayName } from '../constants/roles';

function TaskAllocation() {
  const { user, userProfile, userRole, projectIds } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [scopeSpaceCount, setScopeSpaceCount] = useState(0);

  const [assignmentLevel, setAssignmentLevel] = useState('');

  const [selectedLocation, setSelectedLocation] = useState({
    buildingId: '',
    floorId: '',
    wingId: '',
    spaceId: '',
  });

  const [availableFloors, setAvailableFloors] = useState([]);
  const [availableWings, setAvailableWings] = useState([]);
  const [availableSpaces, setAvailableSpaces] = useState([]);

  const [locationNames, setLocationNames] = useState({
    buildingName: '',
    floorName: '',
    wingName: '',
    spaceName: '',
  });

  const [taskForm, setTaskForm] = useState({
    scopeType: 'level',
    selectedBuildingId: '',
    selectedFloorId: '',
    selectedWingId: '',
    selectedSpaceIds: [],
    responsiblePerson: '',
    teamName: '',
    teamMembers: [],
  });

  const canManageTasks = ['director', 'supervisor', 'foreman'].includes(userRole);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const orgId = userProfile?.organizationId || 'ultrapower';
        const allProjects = await getProjectsByOrganization(orgId);
        
        const isGlobalRole = ['hr', 'director'].includes(userRole);
        
        let filteredProjects;
        if (isGlobalRole) {
          filteredProjects = allProjects;
        } else {
          const userProjectIds = projectIds || [];
          filteredProjects = allProjects.filter(p => userProjectIds.includes(p.projectId));
        }
        
        setProjects(filteredProjects);
      } catch (err) {
        console.error('Error loading projects:', err);
      }
    };
    loadProjects();
  }, [userProfile, userRole, projectIds]);

  useEffect(() => {
    const loadEligibleUsers = async () => {
      if (!selectedProject) {
        setUsers([]);
        return;
      }
      try {
        const eligibleUsers = await getEligibleTaskMembers(selectedProject.projectId);
        setUsers(eligibleUsers);
      } catch (err) {
        console.error('Error loading eligible users:', err);
        setUsers([]);
      }
    };
    loadEligibleUsers();
  }, [selectedProject]);

  // 🔥 Intelligent Activity Bubbling/Collection Logic
  useEffect(() => {
    const fetchActivities = async () => {
      if (!selectedProject || !assignmentLevel) return;
      
      const readyToLoad = 
        (assignmentLevel === 'building' && selectedLocation.buildingId) ||
        (assignmentLevel === 'level' && selectedLocation.floorId) ||
        (assignmentLevel === 'wing' && selectedLocation.wingId) ||
        (assignmentLevel === 'space' && selectedLocation.spaceId);

      if (!readyToLoad) {
        setFilteredActivities([]);
        return;
      }

      setIsActivityLoading(true);
      try {
        const allActivities = await getActivitiesByProject(selectedProject.projectId);
        let collectedActivities = [];
        let resolvedItems = [];

        if (assignmentLevel === 'building') {
          resolvedItems = await resolveTaskScope({
            scopeType: 'building',
            buildingId: selectedLocation.buildingId,
            activityId: null // gets all
          });

          // Grab building-wide, level-wide, wing-wide, and space-level activities inside this building
          const floors = await getFloorsByBuilding(selectedLocation.buildingId);
          const floorIds = floors.map(f => f.floorId);
          
          const wings = [];
          for (const f of floors) {
            const ws = await getWingsByFloor(f.floorId);
            wings.push(...ws);
          }
          const wingIds = wings.map(w => w.wingId);

          collectedActivities = allActivities.filter(a => 
            a.buildingId === selectedLocation.buildingId ||
            floorIds.includes(a.floorId) ||
            wingIds.includes(a.wingId) ||
            (a.projectId === selectedProject.projectId && !a.buildingId)
          );

        } else if (assignmentLevel === 'level') {
          resolvedItems = await resolveTaskScope({
            scopeType: 'level',
            floorId: selectedLocation.floorId
          });

          const wings = await getWingsByFloor(selectedLocation.floorId);
          const wingIds = wings.map(w => w.wingId);

          collectedActivities = allActivities.filter(a => 
            a.floorId === selectedLocation.floorId ||
            wingIds.includes(a.wingId)
          );

        } else if (assignmentLevel === 'wing') {
          resolvedItems = await resolveTaskScope({
            scopeType: 'wing',
            wingId: selectedLocation.wingId
          });

          collectedActivities = allActivities.filter(a => 
            a.wingId === selectedLocation.wingId || a.spaceId
          );

        } else if (assignmentLevel === 'space') {
          collectedActivities = allActivities.filter(a => a.spaceId === selectedLocation.spaceId);
        }

        setScopeSpaceCount(resolvedItems.length);

        // Deduplicate
        const seen = new Set();
        const uniqueActivities = collectedActivities.filter(a => {
          if (a.status === 'completed') return false;
          const key = `${a.name}-${a.scope || 'space'}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setFilteredActivities(uniqueActivities);
      } catch (err) {
        console.error('Error loading hierarchical activities:', err);
        setError('Failed to load activities for this location');
      } finally {
        setIsActivityLoading(false);
      }
    };

    fetchActivities();
  }, [assignmentLevel, selectedLocation, selectedProject]);

  const loadTasks = async (projectId) => {
    setTasksLoading(true);
    try {
      const tasksData = await getTasksByProject(projectId);
      const enrichedTasks = await Promise.all(
        tasksData.map(async (task) => {
          let activityName = 'Unknown Activity';
          try {
            const activity = await getActivity(task.activityId);
            if (activity) activityName = activity.name;
          } catch (err) {
            console.error('Error fetching activity for task:', err);
          }
          const location = await getTaskLocation(task);
          return { ...task, activityName, location };
        })
      );
      setTasks(enrichedTasks);
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  const loadBuildings = async (projectId) => {
    try {
      const buildingsData = await getBuildingsByProject(projectId);
      setBuildings(buildingsData);
      return buildingsData;
    } catch (err) {
      console.error('Error loading buildings:', err);
      return [];
    }
  };

  const loadFloorsForBuilding = async (buildingId) => {
    try {
      const floorsData = await getFloorsByBuilding(buildingId);
      setAvailableFloors(floorsData);
      return floorsData;
    } catch (err) {
      console.error('Error loading floors:', err);
      return [];
    }
  };

  const loadWingsForFloor = async (floorId) => {
    try {
      const wingsData = await getWingsByFloor(floorId);
      setAvailableWings(wingsData);
      return wingsData;
    } catch (err) {
      console.error('Error loading wings:', err);
      return [];
    }
  };

  const handleProjectSelect = async (projectId) => {
    const project = projects.find(p => p.projectId === projectId);
    setSelectedProject(project);
    setSelectedActivity(null);
    setFilteredActivities([]);
    setTasks([]);
    setShowCreateForm(false);
    
    setAssignmentLevel('');
    setSelectedLocation({ buildingId: '', floorId: '', wingId: '', spaceId: '' });
    setAvailableFloors([]);
    setAvailableWings([]);
    setAvailableSpaces([]);
    setLocationNames({ buildingName: '', floorName: '', wingName: '', spaceName: '' });
    setScopeSpaceCount(0);
    
    setTaskForm({
      scopeType: 'level',
      selectedBuildingId: '',
      selectedFloorId: '',
      selectedWingId: '',
      selectedSpaceIds: [],
      responsiblePerson: '',
      teamName: '',
      teamMembers: [],
    });
    setBuildings([]);
    
    if (projectId) {
      await loadBuildings(projectId);
      await loadTasks(projectId);
    }
  };

  const handleAssignmentLevelChange = (level) => {
    setAssignmentLevel(level);
    setSelectedLocation({ buildingId: '', floorId: '', wingId: '', spaceId: '' });
    setAvailableFloors([]);
    setAvailableWings([]);
    setAvailableSpaces([]);
    setLocationNames({ buildingName: '', floorName: '', wingName: '', spaceName: '' });
    setFilteredActivities([]);
    setSelectedActivity(null);
    setShowCreateForm(false);
    setScopeSpaceCount(0);
    
    setTaskForm(prev => ({
      ...prev,
      scopeType: level,
      selectedBuildingId: '',
      selectedFloorId: '',
      selectedWingId: '',
      selectedSpaceIds: [],
      responsiblePerson: '',
    }));
  };

  const handleBuildingChange = async (buildingId) => {
    const building = buildings.find(b => b.buildingId === buildingId);
    setLocationNames(prev => ({ ...prev, buildingName: building?.name || '' }));
    setSelectedLocation({ buildingId, floorId: '', wingId: '', spaceId: '' });
    setAvailableFloors([]);
    setAvailableWings([]);
    setAvailableSpaces([]);
    if (buildingId) await loadFloorsForBuilding(buildingId);
  };

  const handleFloorChange = async (floorId) => {
    const floor = availableFloors.find(f => f.floorId === floorId);
    setLocationNames(prev => ({ ...prev, floorName: floor?.name || '' }));
    setSelectedLocation(prev => ({ ...prev, floorId, wingId: '', spaceId: '' }));
    setAvailableWings([]);
    setAvailableSpaces([]);
    if (floorId) await loadWingsForFloor(floorId);
  };

  const handleWingChange = async (wingId) => {
    const wing = availableWings.find(w => w.wingId === wingId);
    setLocationNames(prev => ({ ...prev, wingName: wing?.name || '' }));
    setSelectedLocation(prev => ({ ...prev, wingId, spaceId: '' }));
    setAvailableSpaces([]);
    if (wingId) {
      const spaces = await getSpacesByWing(wingId);
      setAvailableSpaces(spaces);
    }
  };

  const handleSpaceChange = async (spaceId) => {
    const space = availableSpaces.find(s => s.spaceId === spaceId);
    setLocationNames(prev => ({ ...prev, spaceName: space?.name || '' }));
    setSelectedLocation(prev => ({ ...prev, spaceId }));
  };

  const toggleTeamMember = (userId) => {
    setTaskForm(prev => {
      const current = prev.teamMembers || [];
      if (current.includes(userId)) {
        return { ...prev, teamMembers: current.filter(id => id !== userId) };
      } else {
        return { ...prev, teamMembers: [...current, userId] };
      }
    });
  };

  const handleCreateTask = async () => {
    if (!selectedActivity) {
      setError('Please select an activity');
      return;
    }
    if (!taskForm.responsiblePerson) {
      setError('Please select a responsible person');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await createTask({
        activityId: selectedActivity.activityId,
        projectId: selectedProject.projectId,
        buildingId: selectedLocation.buildingId || null,
        floorId: selectedLocation.floorId || null,
        wingId: selectedLocation.wingId || null,
        scopeType: assignmentLevel,
        selectedSpaceIds: taskForm.selectedSpaceIds || [],
        responsiblePerson: taskForm.responsiblePerson,
        teamName: taskForm.teamName || '',
        teamMembers: taskForm.teamMembers || [],
      }, user?.uid);

      setSuccess(`✅ Task created successfully!`);
      setShowCreateForm(false);
      setTaskForm({
        scopeType: 'level',
        selectedBuildingId: '',
        selectedFloorId: '',
        selectedWingId: '',
        selectedSpaceIds: [],
        responsiblePerson: '',
        teamName: '',
        teamMembers: [],
      });
      setSelectedActivity(null);
      
      await loadTasks(selectedProject.projectId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create task');
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
    return map[status]?.label || status;
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

  const getLocationPath = () => {
    const parts = [];
    if (locationNames.buildingName) parts.push(locationNames.buildingName);
    if (locationNames.floorName) parts.push(locationNames.floorName);
    if (locationNames.wingName) parts.push(locationNames.wingName);
    if (locationNames.spaceName) parts.push(locationNames.spaceName);
    return parts.length > 0 ? parts.join(' → ') : 'Select location...';
  };

  const getLevelDisplayName = () => {
    const map = { 'building': 'Building', 'level': 'Level', 'wing': 'Wing', 'space': 'Space' };
    return map[assignmentLevel] || '';
  };

  if (!canManageTasks) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Users size={48} className="text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Only Supervisors, Foremen, and Directors can manage tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Allocation</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Select location level and assign work with automated scope expansion</p>
        </div>
      </div>

      {success && <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">{success}</div>}
      {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{error}</div>}

      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Step 1: Select Project</h3>
        <select
          value={selectedProject?.projectId || ''}
          onChange={(e) => handleProjectSelect(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select a project...</option>
          {projects.map(p => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
        </select>
      </Card>

      {selectedProject && (
        <>
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Step 2: What level do you want to assign work to?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['building', 'level', 'wing', 'space'].map((lvl) => (
                <button
                  key={lvl}
                  className={`p-4 border-2 rounded-lg text-center transition-colors capitalize ${
                    assignmentLevel === lvl ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => handleAssignmentLevelChange(lvl)}
                >
                  <p className="font-medium text-gray-900 dark:text-white">{lvl}</p>
                </button>
              ))}
            </div>
          </Card>

          {assignmentLevel && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Step 3: Select {getLevelDisplayName()} Location</h3>
              <div className="space-y-4">
                <select
                  value={selectedLocation.buildingId}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">Select Building...</option>
                  {buildings.map(b => <option key={b.buildingId} value={b.buildingId}>{b.name}</option>)}
                </select>

                {(assignmentLevel === 'level' || assignmentLevel === 'wing' || assignmentLevel === 'space') && (
                  <select
                    value={selectedLocation.floorId}
                    onChange={(e) => handleFloorChange(e.target.value)}
                    disabled={!selectedLocation.buildingId}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Select Level...</option>
                    {availableFloors.map(f => <option key={f.floorId} value={f.floorId}>{f.name}</option>)}
                  </select>
                )}

                {(assignmentLevel === 'wing' || assignmentLevel === 'space') && (
                  <select
                    value={selectedLocation.wingId}
                    onChange={(e) => handleWingChange(e.target.value)}
                    disabled={!selectedLocation.floorId}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Select Wing...</option>
                    {availableWings.map(w => <option key={w.wingId} value={w.wingId}>{w.name}</option>)}
                  </select>
                )}
              </div>
            </Card>
          )}

          {assignmentLevel && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Step 4: Select Activity to Assign</h3>
              {isActivityLoading ? (
                <div className="py-4 text-center">Loading activities...</div>
              ) : filteredActivities.length === 0 ? (
                <div className="py-4 text-center text-gray-500 dark:text-gray-400">No activities found for this scope.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredActivities.map((activity) => (
                    <div
                      key={activity.activityId}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedActivity?.activityId === activity.activityId ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => {
                        setSelectedActivity(activity);
                        setShowCreateForm(true);
                      }}
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{activity.name}</p>
                      <p className="text-xs text-gray-400 mt-1">Scope Type: {activity.scope}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {showCreateForm && selectedActivity && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Step 5: Assign Team to: {selectedActivity.name}</h3>
              <div className="space-y-4">
                <select
                  value={taskForm.responsiblePerson}
                  onChange={(e) => setTaskForm({ ...taskForm, responsiblePerson: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">Select Responsible Person...</option>
                  {users.map(u => <option key={u.uid} value={u.uid}>{u.fullName || u.email} ({getRoleDisplayName(u.role)})</option>)}
                </select>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="ghost" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleCreateTask} loading={submitting}>Create Task</Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default TaskAllocation;