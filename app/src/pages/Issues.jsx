import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Plus, X, Building2, Layers } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProjectsByOrganization } from '../services/projectService';
import { getBuildingsByProject, getFloorsByBuilding, getWingsByFloor } from '../services/spaceService';
import { getProjectIssues, updateIssueStatus, createDirectIssue } from '../services/issueService';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function Issues() {
  const { userProfile, userRole, projectIds } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [issues, setIssues] = useState([]);
  const [activeTab, setActiveTab] = useState('unresolved'); // 'pending_review', 'unresolved', 'resolved'
  
  // Hierarchy States for Direct Issue Creation
  const [buildings, setBuildings] = useState([]);
  const [levels, setLevels] = useState([]);
  const [wings, setWings] = useState([]);
  
  // Modals & Forms
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [rejectionText, setRejectionText] = useState('');
  const [newIssue, setNewIssue] = useState({ title: '', details: '', buildingId: '', floorId: '', wingId: '' });

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

  useEffect(() => {
    if (selectedProject) {
      getProjectIssues(selectedProject).then(setIssues);
      getBuildingsByProject(selectedProject).then(setBuildings);
    }
  }, [selectedProject]);

  // Handle Cascading dropdown logic
  useEffect(() => {
    if (newIssue.buildingId) {
      getFloorsByBuilding(newIssue.buildingId).then(setLevels);
    } else {
      setLevels([]);
    }
  }, [newIssue.buildingId]);

  useEffect(() => {
    if (newIssue.floorId) {
      getWingsByFloor(newIssue.floorId).then(setWings);
    } else {
      setWings([]);
    }
  }, [newIssue.floorId]);

  const handleResolve = async () => {
    if (!resolutionText.trim()) return alert('Enter resolution details');
    await updateIssueStatus(selectedIssue.issueId, {
      status: 'resolved',
      resolvedBy: userProfile.uid,
      resolvedAt: new Date().toISOString(),
      resolutionDetails: resolutionText
    });
    setShowResolveModal(false);
    setResolutionText('');
    setSelectedIssue(null);
    getProjectIssues(selectedProject).then(setIssues);
  };

  const handleReviewIssue = async (issueId, action) => {
    if (action === 'approve') {
      await updateIssueStatus(issueId, { status: 'unresolved' });
      getProjectIssues(selectedProject).then(setIssues);
    } else if (action === 'reject') {
      if (!rejectionText.trim()) return alert('Please provide a rejection reason for the electrician.');
      await updateIssueStatus(issueId, { 
        status: 'rejected', 
        resolutionDetails: `Rejected: ${rejectionText}`,
        resolvedBy: userProfile.uid,
        resolvedAt: new Date().toISOString()
      });
      setShowRejectModal(false);
      setRejectionText('');
      setSelectedIssue(null);
      getProjectIssues(selectedProject).then(setIssues);
    }
  };

  const handleCreateIssue = async () => {
    if (!newIssue.title || !newIssue.details) return alert('Fill all required fields');
    
    // Construct readable location from dropdowns
    const bName = buildings.find(b => b.buildingId === newIssue.buildingId)?.name || '';
    const lName = levels.find(l => l.floorId === newIssue.floorId)?.name || '';
    const wName = wings.find(w => w.wingId === newIssue.wingId)?.name || '';
    const locString = [bName, lName, wName].filter(Boolean).join(' > ');

    const location = { 
      projectId: selectedProject, 
      buildingId: newIssue.buildingId,
      floorId: newIssue.floorId,
      wingId: newIssue.wingId,
      description: locString || 'General Project Issue'
    };
    
    await createDirectIssue(location, newIssue, userProfile.uid);
    setShowAddModal(false);
    setNewIssue({ title: '', details: '', buildingId: '', floorId: '', wingId: '' });
    getProjectIssues(selectedProject).then(setIssues);
  };

  const filteredIssues = issues.filter(i => {
    if (activeTab === 'pending_review') return i.status === 'pending_review';
    if (activeTab === 'unresolved') return i.status === 'unresolved';
    if (activeTab === 'resolved') return i.status === 'resolved' || i.status === 'rejected';
    return false;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <AlertCircle className="text-red-500" size={32} />
            Site Issues
          </h1>
          <p className="text-gray-500 mt-1">Track and resolve project roadblocks.</p>
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
              Add Issue
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800">
        {canManage && (
          <button 
            className={`pb-3 px-2 font-medium border-b-2 transition-colors ${activeTab === 'pending_review' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('pending_review')}
          >
            Pending Review ({issues.filter(i => i.status === 'pending_review').length})
          </button>
        )}
        <button 
          className={`pb-3 px-2 font-medium border-b-2 transition-colors ${activeTab === 'unresolved' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('unresolved')}
        >
          Unresolved ({issues.filter(i => i.status === 'unresolved').length})
        </button>
        <button 
          className={`pb-3 px-2 font-medium border-b-2 transition-colors ${activeTab === 'resolved' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('resolved')}
        >
          Resolved/Closed ({issues.filter(i => i.status === 'resolved' || i.status === 'rejected').length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIssues.length === 0 ? (
          <p className="text-gray-500 col-span-2 py-8 text-center">No issues found in this category.</p>
        ) : (
          filteredIssues.map(issue => (
            <Card key={issue.issueId} className={issue.status === 'pending_review' ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-red-500'}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{issue.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${issue.status === 'resolved' ? 'bg-green-100 text-green-700' : issue.status === 'rejected' ? 'bg-gray-100 text-gray-700' : issue.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {issue.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{issue.details}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>📍 Location: {issue.locationHierarchy?.description || 'General'}</p>
                <p>🕒 Reported: {new Date(issue.reportedAt).toLocaleDateString()}</p>
              </div>
              
              {issue.status === 'pending_review' && canManage && (
                <div className="mt-4 flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => handleReviewIssue(issue.issueId, 'approve')}>Approve to Official</Button>
                  <Button variant="danger" size="sm" onClick={() => { setSelectedIssue(issue); setShowRejectModal(true); }}>Reject</Button>
                </div>
              )}

              {issue.status === 'unresolved' && canManage && (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSelectedIssue(issue); setShowResolveModal(true); }}>
                  Mark as Resolved
                </Button>
              )}

              {(issue.status === 'resolved' || issue.status === 'rejected') && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-800 dark:text-gray-300">
                  <strong>{issue.status === 'resolved' ? 'Resolution:' : 'Feedback:'}</strong> {issue.resolutionDetails}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Resolve Issue</h2>
            <textarea
              rows="4"
              placeholder="How was this fixed?"
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowResolveModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleResolve}>Save Resolution</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Reject Issue</h2>
            <textarea
              rows="4"
              placeholder="Reason for rejection (electrician will see this)..."
              value={rejectionText}
              onChange={(e) => setRejectionText(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleReviewIssue(selectedIssue.issueId, 'reject')}>Reject Issue</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Issue Modal with Hierarchy */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Log Official Issue</h2>
              <button onClick={() => setShowAddModal(false)}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <Input label="Issue Title" value={newIssue.title} onChange={e => setNewIssue({...newIssue, title: e.target.value})} />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Location Hierarchy (Optional)</label>
                <select value={newIssue.buildingId} onChange={e => setNewIssue({...newIssue, buildingId: e.target.value, floorId: '', wingId: ''})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select Building...</option>
                  {buildings.map(b => <option key={b.buildingId} value={b.buildingId}>{b.name}</option>)}
                </select>
                {newIssue.buildingId && (
                  <select value={newIssue.floorId} onChange={e => setNewIssue({...newIssue, floorId: e.target.value, wingId: ''})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Select Level...</option>
                    {levels.map(l => <option key={l.floorId} value={l.floorId}>{l.name}</option>)}
                  </select>
                )}
                {newIssue.floorId && (
                  <select value={newIssue.wingId} onChange={e => setNewIssue({...newIssue, wingId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">Select Wing...</option>
                    {wings.map(w => <option key={w.wingId} value={w.wingId}>{w.name}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Details</label>
                <textarea rows="4" value={newIssue.details} onChange={e => setNewIssue({...newIssue, details: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800" />
              </div>
              <Button variant="danger" className="w-full" onClick={handleCreateIssue}>Submit Issue</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}