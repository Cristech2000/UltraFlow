import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { database } from '../lib/firebase';
import { ref, get, query, orderByChild, equalTo, update, push } from 'firebase/database';
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
  Copy,
  CheckSquare,
  ListChecks,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getBuilding, getFloorsByBuilding, deleteBuilding, createFloor, bulkCloneFloor } from '../services/spaceService';
import { ACTIVITY_SCOPES, createActivity, updateActivityProgress, updateActivityStatus, deleteActivity } from '../services/activityService';
import { getProject } from '../services/projectService';
import { calculateBuildingProgress, calculateWingProgress, calculateLevelProgress, calculateSpaceProgress } from '../utils/progressUtils';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
import Input from '../components/common/Input';
import { STATUS_DISPLAY_NAMES, getStatusColor } from '../constants/status';
import ProjectGuard from '../components/common/ProjectGuard';

const naturalSort = (a, b) => {
  const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  if (timeDiff !== 0) return timeDiff;
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
};

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
  
  // 🔥 MASS MANAGER STATES
  const [allBuildingActivities, setAllBuildingActivities] = useState([]);
  const [allWings, setAllWings] = useState([]);
  const [allSpaces, setAllSpaces] = useState([]);
  
  const [bulkScope, setBulkScope] = useState('building'); 
  const [bulkLocationId, setBulkLocationId] = useState(buildingId);
  const [bulkSearchTerm, setBulkSearchTerm] = useState('');
  const [groupRepetitive, setGroupRepetitive] = useState(true); // 🔥 ADDED: Toggle state for Grouping
  
  const [selectedActIds, setSelectedActIds] = useState([]);
  const [bulkProgress, setBulkProgress] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [activityContext, setActivityContext] = useState({ scope: 'building', id: buildingId });

  const [showFloorForm, setShowFloorForm] = useState(false);
  const [floorForm, setFloorForm] = useState({ name: '', levelNumber: 0, code: '', status: 'active' });
  const [submittingFloor, setSubmittingFloor] = useState(false);
  const [floorFormError, setFloorFormError] = useState('');

  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({ name: '', code: '', description: '', targetChildren: 'none' });
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [activityFormError, setActivityFormError] = useState('');

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloningFloor, setCloningFloor] = useState(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneConfig, setCloneConfig] = useState({ count: 1, prefix: '', startNumber: 1 });

  const canEdit = ['director', 'engineer', 'supervisor'].includes(userRole);
  const canDelete = ['director'].includes(userRole);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        buildingData,
        projectData,
        floorsData,
        wingsSnap,
        spacesSnap,
        actsSnap
      ] = await Promise.all([
        getBuilding(buildingId),
        getProject(projectId),
        getFloorsByBuilding(buildingId),
        get(query(ref(database, 'wings'), orderByChild('buildingId'), equalTo(buildingId))),
        get(query(ref(database, 'spaces'), orderByChild('buildingId'), equalTo(buildingId))),
        get(query(ref(database, 'activities'), orderByChild('buildingId'), equalTo(buildingId)))
      ]);

      if (!buildingData) {
        setError('Building not found');
        setLoading(false);
        return;
      }

      setBuilding(buildingData);
      if (projectData) setProject(projectData);

      const allWingsList = wingsSnap.exists() ? Object.values(wingsSnap.val()) : [];
      const allSpacesList = spacesSnap.exists() ? Object.values(spacesSnap.val()) : [];
      const allActsList = actsSnap.exists() ? Object.values(actsSnap.val()) : [];

      setAllWings(allWingsList.sort(naturalSort));
      setAllSpaces(allSpacesList.sort(naturalSort));
      setAllBuildingActivities(allActsList);

      const wingsByFloor = {};
      allWingsList.forEach(w => {
        if (!wingsByFloor[w.floorId]) wingsByFloor[w.floorId] = [];
        wingsByFloor[w.floorId].push(w);
      });

      const spacesByWing = {};
      allSpacesList.forEach(s => {
        if (!spacesByWing[s.wingId]) spacesByWing[s.wingId] = [];
        spacesByWing[s.wingId].push(s);
      });

      const actsBySpace = {};
      const actsByWing = {};
      const actsByFloor = {};
      const buildingActs = [];

      allActsList.forEach(a => {
        if (a.spaceId) {
          if (!actsBySpace[a.spaceId]) actsBySpace[a.spaceId] = [];
          actsBySpace[a.spaceId].push(a);
        } else if (a.wingId) {
          if (!actsByWing[a.wingId]) actsByWing[a.wingId] = [];
          actsByWing[a.wingId].push(a);
        } else if (a.floorId) {
          if (!actsByFloor[a.floorId]) actsByFloor[a.floorId] = [];
          actsByFloor[a.floorId].push(a);
        } else if (a.buildingId) {
          buildingActs.push(a);
        }
      });

      const floorsWithProgress = floorsData.map(floor => {
        const floorWings = (wingsByFloor[floor.floorId] || []).sort(naturalSort);

        const wingsWithProgress = floorWings.map(wing => {
          const wingSpaces = (spacesByWing[wing.wingId] || []).sort(naturalSort);
          const spacesWithProgress = wingSpaces.map(space => {
            const spaceActs = actsBySpace[space.spaceId] || [];
            return { ...space, progress: calculateSpaceProgress(spaceActs) };
          });
          const wingActs = actsByWing[wing.wingId] || [];
          return { ...wing, progress: calculateWingProgress(spacesWithProgress, wingActs), spaces: spacesWithProgress, wingActivities: wingActs };
        });

        const floorActs = actsByFloor[floor.floorId] || [];
        return { ...floor, progress: calculateLevelProgress(wingsWithProgress, floorActs), wings: wingsWithProgress, floorActivities: floorActs };
      });

      setFloors(floorsWithProgress);
      setActivities(buildingActs);
    } catch (err) {
      console.error('Error loading building:', err);
      setError('Failed to load building. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (buildingId) loadData();
  }, [buildingId]);

  // ==========================================
  // 🔥 MASS MANAGER: Intelligent Grouping Logic
  // ==========================================
  let rawBulkActs = [];
  
  if (bulkScope === 'building') {
    rawBulkActs = allBuildingActivities;
  } else if (bulkScope === 'level') {
    const levelWings = allWings.filter(w => w.floorId === bulkLocationId).map(w => w.wingId);
    const levelSpaces = allSpaces.filter(s => s.floorId === bulkLocationId).map(s => s.spaceId);
    rawBulkActs = allBuildingActivities.filter(a => a.floorId === bulkLocationId || levelWings.includes(a.wingId) || levelSpaces.includes(a.spaceId));
  } else if (bulkScope === 'wing') {
    const wingSpaces = allSpaces.filter(s => s.wingId === bulkLocationId).map(s => s.spaceId);
    rawBulkActs = allBuildingActivities.filter(a => a.wingId === bulkLocationId || wingSpaces.includes(a.spaceId));
  } else if (bulkScope === 'space') {
    rawBulkActs = allBuildingActivities.filter(a => a.spaceId === bulkLocationId);
  }

  const filteredBulkActivities = rawBulkActs.filter(a => {
    if (!bulkSearchTerm) return true;
    return a.name.toLowerCase().includes(bulkSearchTerm.toLowerCase()) || (a.code && a.code.toLowerCase().includes(bulkSearchTerm.toLowerCase()));
  }).sort((a,b) => (a.order || 0) - (b.order || 0));

  // 🔥 THIS IS THE MAGIC: Grouping the activities by name
  const displayActivities = useMemo(() => {
    if (!groupRepetitive) {
      return filteredBulkActivities.map(act => ({
        isGroup: false, id: act.activityId, name: act.name, ids: [act.activityId], act: act
      }));
    }

    const groups = {};
    filteredBulkActivities.forEach(act => {
      const key = (act.name || '').toLowerCase().trim();
      if (!groups[key]) groups[key] = { name: act.name, ids: [], acts: [] };
      groups[key].ids.push(act.activityId);
      groups[key].acts.push(act);
    });

    return Object.values(groups).map(g => ({
      isGroup: true,
      id: g.name,
      name: g.name,
      ids: g.ids,
      acts: g.acts,
      count: g.ids.length,
      progress: Math.round(g.acts.reduce((sum, a) => sum + (Number(a.progress) || 0), 0) / g.acts.length)
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredBulkActivities, groupRepetitive]);

  const getLocationText = (act) => {
    if (act.spaceId) {
      const s = allSpaces.find(x => x.spaceId === act.spaceId);
      const f = floors.find(x => x.floorId === act.floorId);
      return `${f ? f.name + ' > ' : ''}${s ? s.name : 'Space'}`;
    }
    if (act.wingId) {
      const w = allWings.find(x => x.wingId === act.wingId);
      const f = floors.find(x => x.floorId === act.floorId);
      return `${f ? f.name + ' > ' : ''}${w ? w.name : 'Wing'}`;
    }
    if (act.floorId) {
      const f = floors.find(x => x.floorId === act.floorId);
      return `${f ? f.name : 'Level'}`;
    }
    return 'Building-Wide';
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedActIds(filteredBulkActivities.map(a => a.activityId));
    else setSelectedActIds([]);
  };

  const handleApplyBulkUpdate = async () => {
    if (selectedActIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      const updates = {};
      selectedActIds.forEach(id => {
        if (bulkProgress !== '') updates[`activities/${id}/progress`] = Number(bulkProgress);
        if (bulkStatus !== '') updates[`activities/${id}/status`] = bulkStatus;
        updates[`activities/${id}/updatedAt`] = new Date().toISOString();
        updates[`activities/${id}/updatedBy`] = user?.uid || '';
      });
      
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
        await loadData();
        setSelectedActIds([]);
        setBulkProgress('');
        setBulkStatus('');
      }
    } catch (err) {
      console.error("Bulk update failed", err);
      alert('Failed to apply bulk updates');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedActIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedActIds.length} activities?`)) return;
    setIsBulkUpdating(true);
    try {
      const updates = {};
      selectedActIds.forEach(id => { updates[`activities/${id}`] = null; });
      await update(ref(database), updates);
      await loadData();
      setSelectedActIds([]);
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert('Failed to delete activities');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const openAddActivityModal = (scope, id) => {
    setActivityContext({ scope, id });
    setShowActivityForm(true);
  };

  const handleCreateActivity = async () => {
    if (!activityForm.name.trim()) {
      setActivityFormError('Activity name is required');
      return;
    }
    setSubmittingActivity(true);
    setActivityFormError('');
    try {
      let targets = []; 
      
      let baseFloorId = null, baseWingId = null, baseSpaceId = null;
      if (activityContext.scope === 'level') baseFloorId = activityContext.id;
      else if (activityContext.scope === 'wing') { 
        baseWingId = activityContext.id; 
        const w = allWings.find(x => x.wingId === baseWingId);
        if (w) baseFloorId = w.floorId;
      }
      else if (activityContext.scope === 'space') { 
        baseSpaceId = activityContext.id; 
        const s = allSpaces.find(x => x.spaceId === baseSpaceId);
        if (s) { baseWingId = s.wingId; baseFloorId = s.floorId; }
      }

      if (activityForm.targetChildren === 'none') {
        const targetScope = ACTIVITY_SCOPES[activityContext.scope.toUpperCase()];
        targets.push({ floorId: baseFloorId, wingId: baseWingId, spaceId: baseSpaceId, scope: targetScope });
      } 
      else if (activityForm.targetChildren === 'spaces') {
        let childSpaces = [];
        if (activityContext.scope === 'level') childSpaces = allSpaces.filter(s => s.floorId === activityContext.id);
        else if (activityContext.scope === 'wing') childSpaces = allSpaces.filter(s => s.wingId === activityContext.id);
        else if (activityContext.scope === 'building') childSpaces = allSpaces;
        
        childSpaces.forEach(s => targets.push({ floorId: s.floorId, wingId: s.wingId, spaceId: s.spaceId, scope: ACTIVITY_SCOPES.SPACE }));
      }
      else if (activityForm.targetChildren === 'wings') {
        let childWings = [];
        if (activityContext.scope === 'level') childWings = allWings.filter(w => w.floorId === activityContext.id);
        else if (activityContext.scope === 'building') childWings = allWings;

        childWings.forEach(w => targets.push({ floorId: w.floorId, wingId: w.wingId, spaceId: null, scope: ACTIVITY_SCOPES.WING }));
      }
      else if (activityForm.targetChildren === 'levels') {
        floors.forEach(f => targets.push({ floorId: f.floorId, wingId: null, spaceId: null, scope: ACTIVITY_SCOPES.LEVEL }));
      }

      if (targets.length === 0) {
        setActivityFormError('No locations found to assign this activity to.');
        setSubmittingActivity(false);
        return;
      }

      const updates = {};
      const baseTime = Date.now();
      
      targets.forEach((t, i) => {
        const actId = push(ref(database, 'activities')).key;
        updates[`activities/${actId}`] = {
          activityId: actId, projectId, buildingId, floorId: t.floorId || null, wingId: t.wingId || null, spaceId: t.spaceId || null,
          scope: t.scope, name: activityForm.name, code: activityForm.code || '', description: activityForm.description || '',
          order: filteredBulkActivities.length + i + 1, status: 'not_started', progress: 0,
          createdAt: new Date(baseTime + i).toISOString(), updatedAt: new Date(baseTime + i).toISOString(), createdBy: user?.uid || ''
        };
      });

      await update(ref(database), updates);
      
      setShowActivityForm(false);
      setActivityForm({ name: '', code: '', description: '', targetChildren: 'none' });
      await loadData();
    } catch (err) {
      setActivityFormError(err.message || 'Failed to create activity');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const handleDelete = async () => { /* ... existing ... */
    setDeleting(true);
    try { await deleteBuilding(buildingId); navigate(`/projects/${projectId}`); } 
    catch (err) { setError('Failed to delete building'); } 
    finally { setDeleting(false); setShowDeleteModal(false); }
  };

  const handleCreateFloor = async () => { /* ... existing ... */
    if (!floorForm.name.trim()) { setFloorFormError('Level name is required'); return; }
    setSubmittingFloor(true); setFloorFormError('');
    try { await createFloor(floorForm, buildingId, projectId, user?.uid); setShowFloorForm(false); setFloorForm({ name: '', levelNumber: 0, code: '', status: 'active' }); await loadData(); } 
    catch (err) { setFloorFormError(err.message || 'Failed to create level'); }
    finally { setSubmittingFloor(false); }
  };

  const openCloneModal = (floor) => { /* ... existing ... */
    setCloningFloor(floor);
    const match = floor.name.match(/^(.*?)(\d+)$/);
    setCloneConfig({ count: 1, prefix: match ? match[1] : floor.name + ' ', startNumber: match ? parseInt(match[2], 10) + 1 : 1 });
    setShowCloneModal(true);
  };

  const handleCloneFloor = async () => { /* ... existing ... */
    if (cloneConfig.count < 1 || cloneConfig.count > 100) { setFloorFormError('Enter a number between 1 and 100'); return; }
    setIsCloning(true); setFloorFormError('');
    try { await bulkCloneFloor(cloningFloor.floorId, cloneConfig, user?.uid); setShowCloneModal(false); setCloningFloor(null); await loadData(); } 
    catch (err) { setFloorFormError(err.message || 'Failed to clone level'); }
    finally { setIsCloning(false); }
  };

  const handleUpdateProgress = async (activityId, progress) => {
    try { await updateActivityProgress(activityId, progress, user?.uid); await loadData(); setEditingActivity(null); }
    catch (err) { setError('Failed to update progress'); }
  };

  const handleUpdateStatus = async (activityId, status) => {
    try { await updateActivityStatus(activityId, status, user?.uid); await loadData(); }
    catch (err) { setError('Failed to update status'); }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try { await deleteActivity(activityId); await loadData(); }
    catch (err) { setError('Failed to delete activity'); }
  };

  const buildingProgress = calculateBuildingProgress(floors, activities);

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    return <span className={`text-xs px-3 py-1 rounded-full font-medium ${color}`}>{STATUS_DISPLAY_NAMES[status] || status}</span>;
  };

  const getActivityStatusDisplay = (status) => {
    const map = { 'not_started': 'Not Started', 'in_progress': 'In Progress', 'completed': 'Completed', 'on_hold': 'On Hold', 'blocked': 'Blocked' };
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

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (error || !building) return <div className="min-h-[60vh] flex items-center justify-center text-center"><Building2 size={48} className="text-red-500 mx-auto" /><p className="mt-4">{error || 'Building not found'}</p><Button variant="primary" className="mt-4" onClick={() => navigate(`/projects/${projectId}`)}>Back to Project</Button></div>;

  return (
    <ProjectGuard projectId={projectId}>
      <div className="space-y-6">
        {/* Header Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link to="/projects" className="hover:text-primary-500 transition-colors">Projects</Link> <ChevronRight size={14} />
          <Link to={`/projects/${projectId}`} className="hover:text-primary-500 transition-colors">{project?.name || 'Project'}</Link> <ChevronRight size={14} />
          <span className="text-gray-900 dark:text-white font-medium">{building.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Building2 size={28} className="text-primary-500" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{building.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{project?.name || 'Project'} • {building.code || 'No code'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              {getStatusBadge(building.status)}
              <span className="text-sm text-gray-500 dark:text-gray-400">{floors.length} Levels</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{activities.length} Building Activities</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)} icon={<ArrowLeft size={16} />}>Back</Button>
            {canEdit && <Button variant="accent" size="sm" icon={<FileText size={16} />} onClick={() => openAddActivityModal('building', buildingId)}>Add Activity</Button>}
            {canDelete && <Button variant="danger" size="sm" icon={<Trash2 size={16} />} onClick={() => setShowDeleteModal(true)}>Delete</Button>}
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
              <span className="text-xs text-gray-400 dark:text-gray-500">(Cumulative from {floors.length} levels + {activities.length} building activities)</span>
            </div>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{buildingProgress}%</span>
          </div>
          <ProgressBar value={buildingProgress} />
        </Card>

        {/* ==================================================== */}
        {/* 🔥 THE NEW MASS ACTIVITY MANAGER                     */}
        {/* ==================================================== */}
        {canEdit && (
          <Card className="border-primary-200 dark:border-primary-900/50">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
              <ListChecks className="text-primary-500" size={20} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mass Activity Manager</h2>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="w-full lg:w-48">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Scope</label>
                <select 
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  value={bulkScope}
                  onChange={(e) => {
                    setBulkScope(e.target.value);
                    setBulkLocationId(e.target.value === 'building' ? buildingId : '');
                    setSelectedActIds([]);
                  }}
                >
                  <option value="building">Building-Wide</option>
                  <option value="level">Level</option>
                  <option value="wing">Wing</option>
                  <option value="space">Space</option>
                </select>
              </div>

              {bulkScope !== 'building' && (
                <div className="flex-[1.5]">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Target Location</label>
                  <select 
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={bulkLocationId}
                    onChange={(e) => { setBulkLocationId(e.target.value); setSelectedActIds([]); }}
                  >
                    <option value="">-- Select {bulkScope} --</option>
                    {bulkScope === 'level' && floors.map(f => <option key={f.floorId} value={f.floorId}>{f.name}</option>)}
                    {bulkScope === 'wing' && allWings.map(w => {
                      const f = floors.find(fl => fl.floorId === w.floorId);
                      return <option key={w.wingId} value={w.wingId}>{f ? `${f.name} - ` : ''}{w.name}</option>;
                    })}
                    {bulkScope === 'space' && allSpaces.map(s => {
                      const w = allWings.find(wg => wg.wingId === s.wingId);
                      const f = floors.find(fl => fl.floorId === s.floorId);
                      return <option key={s.spaceId} value={s.spaceId}>{f ? `${f.name} ` : ''}{w ? `(${w.name}) ` : ''}- {s.name}</option>;
                    })}
                  </select>
                </div>
              )}

              <div className="flex-[2]">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search Activities</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" placeholder="e.g. CU Installation" 
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={bulkSearchTerm} onChange={e => setBulkSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <Button 
                  variant="primary" size="sm" 
                  disabled={!bulkLocationId} 
                  onClick={() => openAddActivityModal(bulkScope, bulkLocationId)}
                  icon={<Plus size={16} />}
                >
                  New Activity
                </Button>
              </div>
            </div>

            {/* 🔥 NEW: Group Repetitive Toggle */}
            <div className="mb-3 px-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer w-max hover:text-primary-600 transition-colors">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  checked={groupRepetitive}
                  onChange={e => { setGroupRepetitive(e.target.checked); setSelectedActIds([]); }}
                />
                <Filter size={16} className="text-gray-400" />
                <span className="font-medium">Intelligent Grouping (Merge identical activities)</span>
              </label>
            </div>

            {bulkLocationId && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 pr-4 border-r border-gray-200 dark:border-gray-700">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-primary-600 rounded border-gray-300"
                      checked={selectedActIds.length > 0 && selectedActIds.length === filteredBulkActivities.length}
                      onChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {selectedActIds.length} Selected
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <input 
                      type="number" min="0" max="100" placeholder="Prog %" 
                      className="w-20 text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      value={bulkProgress} onChange={e => setBulkProgress(e.target.value)}
                    />
                    <select 
                      className="text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                    >
                      <option value="">Status...</option>
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    <Button variant="accent" size="sm" onClick={handleApplyBulkUpdate} loading={isBulkUpdating} disabled={selectedActIds.length === 0 || (bulkProgress === '' && bulkStatus === '')}>
                      Update
                    </Button>
                    {canDelete && (
                      <Button variant="danger" size="sm" onClick={handleBulkDelete} loading={isBulkUpdating} disabled={selectedActIds.length === 0} icon={<Trash2 size={14} />}>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/30 p-2 space-y-1">
                  {displayActivities.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-6">No activities match your selection.</p>
                  ) : (
                    displayActivities.map(item => {
                      const isAllSelected = item.ids.length > 0 && item.ids.every(id => selectedActIds.includes(id));
                      const isSomeSelected = item.ids.some(id => selectedActIds.includes(id));

                      return (
                        <label key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-primary-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-primary-600 rounded border-gray-300"
                              checked={isAllSelected}
                              ref={el => { if (el) el.indeterminate = !isAllSelected && isSomeSelected; }}
                              onChange={() => {
                                if (isAllSelected) setSelectedActIds(prev => prev.filter(id => !item.ids.includes(id)));
                                else setSelectedActIds(prev => Array.from(new Set([...prev, ...item.ids])));
                              }}
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                                {item.isGroup && item.count > 1 && (
                                  <Badge size="sm" className="bg-primary-50 text-primary-700 border-primary-200">Across {item.count} locations</Badge>
                                )}
                              </div>
                              {!item.isGroup && <span className="text-xs text-gray-500 dark:text-gray-400">{getLocationText(item.act)}</span>}
                            </div>
                          </div>
                          <div className="flex-1" />
                          <div className="flex items-center gap-3">
                            {!item.isGroup && (
                              <Badge size="sm" className={getActivityStatusColor(item.act.status)}>{getActivityStatusDisplay(item.act.status)}</Badge>
                            )}
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-12 text-right">
                              {item.isGroup ? `~${item.progress}%` : `${item.act.progress || 0}%`}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Existing Levels Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Levels</h2>
            {canEdit && <Button variant="ghost" size="sm" icon={<Plus size={16} />} onClick={() => setShowFloorForm(true)}>Add Level</Button>}
          </div>

          {floors.length === 0 ? (
            <Card>
              <div className="py-8 text-center">
                <Layers size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No levels yet</p>
                {canEdit && <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowFloorForm(true)}>Create the first level template</Button>}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {floors.map((floor) => (
                <FloorCard 
                  key={floor.floorId} floor={floor} projectIds={{projectId, buildingId}}
                  getStatusBadge={getStatusBadge} onDelete={loadData} onClone={() => openCloneModal(floor)}
                  canEdit={canEdit} canDelete={canDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Deep Clone Modal */}
        {showCloneModal && cloningFloor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Deep Clone Level</h2>
                <button onClick={() => { setShowCloneModal(false); setFloorFormError(''); }}><X size={20} className="text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                {floorFormError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{floorFormError}</div>}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800">Template: <strong>{cloningFloor.name}</strong></p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Prefix</label>
                    <input type="text" value={cloneConfig.prefix} onChange={(e) => setCloneConfig({ ...cloneConfig, prefix: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Start Number</label>
                    <input type="number" value={cloneConfig.startNumber} onChange={(e) => setCloneConfig({ ...cloneConfig, startNumber: parseInt(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">How many levels to stack?</label>
                  <input type="number" min="1" max="100" value={cloneConfig.count} onChange={(e) => setCloneConfig({ ...cloneConfig, count: parseInt(e.target.value) || 1 })} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-900 dark:text-white">Preview: </span>
                  {cloneConfig.prefix}{cloneConfig.startNumber}
                  {cloneConfig.count > 1 && (
                    <span> ... to {cloneConfig.prefix}{cloneConfig.startNumber + cloneConfig.count - 1}</span>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="ghost" onClick={() => setShowCloneModal(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleCloneFloor} loading={isCloning} icon={<Copy size={16} />}>Stack Levels</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Level Form */}
        {showFloorForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Level</h2>
                <button onClick={() => { setShowFloorForm(false); setFloorFormError(''); }}><X size={20} className="text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                {floorFormError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{floorFormError}</div>}
                <Input label="Level Name" placeholder="e.g., Level 3" value={floorForm.name} onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })} required />
                <Input label="Level Number" type="number" placeholder="e.g., 3" value={floorForm.levelNumber} onChange={(e) => setFloorForm({ ...floorForm, levelNumber: parseInt(e.target.value) || 0 })} />
                <Input label="Level Code" placeholder="e.g., FL-03" value={floorForm.code} onChange={(e) => setFloorForm({ ...floorForm, code: e.target.value })} />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Status</label>
                  <select value={floorForm.status} onChange={(e) => setFloorForm({ ...floorForm, status: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                    <option value="active">Active</option>
                    <option value="planned">Planned</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="ghost" onClick={() => setShowFloorForm(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleCreateFloor} loading={submittingFloor}>Create</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 ADD ACTIVITY FORM (Upgraded for Mass Creation) */}
        {showActivityForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Activity</h2>
                <button onClick={() => { setShowActivityForm(false); setActivityFormError(''); }}><X size={20} className="text-gray-500" /></button>
              </div>
              <div className="space-y-4">
                {activityFormError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{activityFormError}</div>}
                
                <Input label="Activity Name" placeholder="e.g., CU Installation" value={activityForm.name} onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })} required />
                <Input label="Activity Code" placeholder="e.g., ELEC-01" value={activityForm.code} onChange={(e) => setActivityForm({ ...activityForm, code: e.target.value })} />
                <Input label="Description" placeholder="Brief description" value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Apply this activity to:</label>
                  <select 
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    value={activityForm.targetChildren}
                    onChange={(e) => setActivityForm({ ...activityForm, targetChildren: e.target.value })}
                  >
                    <option value="none">Just this {activityContext.scope}</option>
                    {['building', 'level', 'wing'].includes(activityContext.scope) && (
                      <option value="spaces">Every Space inside this {activityContext.scope}</option>
                    )}
                    {['building', 'level'].includes(activityContext.scope) && (
                      <option value="wings">Every Wing inside this {activityContext.scope}</option>
                    )}
                    {activityContext.scope === 'building' && (
                      <option value="levels">Every Level inside this Building</option>
                    )}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button variant="ghost" onClick={() => setShowActivityForm(false)}>Cancel</Button>
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
              <p className="text-gray-600 dark:text-gray-300">Are you sure you want to delete <span className="font-semibold">{building.name}</span>? This will permanently remove all levels, wings, spaces, and activities.</p>
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

function ActivityItem({ activity, isEditing, onEdit, onCancelEdit, onUpdateProgress, onUpdateStatus, onDelete, canEdit, canDelete, getActivityStatusDisplay, getActivityStatusColor, getStatusIcon }) {
  const [progress, setProgress] = useState(activity.progress || 0);
  const handleSaveProgress = () => { if (progress < 0 || progress > 100) return alert('0 to 100 only'); onUpdateProgress(progress); };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">{activity.order ? `${activity.order}.` : ''} {activity.name}</span>
            {activity.code && <span className="text-xs text-gray-400 dark:text-gray-500">{activity.code}</span>}
            <Badge size="sm" className={getActivityStatusColor(activity.status)}>
              <span className="flex items-center gap-1">{getStatusIcon(activity.status)}{getActivityStatusDisplay(activity.status)}</span>
            </Badge>
          </div>
          {activity.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.description}</p>}
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="100" value={progress} onChange={(e) => setProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))} className="w-16 px-2 py-1 border rounded-lg text-center text-sm" />
              <span className="text-sm text-gray-500">%</span>
              <Button size="sm" variant="primary" onClick={handleSaveProgress}>Save</Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit}>Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 min-w-[120px]">
              <div className="w-20"><ProgressBar value={activity.progress || 0} showLabel={false} /></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[40px]">{activity.progress || 0}%</span>
              {canEdit && <button onClick={onEdit} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><Edit2 size={14} className="text-gray-400 hover:text-primary-500" /></button>}
              {canDelete && <button onClick={onDelete} className="p-1 rounded-lg hover:bg-red-100 transition-colors"><XCircle size={14} className="text-gray-400 hover:text-red-500" /></button>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function FloorCard({ floor, projectIds, getStatusBadge, onDelete, onClone, canEdit, canDelete }) {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { name, code, status, levelNumber, floorId } = floor;
  const { projectId, buildingId } = projectIds;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { deleteFloor } = await import('../services/spaceService');
      await deleteFloor(floorId); onDelete();
    } catch (err) { console.error('Error deleting level:', err); }
    finally { setDeleting(false); setShowDeleteModal(false); }
  };

  return (
    <>
      <Card className="cursor-pointer hover:shadow-lg transition-shadow relative group" onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}/floors/${floorId}`)}>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Order: {levelNumber}</span>
                {code && <span className="text-xs text-gray-500">{code}</span>}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            {getStatusBadge(status)}
            <div className="flex items-center text-sm text-primary-600 dark:text-primary-400">Open <ChevronRight size={16} className="ml-1" /></div>
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-all">
            {canEdit && <button className="p-1.5 rounded-lg bg-white shadow hover:bg-primary-50 text-primary-500" onClick={(e) => { e.stopPropagation(); onClone(); }}><Copy size={16} /></button>}
            {canDelete && <button className="p-1.5 rounded-lg bg-white shadow hover:bg-red-50 text-red-500" onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}><Trash2 size={16} /></button>}
          </div>
        </div>
      </Card>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4"><AlertTriangle size={24} className="text-red-500" /><h2 className="text-xl font-bold">Delete Level</h2></div>
            <p className="text-gray-600 mb-6">Delete <span className="font-semibold">{name}</span>?</p>
            <div className="flex justify-end gap-3"><Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button><Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button></div>
          </div>
        </div>
      )}
    </>
  );
}

export default BuildingDetail;