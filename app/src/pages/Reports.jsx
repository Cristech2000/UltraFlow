import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Building2, 
  Layers, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjectsByOrganization } from '../services/projectService';
import { getBuildingsByProject, getFloorsByBuilding, getWingsByFloor, getSpacesByWing } from '../services/spaceService';
import { getActivitiesByProject } from '../services/activityService';
import { calculateSpaceProgress, calculateWingProgress, calculateLevelProgress, calculateBuildingProgress } from '../utils/progressUtils';
import { generateExcelReport } from '../utils/excelGenerator';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ProgressBar from '../components/common/ProgressBar';

function Reports() {
  const { userProfile, userRole, projectIds } = useAuth();
  
  // Data States
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  
  // Selection States
  const [selectedProject, setSelectedProject] = useState('');
  const [reportScope, setReportScope] = useState('Project'); // Project, Building, Level, Wing
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedWing, setSelectedWing] = useState('');
  
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [commentary, setCommentary] = useState('');
  
  // Snapshot Data
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [reportSnapshot, setReportSnapshot] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Hierarchy lookups for dropdowns
  const [buildings, setBuildings] = useState([]);
  const [levels, setLevels] = useState([]);
  const [wings, setWings] = useState([]);

  const isGlobalRole = ['hr', 'director'].includes(userRole);

  // 1. Load Accessible Projects
  useEffect(() => {
    let isMounted = true;
    const loadProjects = async () => {
      try {
        const orgId = userProfile?.organizationId || 'ultrapower';
        const allProjects = await getProjectsByOrganization(orgId);
        const accessible = isGlobalRole ? allProjects : allProjects.filter(p => (projectIds || []).includes(p.projectId));
        
        if (isMounted) {
          setProjects(accessible);
          if (accessible.length > 0) setSelectedProject(accessible[0].projectId);
        }
      } catch (err) {
        console.error('Error loading projects:', err);
      } finally {
        if (isMounted) setLoadingProjects(false);
      }
    };
    loadProjects();
    return () => { isMounted = false; };
  }, [userProfile, userRole, projectIds, isGlobalRole]);

  // 2. Load Snapshot Data when selections change
  useEffect(() => {
    let isMounted = true;

    const buildSnapshot = async () => {
      if (!selectedProject) return;
      setSnapshotLoading(true);

      try {
        // Fetch full project raw data
        const [bldgsRaw, actsRaw] = await Promise.all([
          getBuildingsByProject(selectedProject),
          getActivitiesByProject(selectedProject)
        ]);

        const filteredBuildings = reportScope === 'Building' || reportScope === 'Level' || reportScope === 'Wing' 
          ? bldgsRaw.filter(b => b.buildingId === selectedBuilding)
          : bldgsRaw;

        const hierarchy = [];
        let totalProjectProgress = 0;
        let buildingCount = 0;

        // Reconstruct exact hierarchy and use progressUtils securely
        for (const bldg of filteredBuildings) {
          const flrsRaw = await getFloorsByBuilding(bldg.buildingId);
          const filteredFloors = reportScope === 'Level' || reportScope === 'Wing'
            ? flrsRaw.filter(f => f.floorId === selectedLevel)
            : flrsRaw;

          const bldgHierarchy = {
            id: bldg.buildingId,
            name: bldg.name,
            activities: actsRaw.filter(a => a.buildingId === bldg.buildingId && a.scope === 'building'),
            levels: [],
            progress: 0
          };

          const levelsWithProgress = [];

          for (const flr of filteredFloors) {
            const wngsRaw = await getWingsByFloor(flr.floorId);
            const filteredWings = reportScope === 'Wing'
              ? wngsRaw.filter(w => w.wingId === selectedWing)
              : wngsRaw;

            const lvlHierarchy = {
              id: flr.floorId,
              name: flr.name,
              activities: actsRaw.filter(a => a.floorId === flr.floorId && a.scope === 'level'),
              wings: [],
              progress: 0
            };

            const wingsWithProgress = [];

            for (const wng of filteredWings) {
              const spcsRaw = await getSpacesByWing(wng.wingId);
              
              const spacesWithProgress = spcsRaw.map(spc => {
                const spcActs = actsRaw.filter(a => a.spaceId === spc.spaceId && a.scope === 'space');
                return {
                  id: spc.spaceId,
                  name: spc.name,
                  activities: spcActs,
                  progress: calculateSpaceProgress(spcActs)
                };
              });

              const wingActs = actsRaw.filter(a => a.wingId === wng.wingId && a.scope === 'wing');
              const wngProg = calculateWingProgress(spacesWithProgress, wingActs);

              lvlHierarchy.wings.push({
                id: wng.wingId,
                name: wng.name,
                activities: wingActs,
                spaces: spacesWithProgress,
                progress: wngProg
              });
              
              wingsWithProgress.push({ progress: wngProg, spaces: spacesWithProgress });
            }

            lvlHierarchy.progress = calculateLevelProgress(wingsWithProgress, lvlHierarchy.activities);
            bldgHierarchy.levels.push(lvlHierarchy);
            levelsWithProgress.push({ progress: lvlHierarchy.progress, wings: wingsWithProgress });
          }

          bldgHierarchy.progress = calculateBuildingProgress(levelsWithProgress, bldgHierarchy.activities);
          hierarchy.push(bldgHierarchy);
          
          totalProjectProgress += bldgHierarchy.progress;
          buildingCount++;
        }

        const overallProgress = buildingCount > 0 ? Math.round(totalProjectProgress / buildingCount) : 0;

        if (isMounted) {
          setBuildings(bldgsRaw);
          setReportSnapshot({
            projectName: projects.find(p => p.projectId === selectedProject)?.name || 'Project',
            scope: reportScope,
            date: reportDate,
            overallProgress,
            hierarchy
          });
        }

      } catch (err) {
        console.error('Error building report snapshot:', err);
      } finally {
        if (isMounted) setSnapshotLoading(false);
      }
    };

    buildSnapshot();
    return () => { isMounted = false; };
  }, [selectedProject, reportScope, selectedBuilding, selectedLevel, selectedWing, reportDate, projects]);

  // Handle Cascading dropdown logic
  useEffect(() => {
    if (selectedBuilding) {
      getFloorsByBuilding(selectedBuilding).then(setLevels);
    } else {
      setLevels([]);
    }
  }, [selectedBuilding]);

  useEffect(() => {
    if (selectedLevel) {
      getWingsByFloor(selectedLevel).then(setWings);
    } else {
      setWings([]);
    }
  }, [selectedLevel]);

  const handleExport = async () => {
    if (!reportSnapshot) return;
    setIsExporting(true);
    try {
      // Inject commentary just before generation so we don't cause infinite re-renders on typing
      const finalData = { ...reportSnapshot, commentary, date: new Date(reportDate).toLocaleDateString() };
      await generateExcelReport(finalData);
    } catch (err) {
      console.error('Failed to generate Excel:', err);
      alert('Failed to generate Excel workbook. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  if (loadingProjects) {
    return <div className="p-8 text-center text-gray-500">Loading documentation workspace...</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Projects Available</h2>
        <p className="text-gray-500 mt-2">You are not assigned to any projects to generate documentation for.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <FileSpreadsheet className="text-primary-500" size={32} />
          Documentation & Progress Reports
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Generate dynamic, professional Excel progress reports from live system data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REPORT BUILDER CONTROLS */}
        <div className="lg:col-span-1 space-y-4">
          <Card title="Report Configuration">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  {projects.map(p => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Scope</label>
                <select
                  value={reportScope}
                  onChange={(e) => {
                    setReportScope(e.target.value);
                    setSelectedBuilding(''); setSelectedLevel(''); setSelectedWing('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="Project">Entire Project</option>
                  <option value="Building">Building Only</option>
                  <option value="Level">Level Only</option>
                  <option value="Wing">Wing Only</option>
                </select>
              </div>

              {/* Cascading Scope Selectors */}
              {(reportScope === 'Building' || reportScope === 'Level' || reportScope === 'Wing') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Building</label>
                  <select
                    value={selectedBuilding}
                    onChange={(e) => { setSelectedBuilding(e.target.value); setSelectedLevel(''); setSelectedWing(''); }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Choose Building --</option>
                    {buildings.map(b => <option key={b.buildingId} value={b.buildingId}>{b.name}</option>)}
                  </select>
                </div>
              )}

              {(reportScope === 'Level' || reportScope === 'Wing') && selectedBuilding && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Level</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => { setSelectedLevel(e.target.value); setSelectedWing(''); }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Choose Level --</option>
                    {levels.map(l => <option key={l.floorId} value={l.floorId}>{l.name}</option>)}
                  </select>
                </div>
              )}

              {reportScope === 'Wing' && selectedLevel && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Wing</label>
                  <select
                    value={selectedWing}
                    onChange={(e) => setSelectedWing(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Choose Wing --</option>
                    {wings.map(w => <option key={w.wingId} value={w.wingId}>{w.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reporting Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Executive Commentary (Optional)</label>
                <textarea
                  rows="4"
                  value={commentary}
                  onChange={(e) => setCommentary(e.target.value)}
                  placeholder="Enter a brief summary of the progress for this reporting period..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <Button 
                variant="primary" 
                className="w-full py-3 mt-4" 
                icon={<Download size={18} />}
                onClick={handleExport}
                loading={isExporting}
                disabled={snapshotLoading || !reportSnapshot || (reportScope === 'Building' && !selectedBuilding) || (reportScope === 'Level' && !selectedLevel) || (reportScope === 'Wing' && !selectedWing)}
              >
                Generate Excel Report
              </Button>
            </div>
          </Card>
        </div>

        {/* REPORT PREVIEW */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Live Report Preview" subtitle="This data will be formatted into the Excel workbook">
            {snapshotLoading ? (
              <div className="py-12 text-center text-gray-500">Calculating official progress metrics...</div>
            ) : reportSnapshot ? (
              <div className="space-y-6">
                
                {/* Header Preview */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{reportSnapshot.projectName}</h3>
                  <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(reportDate).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><FileText size={14}/> Scope: {reportScope}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                    <span className="font-semibold text-primary-800 dark:text-primary-300">Target Scope Overall Progress</span>
                    <span className="text-xl font-bold text-primary-600">{reportSnapshot.overallProgress}%</span>
                  </div>
                </div>

                {/* Structure Preview */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 uppercase text-sm">Data Inclusion Preview</h4>
                  {reportSnapshot.hierarchy.length === 0 ? (
                    <p className="text-sm text-gray-500">No location data selected or available.</p>
                  ) : (
                    reportSnapshot.hierarchy.map(bldg => (
                      <div key={bldg.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 flex justify-between items-center">
                          <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Building2 size={16}/> {bldg.name}</span>
                          <span className="font-bold">{bldg.progress}%</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-900 space-y-2">
                          {bldg.levels.slice(0, 3).map(lvl => (
                            <div key={lvl.id} className="text-sm text-gray-600 dark:text-gray-400 flex justify-between items-center border-l-2 border-primary-500 pl-2">
                              <span><Layers size={14} className="inline mr-1"/> {lvl.name}</span>
                              <span className="font-medium">{lvl.progress}%</span>
                            </div>
                          ))}
                          {bldg.levels.length > 3 && <p className="text-xs text-gray-400 italic pl-2">... and {bldg.levels.length - 3} more levels.</p>}
                        </div>
                      </div>
                    ))
                  )}
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg text-sm flex items-start gap-3">
                    <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                    <p><strong>Note:</strong> The downloaded Excel file will contain full Activity tables, Wing breakdowns, and the dynamic Space Matrix identifying exactly which rooms have missing or unassigned activities.</p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">Select a valid report scope to see preview.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Reports;