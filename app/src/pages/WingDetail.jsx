import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Layers, 
  Plus, 
  ChevronRight, 
  Trash2, 
  AlertTriangle,
  X,
  Grid,
  Copy
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProject } from '../services/projectService';
import { getBuilding, getFloor, getWing, getSpacesByWing, createSpace, deleteSpace, bulkCloneSpace, SPACE_TYPES } from '../services/spaceService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { STATUS_DISPLAY_NAMES, getStatusColor } from '../constants/status';

function WingDetail() {
  const { projectId, buildingId, floorId, wingId } = useParams();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  
  const [project, setProject] = useState(null);
  const [building, setBuilding] = useState(null);
  const [floor, setFloor] = useState(null);
  const [wing, setWing] = useState(null);
  const [spaces, setSpaces] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  
  // New Smart Clone State
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloningSpace, setCloningSpace] = useState(null);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneConfig, setCloneConfig] = useState({
    count: 1,
    prefix: '',
    startNumber: 1
  });
  
  const [spaceForm, setSpaceForm] = useState({ name: '', code: '', description: '', type: 'Room', status: 'active' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const canEdit = ['director', 'engineer', 'supervisor'].includes(userRole);
  const canDelete = ['director'].includes(userRole);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projData, bldgData, floorData, wingData, spacesData] = await Promise.all([
        getProject(projectId),
        getBuilding(buildingId),
        getFloor(floorId),
        getWing(wingId),
        getSpacesByWing(wingId)
      ]);
      setProject(projData);
      setBuilding(bldgData);
      setFloor(floorData);
      setWing(wingData);
      setSpaces(spacesData || []);
    } catch (err) {
      console.error('Error loading wing data:', err);
      setError('Failed to load wing details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId, buildingId, floorId, wingId]);

  const handleCreateSpace = async () => {
    if (!spaceForm.name.trim()) {
      setFormError('Space name is required');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await createSpace(spaceForm, wingId, floorId, buildingId, projectId, user?.uid);
      setShowSpaceForm(false);
      setSpaceForm({ name: '', code: '', description: '', type: 'Room', status: 'active' });
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create space');
    } finally {
      setSubmitting(false);
    }
  };

  const openCloneModal = (space) => {
    setCloningSpace(space);
    
    // Auto-detect prefix and number (e.g., "Room 101" -> Prefix: "Room ", Start: 102)
    const match = space.name.match(/^(.*?)(\d+)$/);
    let defaultPrefix = space.name + ' ';
    let defaultStart = 1;
    
    if (match) {
      defaultPrefix = match[1];
      defaultStart = parseInt(match[2], 10) + 1; // Suggest the immediate next number
    }

    setCloneConfig({
      count: 1,
      prefix: defaultPrefix,
      startNumber: defaultStart
    });
    setShowCloneModal(true);
  };

  const handleCloneSpace = async () => {
    if (cloneConfig.count < 1 || cloneConfig.count > 100) {
      setFormError('Please enter a number of copies between 1 and 100');
      return;
    }
    if (cloneConfig.startNumber < 0) {
      setFormError('Starting number cannot be negative');
      return;
    }
    
    setIsCloning(true);
    setFormError('');
    try {
      await bulkCloneSpace(cloningSpace.spaceId, cloneConfig, user?.uid);
      setShowCloneModal(false);
      setCloningSpace(null);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to clone space');
    } finally {
      setIsCloning(false);
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
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading wing details...</p>
        </div>
      </div>
    );
  }

  if (error || !wing) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">{error || 'Wing not found'}</p>
          <Button variant="primary" className="mt-4" onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}/floors/${floorId}`)}>
            Back to Level
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 overflow-x-auto whitespace-nowrap pb-2">
        <Link to="/projects" className="hover:text-primary-500">Projects</Link>
        <ChevronRight size={14} className="flex-shrink-0" />
        <Link to={`/projects/${projectId}`} className="hover:text-primary-500">{project?.name}</Link>
        <ChevronRight size={14} className="flex-shrink-0" />
        <Link to={`/projects/${projectId}/buildings/${buildingId}`} className="hover:text-primary-500">{building?.name}</Link>
        <ChevronRight size={14} className="flex-shrink-0" />
        <Link to={`/projects/${projectId}/buildings/${buildingId}/floors/${floorId}`} className="hover:text-primary-500">{floor?.name}</Link>
        <ChevronRight size={14} className="flex-shrink-0" />
        <span className="text-gray-900 dark:text-white font-medium">{wing.name}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{wing.name}</h1>
            {getStatusBadge(wing.status)}
          </div>
          {wing.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{wing.description}</p>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}/floors/${floorId}`)} icon={<ArrowLeft size={16} />}>
          Back to Level
        </Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Spaces</h2>
          {canEdit && (
            <Button variant="ghost" size="sm" icon={<Plus size={16} />} onClick={() => setShowSpaceForm(true)}>
              Add Space
            </Button>
          )}
        </div>

        {spaces.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <Grid size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No spaces yet</p>
              {canEdit && (
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowSpaceForm(true)}>
                  Create the first template space
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {spaces.map((space) => (
              <SpaceCard 
                key={space.spaceId} 
                space={space} 
                projectIds={{projectId, buildingId, floorId, wingId}}
                getStatusBadge={getStatusBadge}
                onDelete={loadData}
                onClone={() => openCloneModal(space)}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Smart Clone Space Modal */}
      {showCloneModal && cloningSpace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Smart Clone Space</h2>
              <button onClick={() => { setShowCloneModal(false); setFormError(''); }}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {formError}
                </div>
              )}
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Template: <strong>{cloningSpace.name}</strong><br/>
                  <span className="text-xs opacity-80">All activities from this template will be perfectly copied.</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Prefix (e.g., Room)
                  </label>
                  <input
                    type="text"
                    value={cloneConfig.prefix}
                    onChange={(e) => setCloneConfig({ ...cloneConfig, prefix: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Starting Number
                  </label>
                  <input
                    type="number"
                    value={cloneConfig.startNumber}
                    onChange={(e) => setCloneConfig({ ...cloneConfig, startNumber: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  How many spaces to generate?
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={cloneConfig.count}
                  onChange={(e) => setCloneConfig({ ...cloneConfig, count: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Live Preview */}
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">Preview: </span>
                {cloneConfig.prefix}{cloneConfig.startNumber}
                {cloneConfig.count > 1 && (
                  <span> ... to {cloneConfig.prefix}{cloneConfig.startNumber + cloneConfig.count - 1}</span>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" onClick={() => { setShowCloneModal(false); setFormError(''); }}>Cancel</Button>
                <Button variant="primary" onClick={handleCloneSpace} loading={isCloning} icon={<Copy size={16} />}>Generate Spaces</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Space Form Modal */}
      {showSpaceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Space</h2>
              <button onClick={() => { setShowSpaceForm(false); setFormError(''); }}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {formError}
                </div>
              )}
              <Input
                label="Space Name"
                placeholder="e.g., Room 101"
                value={spaceForm.name}
                onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })}
                required
              />
              <Input
                label="Space Code"
                placeholder="e.g., R-101"
                value={spaceForm.code}
                onChange={(e) => setSpaceForm({ ...spaceForm, code: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Type
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
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="ghost" onClick={() => { setShowSpaceForm(false); setFormError(''); }}>Cancel</Button>
                <Button variant="primary" onClick={handleCreateSpace} loading={submitting}>Create</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpaceCard({ space, projectIds, getStatusBadge, onDelete, onClone, canEdit, canDelete }) {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { name, code, type, status, spaceId } = space;
  const { projectId, buildingId, floorId, wingId } = projectIds;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSpace(spaceId);
      onDelete();
    } catch (err) {
      console.error('Error deleting space:', err);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow relative group"
        onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}/floors/${floorId}/wings/${wingId}/spaces/${spaceId}`)}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {type}
                </span>
                {code && <span className="text-xs text-gray-500 dark:text-gray-400">{code}</span>}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            {getStatusBadge(status)}
            <div className="flex items-center text-sm text-primary-600 dark:text-primary-400">
              Details <ChevronRight size={16} className="ml-1" />
            </div>
          </div>
          
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-all">
            {canEdit && (
              <button
                className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow shadow-black/10 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-500 transition-colors"
                onClick={(e) => { e.stopPropagation(); onClone(); }}
                title="Clone Space"
              >
                <Copy size={16} />
              </button>
            )}
            {canDelete && (
              <button
                className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow shadow-black/10 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
                title="Delete Space"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </Card>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Space</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <span className="font-semibold">{name}</span>?
              This will permanently remove all activities attached to it.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default WingDetail;