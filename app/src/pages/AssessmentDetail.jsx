import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Settings, FileText, CheckSquare, MessageSquare, Trash2, Plus } from 'lucide-react';
import { getAssessment, updateAssessment, deleteAssessment } from '../services/assessmentService';
import { getAllProjects } from '../services/projectService';
import { getBuildingsByProject, getFloorsByBuilding, getWingsByFloor, getSpacesByWing } from '../services/spaceService';
import { getActivitiesByProject } from '../services/activityService';
import { getUserProfile } from '../services/userService';
import { generateAssessmentExcel } from '../utils/assessmentExcelGenerator';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const STATUS_OPTIONS = ['OK', 'Blocked', 'Pending', 'Missing', 'Requires Rectification', 'N/A'];

export default function AssessmentDetail() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [project, setProject] = useState(null);
  const [assessorName, setAssessorName] = useState('');
  const [activeTab, setActiveTab] = useState('setup'); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Hierarchy & Activity Data
  const [buildings, setBuildings] = useState([]);
  const [levels, setLevels] = useState([]);
  const [wings, setWings] = useState([]);
  const [availableSpaces, setAvailableSpaces] = useState([]);
  const [availableItems, setAvailableItems] = useState([]); 
  
  // Custom Activity Input
  const [customItem, setCustomItem] = useState('');

  // Bulk Update State
  const [bulkItem, setBulkItem] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');

  // Findings Input State
  const [findingType, setFindingType] = useState('findings');
  const [findingText, setFindingText] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAssessment(assessmentId);
        if (!data) return navigate('/assessments');
        
        const safeData = {
          ...data,
          location: data.location || { buildingId: '', floorId: '', wingId: '' },
          selectedSpaces: data.selectedSpaces || [],
          selectedItems: data.selectedItems || [],
          matrix: data.matrix || {},
          findings: data.findings || [],
          recommendations: data.recommendations || [],
          challenges: data.challenges || []
        };
        
        setAssessment(safeData);
        
        const allProjects = await getAllProjects();
        const proj = allProjects.find(p => p.projectId === data.projectId);
        setProject(proj);

        try {
          const user = await getUserProfile(data.assessorId);
          setAssessorName(user?.fullName || data.assessorId);
        } catch { 
          setAssessorName(data.assessorId); 
        }

        // Load project activities for the items list
        const projectActivities = await getActivitiesByProject(data.projectId);
        const activityNames = Array.from(new Set(projectActivities.map(a => a.name))).sort();
        // Combine project activities with any custom ones already saved in this assessment
        const combinedItems = Array.from(new Set([...activityNames, ...safeData.selectedItems]));
        setAvailableItems(combinedItems);

        // Load location hierarchy
        const bldgs = await getBuildingsByProject(data.projectId);
        setBuildings(bldgs);

        if (safeData.location?.buildingId) {
          const flrs = await getFloorsByBuilding(safeData.location.buildingId);
          setLevels(flrs);
        }
        if (safeData.location?.floorId) {
          const wngs = await getWingsByFloor(safeData.location.floorId);
          setWings(wngs);
        }
        if (safeData.location?.wingId) {
          const spcs = await getSpacesByWing(safeData.location.wingId);
          setAvailableSpaces(spcs);
        }
      } catch (error) {
        console.error("Error loading assessment:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [assessmentId, navigate]);

  const handleSave = async (showNotification = true) => {
    setSaving(true);
    await updateAssessment(assessmentId, {
      ...assessment,
      status: assessment.status === 'Draft' ? 'In Progress' : assessment.status
    });
    setSaving(false);
    if (showNotification) alert('Assessment saved successfully.');
  };

  const handleExport = async () => {
    await handleSave(false);
    await generateAssessmentExcel(assessment, project, assessorName);
  };

  const handleDelete = async () => {
    if (window.confirm("⚠️ Are you sure you want to permanently delete this assessment? This cannot be undone.")) {
      await deleteAssessment(assessmentId);
      navigate('/assessments');
    }
  };

  const handleLocationChange = async (level, value) => {
    const newLoc = { ...assessment.location, [level]: value };
    if (level === 'buildingId') { 
      newLoc.floorId = ''; newLoc.wingId = ''; 
      setLevels([]); setWings([]); setAvailableSpaces([]); 
      if(value) {
        const flrs = await getFloorsByBuilding(value);
        setLevels(flrs);
      }
    }
    if (level === 'floorId') { 
      newLoc.wingId = ''; 
      setWings([]); setAvailableSpaces([]); 
      if(value) {
        const wngs = await getWingsByFloor(value);
        setWings(wngs);
      }
    }
    if (level === 'wingId') { 
      setAvailableSpaces([]); 
      if(value) {
        const spcs = await getSpacesByWing(value);
        setAvailableSpaces(spcs);
      }
    }
    
    setAssessment({ ...assessment, location: newLoc });
  };

  const toggleSpaceSelection = (space) => {
    const exists = assessment.selectedSpaces.find(s => s.spaceId === space.spaceId);
    let newSpaces;
    if (exists) {
      newSpaces = assessment.selectedSpaces.filter(s => s.spaceId !== space.spaceId);
    } else {
      newSpaces = [...assessment.selectedSpaces, { spaceId: space.spaceId, name: space.name, type: space.type }];
    }
    setAssessment({ ...assessment, selectedSpaces: newSpaces });
  };

  const selectAllSpaces = () => {
    const formatted = availableSpaces.map(s => ({ spaceId: s.spaceId, name: s.name, type: s.type }));
    setAssessment({ ...assessment, selectedSpaces: formatted });
  };

  const toggleItemSelection = (item) => {
    const items = assessment.selectedItems.includes(item)
      ? assessment.selectedItems.filter(i => i !== item)
      : [...assessment.selectedItems, item];
    setAssessment({ ...assessment, selectedItems: items });
  };

  const handleAddCustomItem = () => {
    if (!customItem.trim()) return;
    const newItem = customItem.trim();
    
    // Add to available items list if it's not already there
    if (!availableItems.includes(newItem)) {
      setAvailableItems([...availableItems, newItem]);
    }
    // Automatically select it for this assessment
    if (!assessment.selectedItems.includes(newItem)) {
      setAssessment({ ...assessment, selectedItems: [...assessment.selectedItems, newItem] });
    }
    setCustomItem(''); // Clear input
  };

  const handleMatrixChange = (spaceId, item, field, value) => {
    const newMatrix = { ...assessment.matrix };
    if (!newMatrix[spaceId]) newMatrix[spaceId] = {};
    if (!newMatrix[spaceId][item]) newMatrix[spaceId][item] = { status: '', observation: '' };
    
    newMatrix[spaceId][item][field] = value;
    setAssessment({ ...assessment, matrix: newMatrix });
  };

  const handleBulkUpdate = () => {
    if (!bulkItem || !bulkStatus) return alert('Select item and status for bulk update.');
    const newMatrix = { ...assessment.matrix };
    
    assessment.selectedSpaces.forEach(space => {
      if (!newMatrix[space.spaceId]) newMatrix[space.spaceId] = {};
      if (!newMatrix[space.spaceId][bulkItem]) newMatrix[space.spaceId][bulkItem] = { status: '', observation: '' };
      newMatrix[space.spaceId][bulkItem].status = bulkStatus;
    });

    setAssessment({ ...assessment, matrix: newMatrix });
    setBulkItem('');
    setBulkStatus('');
  };

  const addTextRecord = () => {
    if (!findingText.trim()) return;
    const newRecord = [...(assessment[findingType] || []), findingText];
    setAssessment({ ...assessment, [findingType]: newRecord });
    setFindingText('');
  };

  const removeTextRecord = (type, index) => {
    const arr = [...assessment[type]];
    arr.splice(index, 1);
    setAssessment({ ...assessment, [type]: arr });
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading assessment workspace...</div>;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/assessments')} className="text-gray-400 hover:text-primary-500 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{assessment.title}</h1>
            <p className="text-sm text-gray-500">{project?.name || 'Loading Project...'} • {assessment.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={assessment.status} 
            onChange={e => setAssessment({...assessment, status: e.target.value})}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium bg-gray-50"
          >
            <option value="Draft">Draft</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          <Button variant="outline" icon={<Save size={16} />} onClick={() => handleSave(true)} loading={saving}>Save</Button>
          <Button variant="primary" className="bg-green-600 hover:bg-green-700" icon={<FileText size={16} />} onClick={handleExport}>Generate Excel</Button>
          <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg ml-2 transition-colors" title="Delete Assessment">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
        <button className={`pb-3 px-4 font-medium border-b-2 flex items-center gap-2 ${activeTab === 'setup' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`} onClick={() => setActiveTab('setup')}><Settings size={16}/> 1. Scope & Items</button>
        <button className={`pb-3 px-4 font-medium border-b-2 flex items-center gap-2 ${activeTab === 'matrix' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`} onClick={() => setActiveTab('matrix')}><CheckSquare size={16}/> 2. Data Entry Matrix</button>
        <button className={`pb-3 px-4 font-medium border-b-2 flex items-center gap-2 ${activeTab === 'findings' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'}`} onClick={() => setActiveTab('findings')}><MessageSquare size={16}/> 3. Findings & Notes</button>
      </div>

      {/* TAB 1: SETUP */}
      {activeTab === 'setup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="A. Select Assessment Scope">
            <div className="space-y-4">
              <select value={assessment.location.buildingId || ''} onChange={e => handleLocationChange('buildingId', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Building...</option>
                {buildings.map(b => <option key={b.buildingId} value={b.buildingId}>{b.name}</option>)}
              </select>
              {assessment.location.buildingId && (
                <select value={assessment.location.floorId || ''} onChange={e => handleLocationChange('floorId', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select Level...</option>
                  {levels.map(l => <option key={l.floorId} value={l.floorId}>{l.name}</option>)}
                </select>
              )}
              {assessment.location.floorId && (
                <select value={assessment.location.wingId || ''} onChange={e => handleLocationChange('wingId', e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select Wing...</option>
                  {wings.map(w => <option key={w.wingId} value={w.wingId}>{w.name}</option>)}
                </select>
              )}

              {availableSpaces.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold">Select Spaces</span>
                    <button onClick={selectAllSpaces} className="text-sm text-primary-600 hover:underline">Select All</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {availableSpaces.map(space => {
                      const isSelected = assessment.selectedSpaces.some(s => s.spaceId === space.spaceId);
                      return (
                        <label key={space.spaceId} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSpaceSelection(space)} className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"/>
                          <span className="text-sm font-medium">{space.name}</span>
                          <span className="text-xs text-gray-400 ml-auto">{space.type}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{assessment.selectedSpaces.length} spaces selected for matrix.</p>
                </div>
              )}
            </div>
          </Card>

          <Card title="B. Select Assessment Items">
            <p className="text-sm text-gray-500 mb-4">Choose the project activities to inspect in this assessment.</p>
            
            {availableItems.length === 0 && (
              <p className="text-sm text-gray-400 italic mb-4">No activities found in this project. You can add custom items below.</p>
            )}

            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4">
              {availableItems.map(item => (
                <label key={item} className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${assessment.selectedItems.includes(item) ? 'bg-primary-50 border-primary-300' : 'hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={assessment.selectedItems.includes(item)} onChange={() => toggleItemSelection(item)} className="rounded text-primary-600 w-4 h-4" />
                  <span className="text-sm">{item}</span>
                </label>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium mb-2 text-gray-700">Need to assess something else?</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={customItem} 
                  onChange={e => setCustomItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCustomItem()}
                  placeholder="Enter custom item name..." 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <Button variant="outline" icon={<Plus size={16} />} onClick={handleAddCustomItem}>Add</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: DATA ENTRY MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 flex flex-col sm:flex-row items-end sm:items-center gap-4 py-3">
            <span className="font-bold text-blue-800 dark:text-blue-300 whitespace-nowrap">⚡ Bulk Update:</span>
            <select value={bulkItem} onChange={e => setBulkItem(e.target.value)} className="px-3 py-1.5 border rounded-md text-sm min-w-[200px]">
              <option value="">Select Item...</option>
              {assessment.selectedItems.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
            <span className="text-gray-400">to</span>
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="px-3 py-1.5 border rounded-md text-sm min-w-[150px]">
              <option value="">Select Status...</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button variant="primary" size="sm" onClick={handleBulkUpdate}>Apply to All Selected Spaces</Button>
          </Card>

          {assessment.selectedSpaces.length === 0 || assessment.selectedItems.length === 0 ? (
            <Card className="text-center py-12 text-gray-500">Go to Step 1 to select Spaces and Assessment Items first.</Card>
          ) : (
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm bg-white dark:bg-gray-900">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-bold sticky left-0 bg-gray-100 dark:bg-gray-800 z-10 w-48 shadow-[1px_0_0_0_#e5e7eb]">Space / Room</th>
                    {assessment.selectedItems.map(item => (
                      <th key={item} className="px-4 py-3 font-semibold min-w-[200px] border-l">{item}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {assessment.selectedSpaces.map(space => (
                    <tr key={space.spaceId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium sticky left-0 bg-white dark:bg-gray-900 z-10 shadow-[1px_0_0_0_#e5e7eb]">
                        {space.name} <span className="block text-xs font-normal text-gray-400">{space.type}</span>
                      </td>
                      {assessment.selectedItems.map(item => {
                        const currentData = assessment.matrix?.[space.spaceId]?.[item] || { status: '', observation: '' };
                        return (
                          <td key={item} className="px-4 py-2 border-l border-gray-100 align-top">
                            <div className="space-y-2">
                              <select 
                                value={currentData.status} 
                                onChange={e => handleMatrixChange(space.spaceId, item, 'status', e.target.value)}
                                className={`w-full px-2 py-1.5 border rounded text-sm font-medium ${
                                  currentData.status === 'OK' ? 'bg-green-50 border-green-200 text-green-700' :
                                  currentData.status === 'Requires Rectification' ? 'bg-red-50 border-red-200 text-red-700' :
                                  currentData.status === 'Blocked' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                                  currentData.status ? 'bg-gray-50 border-gray-300' : ''
                                }`}
                              >
                                <option value="">- Status -</option>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <input 
                                type="text"
                                placeholder="Add observation..."
                                value={currentData.observation}
                                onChange={e => handleMatrixChange(space.spaceId, item, 'observation', e.target.value)}
                                className="w-full px-2 py-1 border border-transparent hover:border-gray-200 focus:border-primary-500 rounded text-xs bg-gray-50"
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FINDINGS & NOTES */}
      {activeTab === 'findings' && (
        <Card>
          <div className="flex gap-4 border-b border-gray-100 mb-4">
            <button className={`pb-2 font-semibold ${findingType==='findings' ? 'border-b-2 border-primary-500' : 'text-gray-500'}`} onClick={() => setFindingType('findings')}>General Findings</button>
            <button className={`pb-2 font-semibold ${findingType==='recommendations' ? 'border-b-2 border-primary-500' : 'text-gray-500'}`} onClick={() => setFindingType('recommendations')}>Recommendations</button>
            <button className={`pb-2 font-semibold ${findingType==='challenges' ? 'border-b-2 border-primary-500' : 'text-gray-500'}`} onClick={() => setFindingType('challenges')}>Challenges Encountered</button>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={findingText} 
                onChange={e => setFindingText(e.target.value)} 
                placeholder={`Record a new ${findingType.slice(0,-1)}...`} 
                className="flex-1 px-4 py-2 border rounded-lg"
                onKeyDown={e => e.key === 'Enter' && addTextRecord()}
              />
              <Button variant="primary" onClick={addTextRecord}>Add</Button>
            </div>
            
            <ul className="space-y-2 mt-4">
              {(assessment[findingType] || []).map((text, idx) => (
                <li key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-sm text-gray-800">{text}</span>
                  <button onClick={() => removeTextRecord(findingType, idx)} className="text-red-500 text-xs font-medium hover:underline">Remove</button>
                </li>
              ))}
              {(!assessment[findingType] || assessment[findingType].length === 0) && (
                <p className="text-sm text-gray-400 italic">No {findingType} recorded yet.</p>
              )}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}