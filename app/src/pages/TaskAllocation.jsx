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
import { getActivitiesByScope, ACTIVITY_SCOPES, getActivitiesByProject, getActivity } from '../services/activityService';
import { 
  getBuildingsByProject, 
  getFloorsByBuilding, 
  getWingsByFloor, 
  getSpacesByWing,
  getSpacesByFloor,
  getSpacesByBuilding,
  getBuilding,
  getFloor,
  getWing,
  getSpace,
} from '../services/spaceService';
import { createTask, getTasksByProject, getTaskLocation } from '../services/taskService';
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
  const [activities, setActivities] = useState([]);
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
    teamName: '',
    teamMembers: [],
  });

  const canManageTasks = ['director', 'supervisor', 'foreman'].includes(userRole);

  // Load projects - FILTERED BY PROJECT MEMBERSHIP
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const orgId = userProfile?.organizationId || 'ultrapower';
        const allProjects = await getProjectsByOrganization(orgId);
        
        // Check if user is global role (HR or Director)
        const isGlobalRole = ['hr', 'director'].includes(userRole);
        
        let filteredProjects;
        if (isGlobalRole) {
          // HR and Director see all projects
          filteredProjects = allProjects;
        } else {
          // Other roles only see projects they are assigned to
          const userProjectIds = projectIds || [];
          filteredProjects = allProjects.filter(p => userProjectIds.includes(p.projectId));
        }
        
        setProjects(filteredProjects);
        console.log('📋 Loaded projects:', filteredProjects);
      } catch (err) {
        console.error('Error loading projects:', err);
      }
    };
    loadProjects();
  }, [userProfile, userRole, projectIds]);

  // Load users for team assignment - FILTERED BY PROJECT MEMBERSHIP
  useEffect(() => {
    const loadEligibleUsers = async () => {
      if (!selectedProject) {
        setUsers([]);
        return;
      }
      try {
        const eligibleUsers = await getEligibleTaskMembers(selectedProject.projectId);
        setUsers(eligibleUsers);
        console.log('📋 Eligible users for project:', eligibleUsers);
      } catch (err) {
        console.error('Error loading eligible users:', err);
        setUsers([]);
      }
    };
    loadEligibleUsers();
  }, [selectedProject]);

  // Load tasks for selected project
  const loadTasks = async (projectId) => {
    setTasksLoading(true);
    try {
      const tasksData = await getTasksByProject(projectId);
      const enrichedTasks = await Promise.all(
        tasksData.map(async (task) => {
          let activityName = 'Unknown Activity';
          try {
            const activity = await getActivity(task.activityId);
            if (activity) {
              activityName = activity.name;
            }
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

  // Load buildings when project is selected
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

  // Load floors for a building
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

  // Load wings for a floor
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

  // Load spaces for a wing
  const loadSpacesForWing = async (wingId) => {
    try {
      const spacesData = await getSpacesByWing(wingId);
      setAvailableSpaces(spacesData);
      return spacesData;
    } catch (err) {
      console.error('Error loading spaces:', err);
      return [];
    }
  };

  // Load activities - accepts explicit IDs
  const loadActivitiesForAssignment = async (explicitId = null, explicitLevel = null) => {
    const level = explicitLevel || assignmentLevel;
    if (!selectedProject || !level) return;
    
    const currentBuildingId = explicitId || selectedLocation.buildingId;
    const currentFloorId = explicitId || selectedLocation.floorId;
    const currentWingId = explicitId || selectedLocation.wingId;
    const currentSpaceId = explicitId || selectedLocation.spaceId;
    
    console.log('📌 ===== LOADING ACTIVITIES =====');
    console.log('📌 Assignment Level:', level);
    console.log('📌 Building ID:', currentBuildingId);
    console.log('📌 Floor ID:', currentFloorId);
    console.log('📌 Wing ID:', currentWingId);
    console.log('📌 Space ID:', currentSpaceId);
    console.log('📌 =================================');
    
    let hasRequiredLocation = false;
    let scope = ACTIVITY_SCOPES.PROJECT;
    let scopeId = null;
    let scopeName = 'project';
    
    if (level === 'building' && currentBuildingId) {
      hasRequiredLocation = true;
      scope = ACTIVITY_SCOPES.BUILDING;
      scopeId = currentBuildingId;
      scopeName = 'building';
    } else if (level === 'level' && currentFloorId) {
      hasRequiredLocation = true;
      scope = ACTIVITY_SCOPES.LEVEL;
      scopeId = currentFloorId;
      scopeName = 'level';
    } else if (level === 'wing' && currentWingId) {
      hasRequiredLocation = true;
      scope = ACTIVITY_SCOPES.WING;
      scopeId = currentWingId;
      scopeName = 'wing';
    } else if (level === 'space' && currentSpaceId) {
      hasRequiredLocation = true;
      scope = ACTIVITY_SCOPES.SPACE;
      scopeId = currentSpaceId;
      scopeName = 'space';
    }
    
    if (!hasRequiredLocation) {
      console.log('ℹ️ No valid location selected yet for', level);
      setFilteredActivities([]);
      return;
    }
    
    console.log(`🔍 Scope: ${scopeName}, Scope ID: ${scopeId}`);
    
    setIsActivityLoading(true);
    setFilteredActivities([]);
    setSelectedActivity(null);
    setShowCreateForm(false);
    
    try {
      const activitiesData = await getActivitiesByScope(
        selectedProject.projectId,
        scope,
        scopeId
      );
      
      console.log(`📦 Raw activities for ${scopeName} (${scopeId}):`, activitiesData);
      console.log(`📦 Raw activities count: ${activitiesData.length}`);
      
      const seen = new Set();
      const uniqueActivities = activitiesData.filter(a => {
        if (a.status === 'completed') return false;
        const key = `${a.name}-${a.scope || 'space'}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      console.log(`✅ Found ${uniqueActivities.length} unique ${scopeName} activities:`, uniqueActivities);
      
      setFilteredActivities(uniqueActivities);
      setIsActivityLoading(false);
      
    } catch (err) {
      console.error('❌ Error loading activities:', err);
      setError('Failed to load activities for this location');
      setIsActivityLoading(false);
    }
  };

  // Handle project selection
  const handleProjectSelect = async (projectId) => {
    const project = projects.find(p => p.projectId === projectId);
    setSelectedProject(project);
    setSelectedActivity(null);
    setActivities([]);
    setFilteredActivities([]);
    setTasks([]);
    setShowCreateForm(false);
    
    setAssignmentLevel('');
    setSelectedLocation({
      buildingId: '',
      floorId: '',
      wingId: '',
      spaceId: '',
    });
    setAvailableFloors([]);
    setAvailableWings([]);
    setAvailableSpaces([]);
    setLocationNames({ buildingName: '', floorName: '', wingName: '', spaceName: '' });
    
    setTaskForm({
      scopeType: 'level',
      selectedBuildingId: '',
      selectedFloorId: '',
      selectedWingId: '',
      selectedSpaceIds: [],
      teamName: '',
      teamMembers: [],
    });
    setBuildings([]);
    
    if (projectId) {
      await loadBuildings(projectId);
      await loadTasks(projectId);
    }
  };

  // Handle assignment level change
  const handleAssignmentLevelChange = (level) => {
    setAssignmentLevel(level);
    setSelectedLocation({
      buildingId: '',
      floorId: '',
      wingId: '',
      spaceId: '',
    });
    setAvailableFloors([]);
    setAvailableWings([]);
    setAvailableSpaces([]);
    setLocationNames({ buildingName: '', floorName: '', wingName: '', spaceName: '' });
    setFilteredActivities([]);
    setSelectedActivity(null);
    setShowCreateForm(false);
    
    setTaskForm(prev => ({
      ...prev,
      scopeType: level,
      selectedBuildingId: '',
      selectedFloorId: '',
      selectedWingId: '',
      selectedSpaceIds: [],
    }));
  };

  // Handle building change
  const handleBuildingChange = async (buildingId) => {
    console.log(`📌 Building changed to: ${buildingId}`);
    
    const building = buildings.find(b => b.buildingId === buildingId);
    setLocationNames(prev => ({ ...prev, buildingName: building?.name || '' }));
    
    setSelectedLocation({
      buildingId: buildingId,
      floorId: '',
      wingId: '',
      spaceId: '',
    });
    
    setAvailableFloors([]);
    setAvailableWings([]);
    setAvailableSpaces([]);
    setFilteredActivities([]);
    setSelectedActivity(null);
    setShowCreateForm(false);
    
    setTaskForm(prev => ({
      ...prev,
      selectedBuildingId: buildingId,
      selectedFloorId: '',
      selectedWingId: '',
      selectedSpaceIds: [],
    }));
    
    if (buildingId) {
      await loadFloorsForBuilding(buildingId);
    }
    
    if (buildingId && assignmentLevel === 'building') {
      await new Promise(resolve => setTimeout(resolve, 150));
      await loadActivitiesForAssignment(buildingId);
    }
  };

  // Handle floor change
  const handleFloorChange = async (floorId) => {
    console.log(`📌 Floor changed to: ${floorId}`);
    
    const floor = availableFloors.find(f => f.floorId === floorId);
    setLocationNames(prev => ({ ...prev, floorName: floor?.name || '' }));
    
    setSelectedLocation(prev => ({
      ...prev,
      floorId: floorId,
      wingId: '',
      spaceId: '',
    }));
    
    setAvailableWings([]);
    setAvailableSpaces([]);
    setFilteredActivities([]);
    setSelectedActivity(null);
    setShowCreateForm(false);
    
    setTaskForm(prev => ({
      ...prev,
      selectedFloorId: floorId,
      selectedWingId: '',
      selectedSpaceIds: [],
    }));
    
    if (floorId) {
      await loadWingsForFloor(floorId);
    }
    
    if (floorId && assignmentLevel === 'level') {
      await new Promise(resolve => setTimeout(resolve, 150));
      await loadActivitiesForAssignment(floorId);
    }
  };

  // Handle wing change
  const handleWingChange = async (wingId) => {
    console.log(`📌 Wing changed to: ${wingId}`);
    
    const wing = availableWings.find(w => w.wingId === wingId);
    setLocationNames(prev => ({ ...prev, wingName: wing?.name || '' }));
    
    setSelectedLocation(prev => ({
      ...prev,
      wingId: wingId,
      spaceId: '',
    }));
    
    setAvailableSpaces([]);
    setFilteredActivities([]);
    setSelectedActivity(null);
    setShowCreateForm(false);
    
    setTaskForm(prev => ({
      ...prev,
      selectedWingId: wingId,
      selectedSpaceIds: [],
    }));
    
    if (wingId) {
      await loadSpacesForWing(wingId);
    }
    
    if (wingId && assignmentLevel === 'wing') {
      await new Promise(resolve => setTimeout(resolve, 150));
      await loadActivitiesForAssignment(wingId);
    }
  };

  // Handle space change
  const handleSpaceChange = async (spaceId) => {
    console.log(`📌 Space changed to: ${spaceId}`);
    
    const space = availableSpaces.find(s => s.spaceId === spaceId);
    setLocationNames(prev => ({ ...prev, spaceName: space?.name || '' }));
    
    setSelectedLocation(prev => ({
      ...prev,
      spaceId: spaceId,
    }));
    
    setFilteredActivities([]);
    setSelectedActivity(null);
    setShowCreateForm(false);
    
    setTaskForm(prev => ({
      ...prev,
      selectedSpaceIds: spaceId ? [spaceId] : [],
    }));
    
    if (spaceId && assignmentLevel === 'space') {
      await new Promise(resolve => setTimeout(resolve, 150));
      await loadActivitiesForAssignment(spaceId);
    }
  };

  // Toggle team member selection
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

  // Create task
  const handleCreateTask = async () => {
    if (!selectedActivity) {
      setError('Please select an activity');
      return;
    }
    if (taskForm.teamMembers.length === 0) {
      setError('Please select at least one team member');
      return;
    }
    if (!taskForm.teamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    let scopeIds = [];
    if (assignmentLevel === 'building' && selectedLocation.buildingId) {
      const allSpaces = await getSpacesByBuilding(selectedLocation.buildingId);
      scopeIds = allSpaces.map(s => s.spaceId);
    } else if (assignmentLevel === 'level' && selectedLocation.floorId) {
      const allSpaces = await getSpacesByFloor(selectedLocation.floorId);
      scopeIds = allSpaces.map(s => s.spaceId);
    } else if (assignmentLevel === 'wing' && selectedLocation.wingId) {
      const allSpaces = await getSpacesByWing(selectedLocation.wingId);
      scopeIds = allSpaces.map(s => s.spaceId);
    } else if (assignmentLevel === 'space' && selectedLocation.spaceId) {
      scopeIds = [selectedLocation.spaceId];
    }

    if (scopeIds.length === 0) {
      setError('No spaces found in the selected scope');
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
        scopeIds: scopeIds,
        teamName: taskForm.teamName,
        teamMembers: taskForm.teamMembers,
      }, user?.uid);

      setSuccess('✅ Task created successfully!');
      setShowCreateForm(false);
      setTaskForm({
        scopeType: 'level',
        selectedBuildingId: '',
        selectedFloorId: '',
        selectedWingId: '',
        selectedSpaceIds: [],
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

  // Get location path display
  const getLocationPath = () => {
    const parts = [];
    if (locationNames.buildingName) parts.push(locationNames.buildingName);
    if (locationNames.floorName) parts.push(locationNames.floorName);
    if (locationNames.wingName) parts.push(locationNames.wingName);
    if (locationNames.spaceName) parts.push(locationNames.spaceName);
    return parts.length > 0 ? parts.join(' → ') : 'Select location...';
  };

  // Get level display name
  const getLevelDisplayName = () => {
    const map = {
      'building': 'Building',
      'level': 'Level',
      'wing': 'Wing',
      'space': 'Space',
    };
    return map[assignmentLevel] || '';
  };

  if (!canManageTasks) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Users size={48} className="text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Only Supervisors, Foremen, and Directors can manage tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Allocation</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Select what level to assign work to, then choose the location and activity
          </p>
        </div>
      </div>

      {/* Success/Error */}
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

      {/* Step 1: Project Selection */}
      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Step 1: Select Project</h3>
        <select
          value={selectedProject?.projectId || ''}
          onChange={(e) => handleProjectSelect(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select a project...</option>
          {projects.map(p => (
            <option key={p.projectId} value={p.projectId}>{p.name}</option>
          ))}
        </select>
      </Card>

      {selectedProject && (
        <>
          {/* Step 2: Choose Assignment Level */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Step 2: What level do you want to assign work to?</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  assignmentLevel === 'building'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleAssignmentLevelChange('building')}
              >
                <Building2 size={24} className="mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                <p className="font-medium text-gray-900 dark:text-white">Building</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assign building-wide work</p>
              </button>
              <button
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  assignmentLevel === 'level'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleAssignmentLevelChange('level')}
              >
                <Home size={24} className="mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                <p className="font-medium text-gray-900 dark:text-white">Level</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assign level-wide work</p>
              </button>
              <button
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  assignmentLevel === 'wing'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleAssignmentLevelChange('wing')}
              >
                <Layers size={24} className="mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                <p className="font-medium text-gray-900 dark:text-white">Wing</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assign wing-wide work</p>
              </button>
              <button
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  assignmentLevel === 'space'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleAssignmentLevelChange('space')}
              >
                <Grid size={24} className="mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                <p className="font-medium text-gray-900 dark:text-white">Space</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assign space-specific work</p>
              </button>
            </div>
          </Card>

          {/* Step 3: Select Location */}
          {assignmentLevel && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Step 3: Select {getLevelDisplayName()} Location
              </h3>
              <div className="space-y-4">
                {(assignmentLevel === 'level' || assignmentLevel === 'wing' || assignmentLevel === 'space') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Building
                    </label>
                    <select
                      value={selectedLocation.buildingId}
                      onChange={(e) => handleBuildingChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Building...</option>
                      {buildings.map(b => (
                        <option key={b.buildingId} value={b.buildingId}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {assignmentLevel === 'building' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Building
                    </label>
                    <select
                      value={selectedLocation.buildingId}
                      onChange={(e) => handleBuildingChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Building...</option>
                      {buildings.map(b => (
                        <option key={b.buildingId} value={b.buildingId}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(assignmentLevel === 'level' || assignmentLevel === 'wing' || assignmentLevel === 'space') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Level
                    </label>
                    <select
                      value={selectedLocation.floorId}
                      onChange={(e) => handleFloorChange(e.target.value)}
                      disabled={!selectedLocation.buildingId}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      <option value="">Select Level...</option>
                      {availableFloors.map(f => (
                        <option key={f.floorId} value={f.floorId}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {(assignmentLevel === 'wing' || assignmentLevel === 'space') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Wing
                    </label>
                    <select
                      value={selectedLocation.wingId}
                      onChange={(e) => handleWingChange(e.target.value)}
                      disabled={!selectedLocation.floorId}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      <option value="">Select Wing...</option>
                      {availableWings.map(w => (
                        <option key={w.wingId} value={w.wingId}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {assignmentLevel === 'space' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Space
                    </label>
                    <select
                      value={selectedLocation.spaceId}
                      onChange={(e) => handleSpaceChange(e.target.value)}
                      disabled={!selectedLocation.wingId}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      <option value="">Select Space...</option>
                      {availableSpaces.map(s => (
                        <option key={s.spaceId} value={s.spaceId}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              {/* Location Summary */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Selected Location:</span>
                  <span className="ml-2 text-primary-600 dark:text-primary-400 font-medium">
                    {selectedProject.name} → {getLocationPath()}
                  </span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {getLevelDisplayName()}-level activities will be shown
                </p>
              </div>
            </Card>
          )}

          {/* Step 4: Activity Selection */}
          {assignmentLevel && (
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Step 4: Select Activity to Assign
                {selectedLocation.buildingId && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                    ({getLevelDisplayName()} activities)
                  </span>
                )}
              </h3>
              {isActivityLoading ? (
                <div className="py-4 text-center">Loading activities...</div>
              ) : filteredActivities.length === 0 ? (
                <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                  {selectedLocation.buildingId 
                    ? `No ${getLevelDisplayName()} activities found for the selected location`
                    : 'Select a location to see available activities'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredActivities.map((activity) => (
                    <div
                      key={activity.activityId}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedActivity?.activityId === activity.activityId
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => {
                        setSelectedActivity(activity);
                        setShowCreateForm(true);
                      }}
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{activity.name}</p>
                        {activity.code && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{activity.code}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Scope: {activity.scope || 'Space'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Step 5: Create Task Form */}
          {showCreateForm && selectedActivity && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Step 5: Assign Team to: {selectedActivity.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Assign to a team for {getLevelDisplayName()} work
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedActivity(null);
                  }}
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Team Name                    </label>
                    <Input
                      placeholder="e.g., Team Alpha"
                      value={taskForm.teamName}
                      onChange={(e) => setTaskForm({ ...taskForm, teamName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Team Members
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {users.map((u) => (
                      <label
                        key={u.uid}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          taskForm.teamMembers?.includes(u.uid)
                            ? 'bg-primary-50 dark:bg-primary-950/30 border border-primary-300 dark:border-primary-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={taskForm.teamMembers?.includes(u.uid) || false}
                          onChange={() => toggleTeamMember(u.uid)}
                          className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {u.fullName || u.email}
                          <span className="text-xs text-gray-400 ml-1">
                            ({getRoleDisplayName(u.role)})
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Selected: {taskForm.teamMembers?.length || 0} members
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCreateForm(false);
                      setSelectedActivity(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreateTask}
                    loading={submitting}
                  >
                    Create Task
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Allocated Tasks List */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Allocated Tasks</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {tasks.length} tasks
              </span>
            </div>
            
            {tasksLoading ? (
              <div className="py-4 text-center">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className="py-4 text-center text-gray-500 dark:text-gray-400">
                No tasks allocated yet
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.taskId} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {task.activityName || 'Unknown Activity'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>Team: {task.teamName}</span>
                          <span>•</span>
                          <span>Scope: {task.scopeType}</span>
                          <span>•</span>
                          <span>{task.teamMembers?.length || 0} members</span>
                        </div>
                        {task.location && (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                            {task.location.projectName && (
                              <span className="flex items-center gap-1">
                                <Building2 size={12} />
                                {task.location.projectName}
                              </span>
                            )}
                            {task.location.buildingName && (
                              <span>• {task.location.buildingName}</span>
                            )}
                            {task.location.floorName && (
                              <span>• {task.location.floorName}</span>
                            )}
                            {task.location.wingName && (
                              <span>• {task.location.wingName}</span>
                            )}
                            <span>• {task.location.spaceCount || 0} spaces</span>
                          </div>
                        )}
                      </div>
                      <Badge className={getTaskStatusColor(task.status)}>
                        {getTaskStatusBadge(task.status)}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 max-w-[200px]">
                        <ProgressBar value={task.approvedProgress || 0} showLabel={false} />
                      </div>
                      <span className="text-sm font-medium">
                        {task.approvedProgress || 0}%
                      </span>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                      <span>📅 Created: {new Date(task.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span>🔄 Updated: {new Date(task.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default TaskAllocation;