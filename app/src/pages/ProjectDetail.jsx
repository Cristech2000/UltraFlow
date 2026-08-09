import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  FolderKanban,
  Plus,
  ChevronRight,
  Edit2,
  Home,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProject } from '../services/projectService';
import { 
  getBuildingsByProject, 
  getFloorsByBuilding,
  getSpacesByWing,
  getWingsByFloor,
  createBuilding,
  createFloor,
  createWing,
  createSpace,
  SPACE_TYPES,
} from '../services/spaceService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Input from '../components/common/Input';
import { STATUS_DISPLAY_NAMES, getStatusColor } from '../constants/status';

function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, userProfile, userRole } = useAuth();
  const [project, setProject] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedBuilding, setExpandedBuilding] = useState(null);
  const [expandedFloor, setExpandedFloor] = useState(null);
  const [showBuildingForm, setShowBuildingForm] = useState(false);
  const [showFloorForm, setShowFloorForm] = useState(false);
  const [showWingForm, setShowWingForm] = useState(false);
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [selectedWing, setSelectedWing] = useState(null);
  const [buildingForm, setBuildingForm] = useState({ name: '', code: '', description: '', status: 'active' });
  const [floorForm, setFloorForm] = useState({ name: '', levelNumber: 0, code: '', status: 'active' });
  const [wingForm, setWingForm] = useState({ name: '', code: '', description: '', status: 'active' });
  const [spaceForm, setSpaceForm] = useState({ name: '', code: '', type: 'Other', description: '', status: 'active' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const canEdit = ['director', 'engineer', 'supervisor'].includes(userRole);

  // Load project data
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const projectData = await getProject(projectId);
      if (!projectData) {
        setError('Project not found');
        setLoading(false);
        return;
      }
      setProject(projectData);

      const buildingsData = await getBuildingsByProject(projectId);
      setBuildings(buildingsData);
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Failed to load project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  // Load floors for a building
  const loadFloors = async (buildingId) => {
    try {
      const floors = await getFloorsByBuilding(buildingId);
      return floors;
    } catch (err) {
      console.error('Error loading floors:', err);
      return [];
    }
  };

  // Load wings for a floor
  const loadWings = async (floorId) => {
    try {
      const wings = await getWingsByFloor(floorId);
      return wings;
    } catch (err) {
      console.error('Error loading wings:', err);
      return [];
    }
  };

  // Load spaces for a wing
  const loadSpaces = async (wingId) => {
    try {
      console.log('📡 Calling getSpacesByWing for wing:', wingId);
      const spaces = await getSpacesByWing(wingId);
      console.log('📦 Spaces returned:', spaces);
      return spaces;
    } catch (err) {
      console.error('Error loading spaces:', err);
      return [];
    }
  };

  // Toggle building expansion
  const toggleBuilding = async (buildingId) => {
    console.log('🔄 Toggling building:', buildingId);
    
    if (expandedBuilding === buildingId) {
      setExpandedBuilding(null);
      setExpandedFloor(null);
      return;
    }
    setExpandedBuilding(buildingId);
    setExpandedFloor(null);
    
    const building = buildings.find(b => b.buildingId === buildingId);
    if (building) {
      const floors = await loadFloors(buildingId);
      setBuildings(prev => prev.map(b => 
        b.buildingId === buildingId ? { ...b, floors } : b
      ));
    }
  };

  // Toggle floor expansion
  const toggleFloor = async (buildingId, floorId) => {
    console.log('🔄 Toggling floor:', floorId);
    
    if (expandedFloor === floorId) {
      setExpandedFloor(null);
      return;
    }
    setExpandedFloor(floorId);
    
    const building = buildings.find(b => b.buildingId === buildingId);
    if (building) {
      const floor = building.floors?.find(f => f.floorId === floorId);
      if (floor && !floor.wings) {
        const wings = await loadWings(floorId);
        setBuildings(prev => prev.map(b => 
          b.buildingId === buildingId ? {
            ...b,
            floors: b.floors?.map(f => 
              f.floorId === floorId ? { ...f, wings } : f
            )
          } : b
        ));
      }
    }
  };

  // Toggle wing expansion
  const toggleWing = async (buildingId, floorId, wingId) => {
    console.log('🔄 Toggling wing:', { buildingId, floorId, wingId });
    
    const building = buildings.find(b => b.buildingId === buildingId);
    if (!building) {
      console.error('❌ Building not found:', buildingId);
      return;
    }
    
    const floor = building.floors?.find(f => f.floorId === floorId);
    if (!floor) {
      console.error('❌ Floor not found:', floorId);
      return;
    }
    
    const wing = floor.wings?.find(w => w.wingId === wingId);
    if (!wing) {
      console.error('❌ Wing not found:', wingId);
      return;
    }
    
    // If wing already has spaces loaded, don't reload
    if (wing.spaces) {
      console.log('ℹ️ Wing already has spaces:', wing.spaces.length);
      return;
    }
    
    console.log('📡 Loading spaces for wing:', wingId);
    const spaces = await loadSpaces(wingId);
    console.log('📦 Spaces loaded for wing:', spaces);
    
    setBuildings(prev => prev.map(b => 
      b.buildingId === buildingId ? {
        ...b,
        floors: b.floors?.map(f => 
          f.floorId === floorId ? {
            ...f,
            wings: f.wings?.map(w => 
              w.wingId === wingId ? { ...w, spaces } : w
            )
          } : f
        )
      } : b
    ));
    
    console.log('✅ Wing updated with spaces');
  };

  // Create building
  const handleCreateBuilding = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      await createBuilding(buildingForm, projectId, user?.uid);
      setShowBuildingForm(false);
      setBuildingForm({ name: '', code: '', description: '', status: 'active' });
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create building');
    } finally {
      setSubmitting(false);
    }
  };

  // Create floor
  const handleCreateFloor = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      await createFloor(floorForm, selectedBuilding, projectId, user?.uid);
      setShowFloorForm(false);
      setFloorForm({ name: '', levelNumber: 0, code: '', status: 'active' });
      setSelectedBuilding(null);
      await loadData();
      if (selectedBuilding) {
        await toggleBuilding(selectedBuilding);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create floor');
    } finally {
      setSubmitting(false);
    }
  };

  // Create wing
  const handleCreateWing = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      await createWing(wingForm, selectedFloor, selectedBuilding, projectId, user?.uid);
      setShowWingForm(false);
      setWingForm({ name: '', code: '', description: '', status: 'active' });
      setSelectedFloor(null);
      await loadData();
      if (selectedBuilding) {
        await toggleBuilding(selectedBuilding);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create wing');
    } finally {
      setSubmitting(false);
    }
  };

  // Create space
  const handleCreateSpace = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      await createSpace(
        spaceForm, 
        selectedWing, 
        selectedFloor, 
        selectedBuilding, 
        projectId, 
        user?.uid
      );
      setShowSpaceForm(false);
      setSpaceForm({ name: '', code: '', type: 'Other', description: '', status: 'active' });
      setSelectedWing(null);
      await loadData();
      if (selectedBuilding) {
        await toggleBuilding(selectedBuilding);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create space');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const color = getStatusColor(status);
    const label = STATUS_DISPLAY_NAMES[status] || status;
    return (
      <span className={`text-xs px-3 py-1 rounded-full font-medium ${color}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FolderKanban size={48} className="text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{error || 'Project not found'}</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate('/projects')}
          >
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link to="/projects" className="hover:text-primary-500 transition-colors">
          Projects
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-white font-medium">{project.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            {getStatusBadge(project.status)}
          </div>
          {project.code && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Code: {project.code}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={() => navigate('/projects')}
          icon={<ArrowLeft size={16} />}
        >
          Back to Projects
        </Button>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {project.client && (
          <InfoCard label="Client" value={project.client} icon={Users} />
        )}
        {project.location && (
          <InfoCard label="Location" value={project.location} icon={MapPin} />
        )}
        {project.startDate && (
          <InfoCard 
            label="Start Date" 
            value={new Date(project.startDate).toLocaleDateString()} 
            icon={Calendar} 
          />
        )}
        {project.expectedCompletionDate && (
          <InfoCard 
            label="Expected Completion" 
            value={new Date(project.expectedCompletionDate).toLocaleDateString()} 
            icon={Calendar} 
          />
        )}
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <p className="text-gray-600 dark:text-gray-300">{project.description}</p>
        </Card>
      )}

      {/* Buildings Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Buildings
          </h2>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => setShowBuildingForm(true)}
            >
              Add Building
            </Button>
          )}
        </div>

        {buildings.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <Building2 size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No buildings yet</p>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setShowBuildingForm(true)}
                >
                  Add First Building
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {buildings.map((building) => (
              <BuildingItem
                key={building.buildingId}
                building={building}
                isExpanded={expandedBuilding === building.buildingId}
                onToggle={() => toggleBuilding(building.buildingId)}
                onToggleFloor={(floorId) => toggleFloor(building.buildingId, floorId)}
                onToggleWing={(floorId, wingId) => toggleWing(building.buildingId, floorId, wingId)}
                expandedFloor={expandedFloor}
                canEdit={canEdit}
                onAddFloor={() => {
                  setSelectedBuilding(building.buildingId);
                  setShowFloorForm(true);
                }}
                onAddWing={(floorId) => {
                  setSelectedBuilding(building.buildingId);
                  setSelectedFloor(floorId);
                  setShowWingForm(true);
                }}
                onAddSpace={(floorId, wingId) => {
                  setSelectedBuilding(building.buildingId);
                  setSelectedFloor(floorId);
                  setSelectedWing(wingId);
                  setShowSpaceForm(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showBuildingForm && (
        <Modal
          title="Add Building"
          onClose={() => { setShowBuildingForm(false); setFormError(''); }}
          onSubmit={handleCreateBuilding}
          submitting={submitting}
          error={formError}
        >
          <Input
            label="Building Name"
            name="name"
            placeholder="e.g., Block A"
            value={buildingForm.name}
            onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
            required
          />
          <Input
            label="Building Code"
            name="code"
            placeholder="e.g., B-A"
            value={buildingForm.code}
            onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })}
          />
          <Input
            label="Description"
            name="description"
            placeholder="Brief description"
            value={buildingForm.description}
            onChange={(e) => setBuildingForm({ ...buildingForm, description: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Status
            </label>
            <select
              value={buildingForm.status}
              onChange={(e) => setBuildingForm({ ...buildingForm, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="planned">Planned</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </Modal>
      )}

      {showFloorForm && (
        <Modal
          title="Add Floor"
          onClose={() => { setShowFloorForm(false); setFormError(''); }}
          onSubmit={handleCreateFloor}
          submitting={submitting}
          error={formError}
        >
          <Input
            label="Floor Name"
            name="name"
            placeholder="e.g., Level 3"
            value={floorForm.name}
            onChange={(e) => setFloorForm({ ...floorForm, name: e.target.value })}
            required
          />
          <Input
            label="Level Number"
            name="levelNumber"
            type="number"
            placeholder="e.g., 3"
            value={floorForm.levelNumber}
            onChange={(e) => setFloorForm({ ...floorForm, levelNumber: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Floor Code"
            name="code"
            placeholder="e.g., FL-03"
            value={floorForm.code}
            onChange={(e) => setFloorForm({ ...floorForm, code: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Status
            </label>
            <select
              value={floorForm.status}
              onChange={(e) => setFloorForm({ ...floorForm, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="planned">Planned</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </Modal>
      )}

      {showWingForm && (
        <Modal
          title="Add Wing"
          onClose={() => { setShowWingForm(false); setFormError(''); }}
          onSubmit={handleCreateWing}
          submitting={submitting}
          error={formError}
        >
          <Input
            label="Wing Name"
            name="name"
            placeholder="e.g., Wing A"
            value={wingForm.name}
            onChange={(e) => setWingForm({ ...wingForm, name: e.target.value })}
            required
          />
          <Input
            label="Wing Code"
            name="code"
            placeholder="e.g., W-A"
            value={wingForm.code}
            onChange={(e) => setWingForm({ ...wingForm, code: e.target.value })}
          />
          <Input
            label="Description"
            name="description"
            placeholder="Brief description"
            value={wingForm.description}
            onChange={(e) => setWingForm({ ...wingForm, description: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Status
            </label>
            <select
              value={wingForm.status}
              onChange={(e) => setWingForm({ ...wingForm, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="planned">Planned</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </Modal>
      )}

      {showSpaceForm && (
        <Modal
          title="Add Space"
          onClose={() => { setShowSpaceForm(false); setFormError(''); }}
          onSubmit={handleCreateSpace}
          submitting={submitting}
          error={formError}
        >
          <Input
            label="Space Name"
            name="name"
            placeholder="e.g., Room A301"
            value={spaceForm.name}
            onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })}
            required
          />
          <Input
            label="Space Code"
            name="code"
            placeholder="e.g., S-A301"
            value={spaceForm.code}
            onChange={(e) => setSpaceForm({ ...spaceForm, code: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Space Type
            </label>
            <select
              value={spaceForm.type}
              onChange={(e) => setSpaceForm({ ...spaceForm, type: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {SPACE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <Input
            label="Description"
            name="description"
            placeholder="Brief description"
            value={spaceForm.description}
            onChange={(e) => setSpaceForm({ ...spaceForm, description: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Status
            </label>
            <select
              value={spaceForm.status}
              onChange={(e) => setSpaceForm({ ...spaceForm, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="planned">Planned</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// Helper Components
// ============================================================

function InfoCard({ label, value, icon: Icon }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Icon size={16} className="text-gray-500" />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function Modal({ title, children, onClose, onSubmit, submitting, error }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          {children}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" onClick={onSubmit} loading={submitting}>
              Save
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BuildingItem({ 
  building, 
  isExpanded, 
  onToggle, 
  onToggleFloor,
  onToggleWing,
  expandedFloor,
  canEdit,
  onAddFloor,
  onAddWing,
  onAddSpace,
}) {
  const { name, code, status, description, floors = [] } = building;
  const statusColor = getStatusColor(status);
  const statusLabel = STATUS_DISPLAY_NAMES[status] || status;

  return (
    <Card className="overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <Building2 size={20} className="text-gray-400" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{name}</h3>
            {code && <span className="text-xs text-gray-500 dark:text-gray-400">{code}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor}`}>
            {statusLabel}
          </span>
          <ChevronRight 
            size={16} 
            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
          />
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-800">
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{description}</p>
          )}

          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Floors</h4>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus size={14} />}
                onClick={(e) => { e.stopPropagation(); onAddFloor(); }}
              >
                Add Floor
              </Button>
            )}
          </div>

          {floors.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
              No floors yet
            </p>
          ) : (
            <div className="space-y-2">
              {floors.map((floor) => (
                <FloorItem
                  key={floor.floorId}
                  floor={floor}
                  buildingId={building.buildingId}
                  isExpanded={expandedFloor === floor.floorId}
                  onToggle={() => onToggleFloor(floor.floorId)}
                  onAddWing={(floorId) => onAddWing(floorId)}
                  onAddSpace={(floorId, wingId) => onAddSpace(floorId, wingId)}
                  onToggleWing={onToggleWing}
                  canEdit={canEdit}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function FloorItem({ floor, buildingId, isExpanded, onToggle, onAddWing, onAddSpace, canEdit, onToggleWing }) {
  const { name, levelNumber, code, status, wings = [] } = floor;
  const statusColor = getStatusColor(status);
  const statusLabel = STATUS_DISPLAY_NAMES[status] || status;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <Home size={16} className="text-gray-400" />
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{name}</span>
            {code && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{code}</span>}
            {levelNumber > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">Level {levelNumber}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
            {statusLabel}
          </span>
          <ChevronRight 
            size={14} 
            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
          />
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 pt-0">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Wings
            </h5>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus size={12} />}
                onClick={(e) => { e.stopPropagation(); onAddWing(floor.floorId); }}
                className="text-xs"
              >
                Add Wing
              </Button>
            )}
          </div>

          {wings.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
              No wings yet
            </p>
          ) : (
            <div className="space-y-1.5">
              {wings.map((wing) => (
                <WingItem
                  key={wing.wingId}
                  wing={wing}
                  floorId={floor.floorId}
                  buildingId={buildingId}
                  onAddSpace={onAddSpace}
                  onToggleWing={(wingId) => onToggleWing(floor.floorId, wingId)}
                  canEdit={canEdit}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WingItem({ wing, floorId, buildingId, onAddSpace, canEdit, onToggleWing }) {
  const [showSpaces, setShowSpaces] = useState(false);
  const { name, code, status, spaces = [], description, wingId } = wing;
  const statusColor = getStatusColor(status);
  const statusLabel = STATUS_DISPLAY_NAMES[status] || status;
  const navigate = useNavigate();

  console.log('🪄 WingItem render:', { wingId, name, spacesCount: spaces?.length || 0 });

  const toggleSpaces = () => {
    console.log('👆 Wing clicked:', { wingId, name });
    const newShowState = !showSpaces;
    setShowSpaces(newShowState);
    
    // Load spaces from parent when expanding
    if (newShowState && onToggleWing) {
      console.log('📡 Calling onToggleWing for wing:', wingId);
      onToggleWing(wingId);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div 
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={toggleSpaces}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">{name}</span>
          {code && <span className="text-xs text-gray-500 dark:text-gray-400">{code}</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
            {statusLabel}
          </span>
          {spaces && spaces.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              ({spaces.length} spaces)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus size={12} />}
              onClick={(e) => { 
                e.stopPropagation(); 
                onAddSpace(floorId, wingId); 
              }}
              className="text-xs"
            >
              Add Space
            </Button>
          )}
          <ChevronRight 
            size={12} 
            className={`text-gray-400 transition-transform ${showSpaces ? 'rotate-90' : ''}`} 
          />
        </div>
      </div>

      {showSpaces && (
        <div className="p-2 pt-0 border-t border-gray-100 dark:border-gray-800">
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{description}</p>
          )}
          {!spaces || spaces.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
              No spaces yet
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {spaces.map((space) => (
                <SpaceItem key={space.spaceId} space={space} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SpaceItem({ space }) {
  const { name, code, status, type, spaceId } = space;
  const statusColor = getStatusColor(status);
  const statusLabel = STATUS_DISPLAY_NAMES[status] || status;
  const navigate = useNavigate();

  return (
    <div 
      className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      onClick={() => navigate(`/spaces/${spaceId}`)}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {type && type !== 'Other' && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{type}</span>
            )}
            {code && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{code}</span>
            )}
          </div>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor} ml-1 flex-shrink-0`}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}

export default ProjectDetail;