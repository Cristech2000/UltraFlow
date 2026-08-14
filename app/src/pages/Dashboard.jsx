import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { getActivitiesByProject } from '../services/activityService';
import { getTasksByProject, getTasksForUser } from '../services/taskService';
import { getBuildingsByProject, getFloorsByBuilding, getWingsByFloor, getSpacesByWing } from '../services/spaceService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';

// ============================================================================
// FORENSIC PROGRESS AGGREGATOR (With heavy Console Logging)
// ============================================================================
async function calculateAccurateProgress(projectId, acts) {
  console.log(`\n======================================================`);
  console.log(`📊 STARTING DASHBOARD MATH FOR PROJECT: ${projectId}`);
  console.log(`======================================================`);
  
  const bldgs = await getBuildingsByProject(projectId);
  const buildingProgress = {};
  
  let projTotal = 0;
  let bldgCount = 0;

  for (const b of bldgs) {
    console.log(`\n🏢 Analyzing Building: ${b.name}`);
    const floors = await getFloorsByBuilding(b.buildingId);
    let bldgItemsSum = 0;
    let bldgItemsCount = 0;
    const floorLogs = [];

    for (const f of floors) {
      const wings = await getWingsByFloor(f.floorId);
      let floorItemsSum = 0;
      let floorItemsCount = 0;

      for (const w of wings) {
        const spaces = await getSpacesByWing(w.wingId);
        let wingItemsSum = 0;
        let wingItemsCount = 0;

        // 1. Space Progress
        for (const s of spaces) {
          const spaceActs = acts.filter(a => a.spaceId === s.spaceId);
          let spaceProg = 0;
          if (spaceActs.length > 0) {
            spaceProg = spaceActs.reduce((sum, a) => sum + Number(a.progress || 0), 0) / spaceActs.length;
          }
          wingItemsSum += spaceProg;
          wingItemsCount++;
        }

        // 2. Wing-wide Progress
        const wingActs = acts.filter(a => a.wingId === w.wingId && (!a.spaceId || a.scope === 'wing'));
        for (const wa of wingActs) {
          wingItemsSum += Number(wa.progress || 0);
          wingItemsCount++;
        }

        const finalWingProg = wingItemsCount > 0 ? (wingItemsSum / wingItemsCount) : 0;
        floorItemsSum += finalWingProg;
        floorItemsCount++;
      }

      // 3. Level-wide Progress
      const floorActs = acts.filter(a => a.floorId === f.floorId && (!a.wingId || a.scope === 'level'));
      for (const fa of floorActs) {
        floorItemsSum += Number(fa.progress || 0);
        floorItemsCount++;
      }

      const finalFloorProg = floorItemsCount > 0 ? (floorItemsSum / floorItemsCount) : 0;
      bldgItemsSum += finalFloorProg;
      bldgItemsCount++;
      
      floorLogs.push(`Level: ${f.name} = ${finalFloorProg.toFixed(2)}%`);
    }

    // 4. Building-wide Progress
    const bldgActs = acts.filter(a => a.buildingId === b.buildingId && (!a.floorId || a.scope === 'building'));
    for (const ba of bldgActs) {
      bldgItemsSum += Number(ba.progress || 0);
      bldgItemsCount++;
    }

    const finalBldgProg = bldgItemsCount > 0 ? (bldgItemsSum / bldgItemsCount) : 0;
    
    // FORENSIC LOG OUTPUT FOR THIS BUILDING
    console.log(`   🔸 Levels Found: ${floors.length}`);
    floorLogs.forEach(log => console.log(`      - ${log}`));
    console.log(`   🔸 Building-Wide Activities Found: ${bldgActs.length}`);
    bldgActs.forEach(ba => console.log(`      - ${ba.name}: ${ba.progress || 0}%`));
    
    console.log(`   🧮 MATH: (${bldgItemsSum.toFixed(2)} total progress) / (${bldgItemsCount} denominator items)`);
    console.log(`   🎯 RESULT: RAW = ${finalBldgProg}, ROUNDED = ${Math.round(finalBldgProg)}%`);
    
    buildingProgress[b.buildingId] = Math.round(finalBldgProg);
    projTotal += finalBldgProg;
    bldgCount++;
  }

  // 5. Project-wide Progress
  const projActs = acts.filter(a => a.projectId === projectId && !a.buildingId);
  for (const pa of projActs) {
    projTotal += Number(pa.progress || 0);
    bldgCount++;
  }

  const projectProgress = bldgCount > 0 ? Math.round(projTotal / bldgCount) : 0;
  console.log(`\n✅ FINAL DASHBOARD PROGRESS: ${projectProgress}%`);
  console.log(`======================================================\n`);

  return { projectProgress, buildingProgress };
}

function Dashboard() {
  const { user, userProfile, userRole, projectIds } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // Dashboard Data States
  const [projectStats, setProjectStats] = useState({});
  const [activeProjectData, setActiveProjectData] = useState({
    buildings: [],
    activities: [],
    tasks: [],
    buildingProgress: {}
  });

  // Electrician Data State
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
          // ==========================================
          // ELECTRICIAN WORKFLOW
          // ==========================================
          const tasks = await getTasksForUser(user?.uid);
          if (isMounted) setMyTasks(tasks || []);
        } else {
          // ==========================================
          // MANAGEMENT & DOCS WORKFLOW
          // ==========================================
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

          // Compute accurate hierarchical portfolio stats
          const stats = {};
          await Promise.all(accessibleProjects.map(async (proj) => {
            const acts = await getActivitiesByProject(proj.projectId);
            const { projectProgress, buildingProgress } = await calculateAccurateProgress(proj.projectId, acts);
            
            stats[proj.projectId] = {
              progress: projectProgress,
              buildingProgress: buildingProgress,
              activityCount: acts.length,
              completedCount: acts.filter(a => a.status === 'completed').length
            };
          }));

          if (isMounted) setProjectStats(stats);
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

  // Load deep data for the currently selected project in the dashboard
  useEffect(() => {
    let isMounted = true;
    const loadActiveProject = async () => {
      if (!selectedProjectId || isElectrician) return;
      
      try {
        const [bldgs, acts, tsks] = await Promise.all([
          getBuildingsByProject(selectedProjectId),
          getActivitiesByProject(selectedProjectId),
          getTasksByProject(selectedProjectId)
        ]);

        if (!isMounted) return;

        // Pull the accurately computed progress from projectStats
        let bldgProg = projectStats[selectedProjectId]?.buildingProgress || {};

        // Fallback: Just in case the stats effect is still resolving
        if (Object.keys(bldgProg).length === 0 && bldgs.length > 0) {
          const { buildingProgress } = await calculateAccurateProgress(selectedProjectId, acts);
          bldgProg = buildingProgress;
        }

        setActiveProjectData({
          buildings: bldgs || [],
          activities: acts || [],
          tasks: tsks || [],
          buildingProgress: bldgProg
        });
      } catch (err) {
        console.error('Error loading active project details:', err);
      }
    };

    loadActiveProject();
    return () => { isMounted = false; };
  }, [selectedProjectId, isElectrician, projectStats]);

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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Workspace</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back. Here is your current work summary.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">To Do / In Progress</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{inProgress.length}</p>
              </div>
              <Activity size={32} className="text-blue-300 dark:text-blue-700" />
            </div>
          </Card>
          
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Requires Revision</p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300 mt-1">{rejected.length}</p>
              </div>
              <AlertTriangle size={32} className="text-red-300 dark:text-red-700" />
            </div>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">{pendingApproval.length}</p>
              </div>
              <Clock size={32} className="text-yellow-300 dark:text-yellow-700" />
            </div>
          </Card>
        </div>

        <Card title="Action Required">
          {rejected.length === 0 && inProgress.length === 0 ? (
            <div className="text-center py-6 text-gray-500">You are all caught up!</div>
          ) : (
            <div className="space-y-3">
              {[...rejected, ...inProgress].slice(0, 5).map(task => (
                <div key={task.taskId} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{task.activityName || 'Task'}</h4>
                    <p className="text-xs text-gray-500">Assigned: {new Date(task.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => navigate(`/tasks/${task.taskId}`)}>Update</Button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" className="w-full" onClick={() => navigate('/my-tasks')}>View All My Tasks</Button>
          </div>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // MANAGEMENT & DOCUMENTATION DASHBOARD VIEW
  // ============================================================================
  
  const activeProj = projects.find(p => p.projectId === selectedProjectId);
  const { buildings, activities, tasks, buildingProgress } = activeProjectData;

  // Exceptions & Health Metrics
  const pendingTasks = tasks.filter(t => t.status === 'submitted');
  const rejectedTasks = tasks.filter(t => t.status === 'rejected');

  // Overall Portfolio Progress
  const totalPortfolioProgress = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + (projectStats[p.projectId]?.progress || 0), 0) / projects.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Management Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Portfolio overview and documentation health</p>
        </div>
        
        {projects.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Context:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 font-medium"
            >
              {projects.map(p => (
                <option key={p.projectId} value={p.projectId}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* PORTFOLIO OVERVIEW (Visible if viewing all projects) */}
      {(isGlobalRole || projects.length > 1) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-none">
            <p className="text-primary-100 text-sm font-medium">Portfolio Progress</p>
            <div className="flex items-end gap-3 mt-1">
              <span className="text-4xl font-bold">{totalPortfolioProgress}%</span>
              <TrendingUp size={24} className="text-primary-200 mb-1" />
            </div>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Accessible Projects</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{projects.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Global Pending Approvals</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {projects.reduce((acc, p) => acc + tasks.filter(t => t.projectId === p.projectId && t.status === 'submitted').length, 0)}
            </p>
          </Card>
          <Card>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Documentation Health</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-green-100 text-green-700">Healthy</Badge>
            </div>
          </Card>
        </div>
      )}

      {/* PROJECT COMPARISON WIDGET */}
      {projects.length > 1 && (
        <Card title="Project Comparison">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <div 
                key={p.projectId} 
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedProjectId === p.projectId ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                onClick={() => setSelectedProjectId(p.projectId)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate pr-2">{p.name}</h4>
                  <span className="text-sm font-bold text-primary-600">{projectStats[p.projectId]?.progress || 0}%</span>
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FolderKanban className="text-primary-500" />
              {activeProj.name} Context
            </h2>
            <Button variant="outline" onClick={() => navigate(`/projects/${activeProj.projectId}`)}>
              Open Project Workspace
            </Button>
          </div>

          {/* PROJECT EXCEPTIONS & ATTENTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock size={18} className="text-yellow-500" />
                  Requires Approval ({pendingTasks.length})
                </h3>
                {canApprove && (
                  <Link to="/pending-approvals" className="text-sm text-primary-600 hover:underline">View All</Link>
                )}
              </div>
              {pendingTasks.length === 0 ? (
                <p className="text-sm text-gray-500">No tasks currently awaiting approval.</p>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.slice(0, 3).map(task => (
                    <div key={task.taskId} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded border border-yellow-100 dark:border-yellow-800">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{task.activityName}</span>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/tasks/${task.taskId}`)}>Review</Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <XCircle size={18} className="text-red-500" />
                  Rejected / Attention ({rejectedTasks.length})
                </h3>
              </div>
              {rejectedTasks.length === 0 ? (
                <p className="text-sm text-gray-500">No rejected tasks requiring attention.</p>
              ) : (
                <div className="space-y-2">
                  {rejectedTasks.slice(0, 3).map(task => (
                    <div key={task.taskId} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-800">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.activityName}</span>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/tasks/${task.taskId}`)}>Investigate</Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* BUILDING BREAKDOWN */}
          <Card title="Building Progress Breakdown">
            {buildings.length === 0 ? (
              <p className="text-gray-500">No buildings defined for this project.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {buildings.map(bldg => (
                  <div key={bldg.buildingId} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 size={16} className="text-gray-400" />
                        {bldg.name}
                      </h4>
                      <span className="font-bold text-gray-900 dark:text-white">{buildingProgress[bldg.buildingId] || 0}%</span>
                    </div>
                    <ProgressBar value={buildingProgress[bldg.buildingId] || 0} showLabel={false} />
                    <div className="mt-3 text-right">
                      <Link to={`/projects/${activeProj.projectId}/buildings/${bldg.buildingId}`} className="text-xs text-primary-600 font-medium hover:underline">
                        Drill Down →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      )}
    </div>
  );
}

export default Dashboard;