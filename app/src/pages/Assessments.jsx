import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Plus, FileText, Clock, CheckCircle, PenTool } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjectsByOrganization } from '../services/projectService';
import { getProjectAssessments, createAssessment } from '../services/assessmentService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function Assessments() {
  const { userProfile, userRole, projectIds } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [assessments, setAssessments] = useState([]);
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ title: '', description: '', date: new Date().toISOString().split('T')[0] });

  const isGlobalRole = ['hr', 'director'].includes(userRole);
  const canManage = ['director', 'hr', 'supervisor', 'foreman', 'engineer'].includes(userRole);

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
    if (selectedProject) getProjectAssessments(selectedProject).then(setAssessments);
  }, [selectedProject]);

  const handleCreate = async () => {
    if (!newForm.title) return alert('Title is required');
    const newAss = await createAssessment({ ...newForm, projectId: selectedProject }, userProfile.uid);
    navigate(`/assessments/${newAss.assessmentId}`);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Completed': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">Completed</span>;
      case 'In Progress': return <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">In Progress</span>;
      default: return <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">Draft</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ClipboardCheck className="text-primary-500" size={32} />
            Digital Site Assessments
          </h1>
          <p className="text-gray-500 mt-1">Conduct and export structured room-by-room inspections.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
          >
            {projects.map(p => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
          </select>
          {canManage && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowNewModal(true)}>
              New Assessment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assessments.length === 0 ? (
          <p className="text-gray-500 col-span-3 py-8 text-center">No assessments found for this project.</p>
        ) : (
          assessments.map(ass => (
            <Card key={ass.assessmentId} className="flex flex-col hover:border-primary-500 transition-colors cursor-pointer" onClick={() => navigate(`/assessments/${ass.assessmentId}`)}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{ass.title}</h3>
                {getStatusBadge(ass.status)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{ass.description || 'No description provided.'}</p>
              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 flex justify-between">
                <span className="flex items-center gap-1"><Clock size={12}/> {ass.date}</span>
                <span>{ass.selectedSpaces?.length || 0} Spaces</span>
              </div>
            </Card>
          ))
        )}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Initialize New Assessment</h2>
            <div className="space-y-4">
              <Input label="Assessment Title" placeholder="e.g. Electrical First-Fix Review" value={newForm.title} onChange={e => setNewForm({...newForm, title: e.target.value})} />
              <Input label="Date" type="date" value={newForm.date} onChange={e => setNewForm({...newForm, date: e.target.value})} />
              <div>
                <label className="block text-sm font-medium mb-1">Purpose / Description</label>
                <textarea rows="3" value={newForm.description} onChange={e => setNewForm({...newForm, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowNewModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleCreate}>Start Assessment</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}