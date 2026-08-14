import React, { useState, useEffect } from 'react';
import { PenTool, ExternalLink, Plus, X, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjectsByOrganization } from '../services/projectService';
import { getProjectDrawings, addDrawing, deleteDrawing } from '../services/drawingService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function Drawings() {
  const { userProfile, userRole, projectIds } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [drawings, setDrawings] = useState([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', driveUrl: '', description: '' });

  const isGlobalRole = ['hr', 'director'].includes(userRole);
  const canManage = ['director', 'hr', 'supervisor', 'engineer', 'foreman', 'documentation_assistant'].includes(userRole);

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
    if (selectedProject) getProjectDrawings(selectedProject).then(setDrawings);
  }, [selectedProject]);

  const handleAddDrawing = async () => {
    if (!newDoc.name || !newDoc.driveUrl) return alert('Name and Drive URL are required');
    await addDrawing({ ...newDoc, projectId: selectedProject }, userProfile.uid);
    setShowAddModal(false);
    setNewDoc({ name: '', driveUrl: '', description: '' });
    getProjectDrawings(selectedProject).then(setDrawings);
  };

  // 🔥 NEW: Delete Handler
  const handleDeleteDrawing = async (drawingId) => {
    if (window.confirm("Are you sure you want to remove this drawing link?")) {
      await deleteDrawing(drawingId);
      getProjectDrawings(selectedProject).then(setDrawings);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <PenTool className="text-primary-500" size={32} />
            Project Drawings
          </h1>
          <p className="text-gray-500 mt-1">Access central repository for all site schematics.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            {projects.map(p => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
          </select>
          {canManage && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
              Add Drawing
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {drawings.length === 0 ? (
          <p className="text-gray-500 col-span-3 py-8 text-center">No drawings linked to this project yet.</p>
        ) : (
          drawings.map(doc => (
            <Card key={doc.drawingId} className="flex flex-col h-full relative group">
              {/* 🔥 NEW: Delete Button (Visible on hover for managers) */}
              {canManage && (
                <button 
                  onClick={() => handleDeleteDrawing(doc.drawingId)}
                  className="absolute top-3 right-3 p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove Drawing"
                >
                  <Trash2 size={16} />
                </button>
              )}
              
              <div className="flex-1 pr-6">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{doc.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{doc.description}</p>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button 
                  variant="outline" 
                  className="w-full flex justify-center" 
                  icon={<ExternalLink size={16} />}
                  onClick={() => window.open(doc.driveUrl, '_blank')}
                >
                  Open in Drive
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Link New Drawing</h2>
              <button onClick={() => setShowAddModal(false)}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <Input label="Drawing Name" value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} />
              <Input label="Google Drive Link" value={newDoc.driveUrl} onChange={e => setNewDoc({...newDoc, driveUrl: e.target.value})} />
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea rows="3" value={newDoc.description} onChange={e => setNewDoc({...newDoc, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800" />
              </div>
              <Button variant="primary" className="w-full" onClick={handleAddDrawing}>Save Drawing</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}