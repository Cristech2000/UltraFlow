import React, { useState, useEffect } from 'react';
import { BarChart2, CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjectsByOrganization } from '../services/projectService';
import { getBuildingsByProject, getFloorsByBuilding, getWingsByFloor, getSpacesByWing } from '../services/spaceService';
import { getActivitiesByProject } from '../services/activityService';
import { getProjectIssues } from '../services/issueService';
import { calculateSpaceProgress, calculateWingProgress, calculateLevelProgress, calculateBuildingProgress } from '../utils/progressUtils';
import Card from '../components/common/Card';
import ProgressBar from '../components/common/ProgressBar';

export default function Analytics() {
  const { userProfile, userRole, projectIds } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const isGlobalRole = ['hr', 'director'].includes(userRole);

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

  useEffect(() => {
    if (!selectedProject) return;
    let isMounted = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [bldgs, acts, issues] = await Promise.all([
          getBuildingsByProject(selectedProject),
          getActivitiesByProject(selectedProject),
          getProjectIssues(selectedProject)
        ]);

        let totalProgress = 0;
        const bldgData = [];
        
        for (const b of bldgs) {
          const flrs = await getFloorsByBuilding(b.buildingId);
          const lvlData = [];
          
          for (const f of flrs) {
            const wngs = await getWingsByFloor(f.floorId);
            const wngData = [];
            
            for (const w of wngs) {
              const spcs = await getSpacesByWing(w.wingId);
              const spcData = spcs.map(s => ({
                progress: calculateSpaceProgress(acts.filter(a => a.spaceId === s.spaceId && a.scope === 'space'))
              }));
              const wProg = calculateWingProgress(spcData, acts.filter(a => a.wingId === w.wingId && a.scope === 'wing'));
              wngData.push({ name: w.name, progress: wProg });
            }
            const lProg = calculateLevelProgress(wngData, acts.filter(a => a.floorId === f.floorId && a.scope === 'level'));
            lvlData.push({ name: f.name, progress: lProg, wings: wngData });
          }
          const bProg = calculateBuildingProgress(lvlData, acts.filter(a => a.buildingId === b.buildingId && a.scope === 'building'));
          bldgData.push({ name: b.name, progress: bProg, levels: lvlData });
          totalProgress += bProg;
        }

        if (isMounted) {
          setData({
            overall: bldgs.length ? Math.round(totalProgress / bldgs.length) : 0,
            buildings: bldgData,
            activeActivities: acts.filter(a => a.status === 'in_progress').length,
            completedActivities: acts.filter(a => a.status === 'completed').length,
            unresolvedIssues: issues.filter(i => i.status === 'unresolved').length
          });
        }
      } catch (err) {
        console.error("Analytics load failed", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAnalytics();
    return () => { isMounted = false; };
  }, [selectedProject]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart2 className="text-primary-500" size={32} />
            Project Analytics
          </h1>
        </div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
        >
          {projects.map(p => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
        </select>
      </div>

      {loading || !data ? (
        <div className="py-12 text-center text-gray-500">Aggregating project data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-primary-50 dark:bg-primary-900/20 border-primary-200">
              <p className="text-sm font-medium text-primary-800 dark:text-primary-300">Overall Progress</p>
              <p className="text-3xl font-bold text-primary-600 mt-2">{data.overall}%</p>
              <ProgressBar value={data.overall} className="mt-2" />
            </Card>
            <Card>
              <p className="text-sm font-medium text-gray-500">Active Activities</p>
              <p className="text-3xl font-bold text-blue-600 flex items-center gap-2 mt-2"><PlayCircle size={24}/> {data.activeActivities}</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-gray-500">Completed Activities</p>
              <p className="text-3xl font-bold text-green-600 flex items-center gap-2 mt-2"><CheckCircle size={24}/> {data.completedActivities}</p>
            </Card>
            <Card>
              <p className="text-sm font-medium text-gray-500">Unresolved Issues</p>
              <p className="text-3xl font-bold text-red-600 flex items-center gap-2 mt-2"><AlertCircle size={24}/> {data.unresolvedIssues}</p>
            </Card>
          </div>

          <h2 className="text-xl font-bold mt-8 mb-4">Building Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.buildings.map((b, i) => (
              <Card key={i} title={b.name}>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Building Progress</span>
                    <span className="font-bold text-primary-600">{b.progress}%</span>
                  </div>
                  <ProgressBar value={b.progress} showLabel={false} />
                </div>
                <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                  {b.levels.map((l, j) => (
                    <div key={j} className="mb-2">
                      <div className="flex justify-between text-sm font-medium mb-1">
                        <span className="text-gray-700 dark:text-gray-300">{l.name}</span>
                        <span>{l.progress}%</span>
                      </div>
                      <ProgressBar value={l.progress} showLabel={false} className="h-2" />
                      
                      {/* Wing Breakdown */}
                      <div className="mt-2 pl-4 space-y-2 border-l-2 border-gray-200 dark:border-gray-700">
                        {l.wings.map((w, k) => (
                          <div key={k}>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Wing: {w.name}</span>
                              <span>{w.progress}%</span>
                            </div>
                            <ProgressBar value={w.progress} showLabel={false} className="h-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}