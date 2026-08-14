import { database } from '../lib/firebase';
import { ref, set, get, update, push } from 'firebase/database';

const ISSUES_PATH = 'issues';

export async function reportIssueFromTask(taskId, taskLocation, issueData, userId) {
  try {
    const issuesRef = ref(database, ISSUES_PATH);
    const newIssueRef = push(issuesRef);
    
    const issue = {
      issueId: newIssueRef.key,
      taskId: taskId,
      projectId: taskLocation.projectId,
      locationHierarchy: taskLocation, 
      title: issueData.title,
      details: issueData.details,
      status: 'pending_review',
      reportedBy: userId,
      reportedAt: new Date().toISOString(),
      resolvedBy: null,
      resolvedAt: null,
      resolutionDetails: ''
    };

    await set(newIssueRef, issue);
    return issue;
  } catch (error) {
    console.error('Error reporting issue:', error);
    throw error;
  }
}

export async function createDirectIssue(location, issueData, userId) {
  try {
    const issuesRef = ref(database, ISSUES_PATH);
    const newIssueRef = push(issuesRef);
    
    const issue = {
      issueId: newIssueRef.key,
      taskId: null,
      projectId: location.projectId,
      locationHierarchy: location, 
      title: issueData.title,
      details: issueData.details,
      status: 'unresolved',
      reportedBy: userId,
      reportedAt: new Date().toISOString(),
      resolvedBy: null,
      resolvedAt: null,
      resolutionDetails: ''
    };

    await set(newIssueRef, issue);
    return issue;
  } catch (error) {
    console.error('Error creating direct issue:', error);
    throw error;
  }
}

export async function getProjectIssues(projectId) {
  try {
    const issuesRef = ref(database, ISSUES_PATH);
    const snapshot = await get(issuesRef);
    if (!snapshot.exists()) return [];
    
    const issues = snapshot.val();
    return Object.values(issues)
      .filter(issue => issue.projectId === projectId)
      .sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
  } catch (error) {
    console.error('Error fetching issues:', error);
    return [];
  }
}

export async function updateIssueStatus(issueId, updates) {
  try {
    const issueRef = ref(database, `${ISSUES_PATH}/${issueId}`);
    await update(issueRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating issue:', error);
    throw error;
  }
}