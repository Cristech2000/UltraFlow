import { database } from '../lib/firebase';
import { ref, set, get, push, remove, update } from 'firebase/database';

const TIMETABLES_PATH = 'timetables';

export async function createTimetable(data, userId) {
  try {
    const tbRef = ref(database, TIMETABLES_PATH);
    const newRef = push(tbRef);
    
    const startDate = new Date(data.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5);

    const timetable = {
      timetableId: newRef.key,
      projectId: data.projectId,
      title: data.title,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      createdBy: userId,
      createdAt: new Date().toISOString(),
      isArchived: false,
      entries: {
        Monday: {}, Tuesday: {}, Wednesday: {}, Thursday: {}, Friday: {}, Saturday: {}
      }
    };

    await set(newRef, timetable);
    return timetable;
  } catch (error) {
    console.error('Error creating timetable:', error);
    throw error;
  }
}

export async function getProjectTimetables(projectId) {
  try {
    const tbRef = ref(database, TIMETABLES_PATH);
    const snapshot = await get(tbRef);
    if (!snapshot.exists()) return [];
    
    const tbs = snapshot.val();
    return Object.values(tbs)
      .filter(t => t.projectId === projectId)
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  } catch (error) {
    console.error('Error fetching timetables:', error);
    return [];
  }
}

export async function archiveTimetable(timetableId) {
  try {
    await update(ref(database, `${TIMETABLES_PATH}/${timetableId}`), {
      isArchived: true,
      archivedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error archiving timetable:', error);
    throw error;
  }
}

// 🔥 NEW: Restore from Archive back to Active
export async function restoreTimetable(timetableId) {
  try {
    await update(ref(database, `${TIMETABLES_PATH}/${timetableId}`), {
      isArchived: false,
      archivedAt: null
    });
  } catch (error) {
    console.error('Error restoring timetable:', error);
    throw error;
  }
}

export async function deleteTimetable(timetableId) {
  try {
    await remove(ref(database, `${TIMETABLES_PATH}/${timetableId}`));
  } catch (error) {
    console.error('Error deleting timetable:', error);
    throw error;
  }
}

export async function addActivityToTimetable(timetableId, day, entryData) {
  try {
    const entriesRef = ref(database, `${TIMETABLES_PATH}/${timetableId}/entries/${day}`);
    const newEntryRef = push(entriesRef);
    
    const entry = {
      entryId: newEntryRef.key,
      ...entryData
    };

    await set(newEntryRef, entry);
    return entry;
  } catch (error) {
    console.error('Error adding activity:', error);
    throw error;
  }
}

export async function removeActivityFromTimetable(timetableId, day, entryId) {
  try {
    await remove(ref(database, `${TIMETABLES_PATH}/${timetableId}/entries/${day}/${entryId}`));
  } catch (error) {
    console.error('Error removing activity:', error);
    throw error;
  }
}