import React, { useState, useEffect } from 'react';
import { Calendar, Plus, X, Trash2, Clock, MapPin, Archive, RotateCcw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjectsByOrganization } from '../services/projectService';
import { getBuildingsByProject, getFloorsByBuilding, getWingsByFloor, getSpacesByWing } from '../services/spaceService';
import { getProjectTimetables, createTimetable, deleteTimetable, archiveTimetable, restoreTimetable, addActivityToTimetable, removeActivityFromTimetable } from '../services/timelineService';
import { getActivitiesByProject } from '../services/activityService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Timeline() {
  const { userProfile, userRole, projectIds } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archive'
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState('');
  const [actualActivities, setActualActivities] = useState([]);
  
  const [buildings, setBuildings] = useState([]);
  const [levels, setLevels] = useState([]);
  const [wings, setWings] = useState([]);
  const [spaces, setSpaces] = useState([]);

  const [showCreateTimetable, setShowCreateTimetable] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  
  const [newTb, setNewTb] = useState({ title: '', startDate: '' });
  const [newPlan, setNewPlan] = useState({ day: 'Monday', activityName: '', buildingId: '', floorId: '', wingId: '', spaceId: '', targetProgress: '' });

  const isGlobalRole = ['hr', 'director'].includes(userRole);
  const canManage = ['director', 'hr', 'supervisor', 'foreman', 'documentation_assistant'].includes(userRole);

  useEffect(() => {
    const loadProjects = async () => {
      const orgId = userProfile?.organizationId || 'ultrapower';
      const allProjects = await getProjectsByOrganization(orgId);
      const accessible = isGlobalRole ? allProjects : allProjects.filter(p => (projectIds || []).includes(p.projectId));
      setProjects(accessible);
      if (accessible.length > 0) setSelectedProject(accessible[0].projectId);
    };
    loadProjects();
  }, [userProfile, isGlobalRole, projectIds]);

  const loadTimetables = async (projId, currentTab) => {
    const tbs = await getProjectTimetables(projId);
    setTimetables(tbs);
    
    const filtered = tbs.filter(t => currentTab === 'active' ? !t.isArchived : t.isArchived);
    setSelectedTimetableId(filtered.length > 0 ? filtered[0].timetableId : '');
  };

  useEffect(() => {
    if (selectedProject) {
      loadTimetables(selectedProject, activeTab);
      getActivitiesByProject(selectedProject).then(setActualActivities);
      getBuildingsByProject(selectedProject).then(setBuildings);
    }
  }, [selectedProject]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const filtered = timetables.filter(t => tab === 'active' ? !t.isArchived : t.isArchived);
    setSelectedTimetableId(filtered.length > 0 ? filtered[0].timetableId : '');
  };

  useEffect(() => {
    if (newPlan.buildingId) { getFloorsByBuilding(newPlan.buildingId).then(setLevels); } 
    else { setLevels([]); }
  }, [newPlan.buildingId]);

  useEffect(() => {
    if (newPlan.floorId) { getWingsByFloor(newPlan.floorId).then(setWings); } 
    else { setWings([]); }
  }, [newPlan.floorId]);

  useEffect(() => {
    if (newPlan.wingId) { getSpacesByWing(newPlan.wingId).then(setSpaces); } 
    else { setSpaces([]); }
  }, [newPlan.wingId]);

  const availableActivities = actualActivities.filter(a => {
    if (newPlan.spaceId) return ['space'].includes(a.scope);
    if (newPlan.wingId) return ['wing', 'space'].includes(a.scope);
    if (newPlan.floorId) return ['level', 'wing', 'space'].includes(a.scope);
    if (newPlan.buildingId) return ['building', 'level', 'wing', 'space'].includes(a.scope);
    return false;
  });

  const uniqueActivityNames = Array.from(new Set(availableActivities.map(a => a.name))).sort();

  const handleCreateTimetable = async () => {
    if (!newTb.title || !newTb.startDate) return alert('Title and Start Date required');
    const dateObj = new Date(newTb.startDate);
    if (dateObj.getDay() !== 1) return alert('Start date must be a Monday.');

    await createTimetable({ ...newTb, projectId: selectedProject }, userProfile.uid);
    setShowCreateTimetable(false);
    setNewTb({ title: '', startDate: '' });
    loadTimetables(selectedProject, activeTab);
  };

  const handleArchiveTimetable = async () => {
    if (window.confirm("Archive this timetable? You won't be able to add new activities to it.")) {
      await archiveTimetable(selectedTimetableId);
      loadTimetables(selectedProject, activeTab);
    }
  };

  // 🔥 NEW: Restore Workflow
  const handleRestoreTimetable = async () => {
    if (window.confirm("Restore this timetable to Active status?")) {
      await restoreTimetable(selectedTimetableId);
      
      // Automatically switch user back to the active tab to see the restored timetable
      setActiveTab('active');
      const updatedTbs = await getProjectTimetables(selectedProject);
      setTimetables(updatedTbs);
      const filtered = updatedTbs.filter(t => !t.isArchived);
      
      // Set the newly restored timetable as the actively viewed one
      setSelectedTimetableId(selectedTimetableId); 
    }
  };

  const handleDeleteTimetable = async () => {
    if (window.confirm("⚠️ PERMANENTLY delete this timetable? This cannot be undone.")) {
      await deleteTimetable(selectedTimetableId);
      loadTimetables(selectedProject, activeTab);
    }
  };

  const handleAddActivity = async () => {
    if (!newPlan.activityName || !newPlan.targetProgress || !newPlan.buildingId) return alert('Please fill all required fields.');
    
    const bName = buildings.find(b => b.buildingId === newPlan.buildingId)?.name || '';
    const lName = levels.find(l => l.floorId === newPlan.floorId)?.name || '';
    const wName = wings.find(w => w.wingId === newPlan.wingId)?.name || '';
    const sName = spaces.find(s => s.spaceId === newPlan.spaceId)?.name || '';
    const locString = [bName, lName, wName, sName].filter(Boolean).join(' > ');

    const entryData = {
      activityName: newPlan.activityName,
      locationDesc: locString,
      targetProgress: parseInt(newPlan.targetProgress),
      buildingId: newPlan.buildingId || '',
      floorId: newPlan.floorId || '',
      wingId: newPlan.wingId || '',
      spaceId: newPlan.spaceId || ''
    };

    await addActivityToTimetable(selectedTimetableId, newPlan.day, entryData);
    setShowAddActivity(false);
    setNewPlan({ day: 'Monday', activityName: '', buildingId: '', floorId: '', wingId: '', spaceId: '', targetProgress: '' });
    loadTimetables(selectedProject, activeTab);
  };

  const getActualProgress = (entry) => {
    const matchingActs = actualActivities.filter(a => {
      if (a.name.toLowerCase() !== entry.activityName.toLowerCase()) return false;
      const matchBuilding = (a.buildingId || '') === (entry.buildingId || '');
      const matchFloor = (a.floorId || '') === (entry.floorId || '');
      const matchWing = (a.wingId || '') === (entry.wingId || '');
      const matchSpace = (a.spaceId || '') === (entry.spaceId || '');
      return matchBuilding && matchFloor && matchWing && matchSpace;
    });
    return matchingActs.length ? Math.round(matchingActs.reduce((acc, act) => acc + (act.progress || 0), 0) / matchingActs.length) : 0;
  };

  const displayedTimetables = timetables.filter(t => activeTab === 'active' ? !t.isArchived : t.isArchived);
  const activeTimetable = displayedTimetables.find(t => t.timetableId === selectedTimetableId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Calendar className="text-primary-500" size={32} />
            Timetables
          </h1>
          <p className="text-gray-500 mt-1">Manage weekly schedules and task allocation.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            {projects.map(p => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
          </select>
          {canManage && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreateTimetable(true)}>
              New Timetable
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
        <button 
          className={`pb-3 px-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'active' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => handleTabChange('active')}
        >
          <Clock size={16} /> Active Timetables
        </button>
        <button 
          className={`pb-3 px-2 font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'archive' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => handleTabChange('archive')}
        >
          <Archive size={16} /> Archives
        </button>
      </div>

      {displayedTimetables.length === 0 ? (
        <Card className="py-12 text-center">
          {activeTab === 'active' ? (
            <>
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Active Timetables</h2>
              <p className="text-gray-500 mt-2 mb-4">Create a new weekly timetable to start planning.</p>
              {canManage && <Button variant="primary" onClick={() => setShowCreateTimetable(true)}>Create Timetable</Button>}
            </>
          ) : (
            <>
              <Archive size={48} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Archived Timetables</h2>
              <p className="text-gray-500 mt-2">Past timetables will appear here once archived.</p>
            </>
          )}
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          {/* Header Controls */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <select 
                value={selectedTimetableId}
                onChange={(e) => setSelectedTimetableId(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-lg font-bold text-primary-700 dark:text-primary-400"
              >
                {displayedTimetables.map(t => (
                  <option key={t.timetableId} value={t.timetableId}>{t.title} ({t.startDate} to {t.endDate})</option>
                ))}
              </select>
            </div>
            {canManage && (
              <div className="flex gap-2">
                {activeTab === 'active' ? (
                  <>
                    <Button variant="outline" icon={<Plus size={16} />} onClick={() => setShowAddActivity(true)}>Add Activity</Button>
                    <Button variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-50" icon={<Archive size={16} />} onClick={handleArchiveTimetable}>Archive Timetable</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" icon={<RotateCcw size={16} />} onClick={handleRestoreTimetable}>Restore Timetable</Button>
                    <Button variant="danger" icon={<Trash2 size={16} />} onClick={handleDeleteTimetable}>Delete Permanently</Button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="w-32 px-4 py-4 font-bold border-b border-gray-200 dark:border-gray-700 border-r text-center uppercase tracking-wider">Day</th>
                  <th className="px-4 py-4 font-bold border-b border-gray-200 dark:border-gray-700">Scheduled Activities & Locations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {activeTimetable && DAYS_OF_WEEK.map(day => (
                  <tr key={day} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                    <td className="px-4 py-6 border-r border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white text-center align-top bg-gray-50/50 dark:bg-gray-800/30">
                      {day}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap gap-4">
                        {!activeTimetable.entries?.[day] || Object.keys(activeTimetable.entries[day]).length === 0 ? (
                          <span className="text-gray-400 italic text-sm py-2">No activities scheduled</span>
                        ) : (
                          Object.entries(activeTimetable.entries[day]).map(([entryId, entry]) => {
                            const actualProgress = getActualProgress(entry);
                            return (
                              <div key={entryId} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm w-full sm:w-[300px] relative group">
                                {canManage && activeTab === 'active' && (
                                  <button 
                                    onClick={() => removeActivityFromTimetable(activeTimetable.timetableId, day, entryId).then(() => loadTimetables(selectedProject, activeTab))}
                                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                                <h4 className="font-bold text-gray-900 dark:text-white mb-1 pr-6">{entry.activityName}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1 mb-3">
                                  <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                                  {entry.locationDesc}
                                </p>
                                <div className="flex justify-between items-center text-sm border-t border-gray-100 dark:border-gray-700 pt-2">
                                  <span className="font-medium text-blue-600">Target: {entry.targetProgress}%</span>
                                  <span className={`font-bold ${actualProgress >= entry.targetProgress ? 'text-green-600' : 'text-yellow-600'}`}>
                                    Actual: {actualProgress}%
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE MODAL */}
      {showCreateTimetable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">New Weekly Timetable</h2>
              <button onClick={() => setShowCreateTimetable(false)}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <Input label="Timetable Title (e.g., Week 33 Civil Works)" value={newTb.title} onChange={e => setNewTb({...newTb, title: e.target.value})} />
              <div>
                <label className="block text-sm font-medium mb-1">Start Date (Must be a Monday)</label>
                <input 
                  type="date" 
                  value={newTb.startDate} 
                  onChange={e => setNewTb({...newTb, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <Button variant="primary" className="w-full" onClick={handleCreateTimetable}>Create Timetable</Button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ACTIVITY MODAL */}
      {showAddActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4 sticky top-0 bg-white dark:bg-gray-900 pb-2 z-10">
              <h2 className="text-xl font-bold">Add Activity to Schedule</h2>
              <button onClick={() => setShowAddActivity(false)}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium mb-1">Day of the Week</label>
                <select value={newPlan.day} onChange={e => setNewPlan({...newPlan, day: e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                  {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-2 border-l-2 border-primary-500 pl-3">
                <label className="block text-sm font-bold text-primary-700 dark:text-primary-400">1. Select Location</label>
                
                <select value={newPlan.buildingId} onChange={e => setNewPlan({...newPlan, buildingId: e.target.value, floorId: '', wingId: '', spaceId: '', activityName: ''})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                  <option value="">Select Building...</option>
                  {buildings.map(b => <option key={b.buildingId} value={b.buildingId}>{b.name}</option>)}
                </select>
                
                {newPlan.buildingId && (
                  <select value={newPlan.floorId} onChange={e => setNewPlan({...newPlan, floorId: e.target.value, wingId: '', spaceId: '', activityName: ''})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    <option value="">Select Level (Optional)...</option>
                    {levels.map(l => <option key={l.floorId} value={l.floorId}>{l.name}</option>)}
                  </select>
                )}
                
                {newPlan.floorId && (
                  <select value={newPlan.wingId} onChange={e => setNewPlan({...newPlan, wingId: e.target.value, spaceId: '', activityName: ''})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    <option value="">Select Wing (Optional)...</option>
                    {wings.map(w => <option key={w.wingId} value={w.wingId}>{w.name}</option>)}
                  </select>
                )}

                {newPlan.wingId && (
                  <select value={newPlan.spaceId} onChange={e => setNewPlan({...newPlan, spaceId: e.target.value, activityName: ''})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    <option value="">Select Space (Optional)...</option>
                    {spaces.map(s => <option key={s.spaceId} value={s.spaceId}>{s.name}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-primary-700 dark:text-primary-400 mb-1">2. Select Activity</label>
                <select 
                  value={newPlan.activityName} 
                  onChange={e => setNewPlan({...newPlan, activityName: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  disabled={!newPlan.buildingId}
                >
                  <option value="">{newPlan.buildingId ? '-- Choose Activity --' : '-- Select Location First --'}</option>
                  {uniqueActivityNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {newPlan.buildingId && uniqueActivityNames.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">No activities match this location scope.</p>
                )}
              </div>

              <Input label="Target Progress %" type="number" min="0" max="100" value={newPlan.targetProgress} onChange={e => setNewPlan({...newPlan, targetProgress: e.target.value})} />
              
              <Button variant="primary" className="w-full mt-2" onClick={handleAddActivity}>Add to {newPlan.day}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}