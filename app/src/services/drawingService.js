import { database } from '../lib/firebase';
import { ref, set, get, push, remove } from 'firebase/database';

const DRAWINGS_PATH = 'drawings';

export async function addDrawing(drawingData, userId) {
  try {
    const drawingsRef = ref(database, DRAWINGS_PATH);
    const newRef = push(drawingsRef);
    
    const drawing = {
      drawingId: newRef.key,
      projectId: drawingData.projectId,
      name: drawingData.name,
      driveUrl: drawingData.driveUrl,
      description: drawingData.description || '',
      addedBy: userId,
      addedAt: new Date().toISOString()
    };

    await set(newRef, drawing);
    return drawing;
  } catch (error) {
    console.error('Error adding drawing:', error);
    throw error;
  }
}

export async function getProjectDrawings(projectId) {
  try {
    const drawingsRef = ref(database, DRAWINGS_PATH);
    const snapshot = await get(drawingsRef);
    if (!snapshot.exists()) return [];
    
    const drawings = snapshot.val();
    return Object.values(drawings)
      .filter(d => d.projectId === projectId)
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  } catch (error) {
    console.error('Error fetching drawings:', error);
    return [];
  }
}

// 🔥 NEW: Delete Drawing Function
export async function deleteDrawing(drawingId) {
  try {
    await remove(ref(database, `${DRAWINGS_PATH}/${drawingId}`));
  } catch (error) {
    console.error('Error deleting drawing:', error);
    throw error;
  }
}