import { database } from '../lib/firebase';
import { ref, set, get, update, remove, push } from 'firebase/database';

const ASSESSMENTS_PATH = 'assessments';

export async function createAssessment(data, userId) {
  const assessmentRef = ref(database, ASSESSMENTS_PATH);
  const newRef = push(assessmentRef);
  
  const assessment = {
    assessmentId: newRef.key,
    projectId: data.projectId,
    title: data.title,
    description: data.description || '',
    assessorId: userId,
    date: data.date || new Date().toISOString().split('T')[0],
    status: 'Draft', // Draft, In Progress, Completed
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    location: {
      buildingId: '',
      floorId: '',
      wingId: ''
    },
    selectedSpaces: [], // Array of space objects { spaceId, name, type }
    selectedItems: [], // Array of strings (e.g., 'Lighting Point')
    matrix: {}, // { spaceId: { item: { status: 'OK', observation: '' } } }
    findings: [],
    recommendations: [],
    challenges: []
  };

  await set(newRef, assessment);
  return assessment;
}

export async function getProjectAssessments(projectId) {
  const assessmentRef = ref(database, ASSESSMENTS_PATH);
  const snapshot = await get(assessmentRef);
  if (!snapshot.exists()) return [];
  
  const assessments = snapshot.val();
  return Object.values(assessments)
    .filter(a => a.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getAssessment(assessmentId) {
  const assessmentRef = ref(database, `${ASSESSMENTS_PATH}/${assessmentId}`);
  const snapshot = await get(assessmentRef);
  return snapshot.exists() ? snapshot.val() : null;
}

export async function updateAssessment(assessmentId, updates) {
  const assessmentRef = ref(database, `${ASSESSMENTS_PATH}/${assessmentId}`);
  await update(assessmentRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteAssessment(assessmentId) {
  const assessmentRef = ref(database, `${ASSESSMENTS_PATH}/${assessmentId}`);
  await remove(assessmentRef);
}