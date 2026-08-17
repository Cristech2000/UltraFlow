import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { database } from '../lib/firebase'; // 🔥 NEW: Direct DB access
import { ref, get, query, orderByChild, equalTo } from 'firebase/database'; // 🔥 NEW: Server-side queries
import {
  FolderKanban,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Building2,
  ChevronRight,
  FileText,
  XCircle,
  Users
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjectsByOrganization } from '../services/projectService';
import { getTasksForUser } from '../services/taskService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';

function Dashboard() {
  const { user, userProfile, userRole, projectIds } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const [projectStats, setProjectStats] = useState({});
  // 🔥 NEW: We store ALL project data in memory so switching projects is instant
  const [allProjectsData, setAllProjectsData] = useState({});
  const [myTasks, setMyTasks] = useState([]);

  const isGlobalRole = ['hr', 'director'].includes(userRole);
  const isElectrician = userRole === 'electrician';
  const canApprove = ['director', 'supervisor', 'foreman'].includes(userRole);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        if (isElectrician) {
          const tasks = await getTasksForUser(user?.uid);
          if (isMounted) setMyTasks(tasks || []);
        } else {
          const orgId = userProfile?.organizationId || 'ultrapower';
          const allProjects = await getProjectsByOrganization(orgId);
          
          let accessibleProjects = isGlobalRole 
            ? allProjects 
            : allProjects.filter(p => (projectIds || []).includes(p.projectId));
          
          if (isMounted) {
            setProjects(accessibleProjects);
            if (accessibleProjects.length > 0 && !selectedProjectId) {
              setSelectedProjectId(accessibleProjects[0].projectId);
            }
          }

          const stats = {};
          const cache = {};

          // 🔥 MASSIVE PARALLEL FETCH: Load everything for all accessible projects instantly
          await Promise.all(accessibleProjects.map(async (proj) => {
            const pid = proj.projectId;
            
            const [bSnap, fSnap, wSnap, sSnap, aSnap, tSnap] = await Promise.all([
              get(query(ref(database, 'buildings'), orderByChild('projectId'), equalTo(pid))),
              get(query(ref(database, 'floors'), orderByChild('projectId'), equalTo(pid))),
              get(query(ref(database, 'wings'), orderByChild('projectId'), equalTo(pid))),
              get(query(ref(database, 'spaces'), orderByChild('projectId'), equalTo(pid))),
              get(query(ref(database, 'activities'), orderByChild('projectId'), equalTo(pid))),
              get(query(ref(database, 'tasks'), orderByChild('projectId'), equalTo(pid)))
            ]);

            const bldgs = bSnap.exists() ? Object.values(bSnap.val()) : [];
            const floors = fSnap.exists() ? Object.values(fSnap.val()) : [];
            const wings = wSnap.exists() ? Object.values(wSnap.val()) : [];
            const spaces = sSnap.exists() ? Object.values(sSnap.val()) : [];
            const acts = aSnap.exists() ? Object.values(aSnap.val()) : [];
            const tasks = tSnap.exists() ? Object.values(tSnap.val()) : [];

            // 🔥 HASH MAPS: Pre-sort everything into buckets so JavaScript doesn't do millions of calculations
            const spacesByWing = {};
            spaces.forEach(s => { if(!spacesByWing[s.wingId]) spacesByWing[s.wingId] = []; spacesByWing[s.wingId].push(s); });

            const wingsByFloor = {};
            wings.forEach(w => { if(!wingsByFloor[w.floorId]) wingsByFloor[w.floorId] = []; wingsByFloor[w.floorId].push(w); });

            const floorsByBldg = {};
            floors.forEach(f => { if(!floorsByBldg[f.buildingId]) floorsByBldg[f.buildingId] = []; floorsByBldg[f.buildingId].push(f); });

            const actsBySpace = {};
            const actsByWing = {};
            const actsByFloor = {};
            const actsByBldg = {};
            const actsByProj = [];

            acts.forEach(a => {
              if (a.spaceId) { if (!actsBySpace[a.spaceId]) actsBySpace[a.spaceId] = []; actsBySpace[a.spaceId].push(a); }
              else if (a.wingId) { if (!actsByWing[a.wingId]) actsByWing[a.wingId] = []; actsByWing[a.wingId].push(a); }
              else if (a.floorId) { if (!actsByFloor[a.floorId]) actsByFloor[a.floorId] = []; actsByFloor[a.floorId].push(a); }
              else if (a.buildingId) { if (!actsByBldg[a.buildingId]) actsByBldg[a.buildingId] = []; actsByBldg[a.buildingId].push(a); }
              else if (a.projectId) { actsByProj.push(a); }
            });

            // 🔥 BOTTOM-UP MATH: Instant aggregate calculation using the buckets
            const buildingProgress = {};
            let projTotal = 0;
            let projBldgCount = 0;

            bldgs.forEach(b => {
              let bldgTotal = 0;
              let bldgItemCount = 0;
              const bFloors = floorsByBldg[b.buildingId] || [];
              
              bFloors.forEach(f => {
                let floorTotal = 0;
                let floorItemCount = 0;
                const fWings = wingsByFloor[f.floorId] || [];
                
                fWings.forEach(w => {
                  let wingTotal = 0;
                  let wingItemCount = 0;
                  const wSpaces = spacesByWing[w.wingId] || [];
                  
                  wSpaces.forEach(s => {
                    const sActs = actsBySpace[s.spaceId] || [];
                    let sProg = 0;
                    if (sActs.length > 0) {
                      sProg = sActs.reduce((sum, a) => sum + Number(a.progress || 0), 0) / sActs.length;
                    }
                    wingTotal += sProg;
                    wingItemCount++;
                  });

                  const wActs = actsByWing[w.wingId] || [];
                  wActs.forEach(wa => { wingTotal += Number(wa.progress || 0); wingItemCount++; });

                  const finalWingProg = wingItemCount > 0 ? (wingTotal / wingItemCount) : 0;
                  floorTotal += finalWingProg;
                  floorItemCount++;
                });

                const fActs = actsByFloor[f.floorId] || [];
                fActs.forEach(fa => { floorTotal += Number(fa.progress || 0); floorItemCount++; });

                const finalFloorProg = floorItemCount > 0 ? (floorTotal / floorItemCount) : 0;
                bldgTotal += finalFloorProg;
                bldgItemCount++;
              });

              const bActs = actsByBldg[b.buildingId] || [];
              bActs.forEach(ba => { bldgTotal += Number(ba.progress || 0); bldgItemCount++; });

              const finalBldgProg = bldgItemCount > 0 ? (bldgTotal / bldgItemCount) : 0;
              buildingProgress[b.buildingId] = Math.round(finalBldgProg);

              projTotal += finalBldgProg;
              projBldgCount++;
            });

            actsByProj.forEach(pa => {
              projTotal += Number(pa.progress || 0);
              projBldgCount++;
            });

            const projectProgress = projBldgCount > 0 ? Math.round(projTotal / projBldgCount) : 0;

            stats[pid] = {
              progress: projectProgress,
              buildingProgress,
              activityCount: acts.length,
              completedCount: acts.filter(a => a.status === 'completed').length
            };

            cache[pid] = {
              buildings: bldgs,
              activities: acts,
              tasks: tasks,
              buildingProgress
            };
          }));

          if (isMounted) {
            setProjectStats(stats);
            setAllProjectsData(cache);
          }
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => { isMounted = false; };
  }, [userProfile, userRole, projectIds, isGlobalRole, isElectrician, user?.uid]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ELECTRICIAN DASHBOARD VIEW
  // ============================================================================
  if (isElectrician) {
    const inProgress = myTasks.filter(t => t.status === 'in_progress' || t.status === 'pending');
    const rejected = myTasks.filter(t => t.status === 'rejected');
    const pendingApproval = myTasks.filter(t => t.status === 'submitted');

    return (
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">My Workspace</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">Welcome back. Here is your current work summary.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">To Do / In Progress</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{inProgress.length}</p>
              </div>
              <Activity className="text-blue-300 dark:text-blue-700 w-8 h-8 md:w-10 md:h-10" />
            </div>
          </Card>
          
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Requires Revision</p>
                <p className="text-2xl md:text-3xl font-bold text-red-700 dark:text-red-300 mt-1">{rejected.length}</p>
              </div>
              <AlertTriangle className="text-red-300 dark:text-red-700 w-8 h-8 md:w-10 md:h-10" />
            </div>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending Approval</p>
                <p className="text-2xl md:text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">{pendingApproval.length}</p>
              </div>
              <Clock className="text-yellow-300 dark:text-yellow-700 w-8 h-8 md:w-10 md:h-10" />
            </div>
          </Card>
        </div>

        <Card title="Action Required">
          {rejected.length === 0 && inProgress.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm md:text-base">You are all caught up!</div>
          ) : (
            <div className="space-y-3">
              {[...rejected, ...inProgress].slice(0, 5).map(task => (
                <div key={task.taskId} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-sm md:text-base text-gray-900 dark:text-white truncate">{task.activityName || 'Task'}</h4>
                    <p className="text-xs text-gray-500">Assigned: {new Date(task.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => navigate(`/tasks/${task.taskId}`)}>Update</Button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" className="w-full text-sm md:text-base" onClick={() => navigate('/my-tasks')}>View All My Tasks</Button>
          </div>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // MANAGEMENT & DOCUMENTATION DASHBOARD VIEW
  // ============================================================================
  
  const activeProj = projects.find(p => p.projectId === selectedProjectId);
  
  // 🔥 Pull data instantly from the pre-calculated memory cache!
  const activeProjectData = allProjectsData[selectedProjectId] || { buildings: [], activities: [], tasks: [], buildingProgress: {} };
  const { buildings, activities, tasks, buildingProgress } = activeProjectData;

  const pendingTasks = tasks.filter(t => t.status === 'submitted');
  const rejectedTasks = tasks.filter(t => t.status === 'rejected');

  const totalPortfolioProgress = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + (projectStats[p.projectId]?.progress || 0), 0) / projects.length)
    : 0;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Management Dashboard</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">Portfolio overview and documentation health</p>
        </div>
        
        {projects.length > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Context:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 font-medium text-sm"
            >
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* PORTFOLIO OVERVIEW */}
      {(isGlobalRole || projects.length > 1) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-none">
            <p className="text-primary-100 text-xs md:text-sm font-medium">Portfolio Progress</p>
            <div className="flex items-end gap-2 md:gap-3 mt-1">
              <span className="text-3xl md:text-4xl font-bold">{totalPortfolioProgress}%</span>
              <TrendingUp className="text-primary-200 mb-1 w-5 h-5 md:w-6 md:h-6" />
            </div>
          </Card>
          <Card>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Accessible Projects</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1">{projects.length}</p>
          </Card>
          <Card>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Global Pending Approvals</p>
            <p className="text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {projects.reduce((acc, p) => {
                const projTasks = allProjectsData[p.projectId]?.tasks || [];
                return acc + projTasks.filter(t => t.status === 'submitted').length;
              }, 0)}
            </p>
          </Card>
          <Card>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Documentation Health</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-green-100 text-green-700 text-xs py-0.5 px-2">Healthy</Badge>
            </div>
          </Card>
        </div>
      )}

      {/* PROJECT COMPARISON WIDGET */}
      {projects.length > 1 && (
        <Card title="Project Comparison">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {projects.map(p => (
              <div 
                key={p.projectId} 
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedProjectId === p.projectId ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                onClick={() => setSelectedProjectId(p.projectId)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium md:font-semibold text-gray-900 dark:text-white truncate pr-2 text-sm md:text-base">{p.name}</h4>
                  <span className="text-xs md:text-sm font-bold text-primary-600">{projectStats[p.projectId]?.progress || 0}%</span>
                </div>
                <ProgressBar value={projectStats[p.projectId]?.progress || 0} showLabel={false} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <hr className="border-gray-200 dark:border-gray-800" />

      {/* ACTIVE PROJECT DEEP DIVE */}
      {activeProj && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FolderKanban className="text-primary-500 w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
              <span className="truncate">{activeProj.name} Context</span>
            </h2>
            <Button variant="outline" className="w-full sm:w-auto text-sm" onClick={() => navigate(`/projects/${activeProj.projectId}`)}>
              Open Project Workspace
            </Button>
          </div>

          {/* PROJECT EXCEPTIONS & ATTENTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <Card className="border-l-4 border-yellow-500 p-3 md:p-4">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="text-yellow-500 w-4 h-4 md:w-5 md:h-5" />
                  Requires Approval ({pendingTasks.length})
                </h3>
                {canApprove && (
                  <Link to="/pending-approvals" className="text-xs md:text-sm text-primary-600 hover:underline">View All</Link>
                )}
              </div>
              {pendingTasks.length === 0 ? (
                <p className="text-xs md:text-sm text-gray-500">No tasks currently awaiting approval.</p>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.slice(0, 3).map(task => (
                    <div key={task.taskId} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded border border-yellow-100 dark:border-yellow-800">
                      <span className="text-xs md:text-sm font-medium text-gray-800 dark:text-gray-200 truncate pr-2">{task.activityName}</span>
                      <Button size="sm" variant="ghost" className="text-xs px-2 py-1" onClick={() => navigate(`/tasks/${task.taskId}`)}>Review</Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border-l-4 border-red-500 p-3 md:p-4">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <XCircle className="text-red-500 w-4 h-4 md:w-5 md:h-5" />
                  Rejected / Attention ({rejectedTasks.length})
                </h3>
              </div>
              {rejectedTasks.length === 0 ? (
                <p className="text-xs md:text-sm text-gray-500">No rejected tasks requiring attention.</p>
              ) : (
                <div className="space-y-2">
                  {rejectedTasks.slice(0, 3).map(task => (
                    <div key={task.taskId} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-800">
                      <span className="text-xs md:text-sm font-medium text-gray-800 dark:text-gray-200 truncate pr-2">{task.activityName}</span>
                      <Button size="sm" variant="ghost" className="text-xs px-2 py-1" onClick={() => navigate(`/tasks/${task.taskId}`)}>Investigate</Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* BUILDING BREAKDOWN */}
          <Card title="Building Progress Breakdown">
            {buildings.length === 0 ? (
              <p className="text-xs md:text-sm text-gray-500">No buildings defined for this project.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-2">
                {buildings.map(bldg => (
                  <div key={bldg.buildingId} className="p-3 md:p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2 truncate pr-2">
                        <Building2 className="text-gray-400 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                        <span className="truncate">{bldg.name}</span>
                      </h4>
                      <span className="text-sm md:text-base font-bold text-gray-900 dark:text-white">{buildingProgress[bldg.buildingId] || 0}%</span>
                    </div>
                    <ProgressBar value={buildingProgress[bldg.buildingId] || 0} showLabel={false} />
                    <div className="mt-2 md:mt-3 text-right">
                      <Link to={`/projects/${activeProj.projectId}/buildings/${bldg.buildingId}`} className="text-xs text-primary-600 font-medium hover:underline">
                        Drill Down →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* DOCUMENTATION & TASK WORKFLOW SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <Card title="Activity Status Summary">
              <div className="space-y-2 md:space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Tracked Activities</span>
                  <span className="text-sm md:text-base font-semibold">{activities.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Completed (100%)</span>
                  <span className="text-sm md:text-base font-semibold text-green-600">{activities.filter(a => a.status === 'completed').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">In Progress</span>
                  <span className="text-sm md:text-base font-semibold text-blue-600">{activities.filter(a => a.status === 'in_progress').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Not Started</span>
                  <span className="text-sm md:text-base font-semibold text-gray-500">{activities.filter(a => a.status === 'not_started').length}</span>
                </div>
              </div>
            </Card>

            <Card title="Recent Task Workflow">
              <div className="space-y-3 md:space-y-4">
                {tasks.slice(0, 4).map(task => (
                  <div key={task.taskId} className="flex items-start gap-2 md:gap-3">
                    <div className={`p-1 md:p-1.5 rounded-full mt-0.5 flex-shrink-0 ${
                      task.status === 'approved' ? 'bg-green-100 text-green-600' :
                      task.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      task.status === 'submitted' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {task.status === 'approved' ? <CheckCircle size={12} className="md:w-3.5 md:h-3.5" /> :
                       task.status === 'rejected' ? <XCircle size={12} className="md:w-3.5 md:h-3.5" /> :
                       task.status === 'submitted' ? <Clock size={12} className="md:w-3.5 md:h-3.5" /> :
                       <Activity size={12} className="md:w-3.5 md:h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate">{task.activityName}</p>
                      <p className="text-[10px] md:text-xs text-gray-500 capitalize truncate">Status: {task.status.replace('_', ' ')} • Scope: {task.scopeType}</p>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-xs md:text-sm text-gray-500">No task history found.</p>}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;