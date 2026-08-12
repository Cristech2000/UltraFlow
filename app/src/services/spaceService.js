import { database } from '../lib/firebase';
import { ref, set, get, update, push, remove, query, orderByChild, equalTo } from 'firebase/database';

const BUILDINGS_PATH = 'buildings';
const FLOORS_PATH = 'floors';
const WINGS_PATH = 'wings';
const SPACES_PATH = 'spaces';

export const SPACE_TYPES = [
  'Bedroom', 'Bathroom', 'Kitchen', 'Living Room', 'Dining Room',
  'Corridor', 'Staircase', 'Lobby', 'Balcony', 'Roof', 'Plant Room',
  'Electrical Room', 'Store', 'External Area', 'Office',
  'Meeting Room', 'Pantry', 'Utility Room', 'Garage', 'Other',
];

// ============================================================
// BUILDINGS
// ============================================================

export async function createBuilding(buildingData, projectId, userId) {
  try {
    const buildingsRef = ref(database, BUILDINGS_PATH);
    const newBuildingRef = push(buildingsRef);
    const buildingId = newBuildingRef.key;

    const building = {
      buildingId,
      projectId,
      name: buildingData.name,
      code: buildingData.code || '',
      description: buildingData.description || '',
      status: buildingData.status || 'planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId || '',
    };

    await set(newBuildingRef, building);
    return building;
  } catch (error) {
    console.error('Error creating building:', error);
    throw error;
  }
}

export async function getBuildingsByProject(projectId) {
  try {
    const buildingsRef = ref(database, BUILDINGS_PATH);
    const snapshot = await get(buildingsRef);
    
    if (snapshot.exists()) {
      const buildings = snapshot.val();
      return Object.keys(buildings)
        .map(key => ({ ...buildings[key] }))
        .filter(building => building.projectId === projectId)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return [];
  }
}

export async function getBuilding(buildingId) {
  try {
    const buildingRef = ref(database, `${BUILDINGS_PATH}/${buildingId}`);
    const snapshot = await get(buildingRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching building:', error);
    throw error;
  }
}

export async function updateBuilding(buildingId, updates) {
  try {
    const buildingRef = ref(database, `${BUILDINGS_PATH}/${buildingId}`);
    await update(buildingRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return await getBuilding(buildingId);
  } catch (error) {
    console.error('Error updating building:', error);
    throw error;
  }
}

// ============================================================
// FLOORS
// ============================================================

export async function createFloor(floorData, buildingId, projectId, userId) {
  try {
    const floorsRef = ref(database, FLOORS_PATH);
    const newFloorRef = push(floorsRef);
    const floorId = newFloorRef.key;

    const floor = {
      floorId,
      buildingId,
      projectId,
      name: floorData.name,
      levelNumber: floorData.levelNumber || 0,
      code: floorData.code || '',
      description: floorData.description || '',
      status: floorData.status || 'planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId || '',
    };

    await set(newFloorRef, floor);
    return floor;
  } catch (error) {
    console.error('Error creating floor:', error);
    throw error;
  }
}

export async function getFloorsByBuilding(buildingId) {
  try {
    const floorsRef = ref(database, FLOORS_PATH);
    const snapshot = await get(floorsRef);
    
    if (snapshot.exists()) {
      const floors = snapshot.val();
      return Object.keys(floors)
        .map(key => ({ ...floors[key] }))
        .filter(floor => floor.buildingId === buildingId)
        .sort((a, b) => a.levelNumber - b.levelNumber);
    }
    return [];
  } catch (error) {
    console.error('Error fetching floors:', error);
    return [];
  }
}

export async function getFloor(floorId) {
  try {
    const floorRef = ref(database, `${FLOORS_PATH}/${floorId}`);
    const snapshot = await get(floorRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching floor:', error);
    throw error;
  }
}

export async function updateFloor(floorId, updates) {
  try {
    const floorRef = ref(database, `${FLOORS_PATH}/${floorId}`);
    await update(floorRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return await getFloor(floorId);
  } catch (error) {
    console.error('Error updating floor:', error);
    throw error;
  }
}

// ============================================================
// WINGS
// ============================================================

export async function createWing(wingData, floorId, buildingId, projectId, userId) {
  try {
    const wingsRef = ref(database, WINGS_PATH);
    const newWingRef = push(wingsRef);
    const wingId = newWingRef.key;

    const wing = {
      wingId,
      floorId,
      buildingId,
      projectId,
      name: wingData.name,
      code: wingData.code || '',
      description: wingData.description || '',
      status: wingData.status || 'planned',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId || '',
    };

    await set(newWingRef, wing);
    return wing;
  } catch (error) {
    console.error('Error creating wing:', error);
    throw error;
  }
}

export async function getWingsByFloor(floorId) {
  try {
    const wingsRef = ref(database, WINGS_PATH);
    const snapshot = await get(wingsRef);
    
    if (snapshot.exists()) {
      const wings = snapshot.val();
      return Object.keys(wings)
        .map(key => ({ ...wings[key] }))
        .filter(wing => wing.floorId === floorId)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  } catch (error) {
    console.error('Error fetching wings:', error);
    return [];
  }
}

export async function getWing(wingId) {
  try {
    const wingRef = ref(database, `${WINGS_PATH}/${wingId}`);
    const snapshot = await get(wingRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching wing:', error);
    throw error;
  }
}

export async function updateWing(wingId, updates) {
  try {
    const wingRef = ref(database, `${WINGS_PATH}/${wingId}`);
    await update(wingRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return await getWing(wingId);
  } catch (error) {
    console.error('Error updating wing:', error);
    throw error;
  }
}

// ============================================================
// SPACES
// ============================================================

export async function createSpace(spaceData, wingId, floorId, buildingId, projectId, userId) {
  try {
    const spacesRef = ref(database, SPACES_PATH);
    const newSpaceRef = push(spacesRef);
    const spaceId = newSpaceRef.key;

    const space = {
      spaceId,
      wingId,
      floorId,
      buildingId,
      projectId,
      name: spaceData.name,
      code: spaceData.code || '',
      type: spaceData.type || 'Other',
      status: spaceData.status || 'planned',
      description: spaceData.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId || '',
    };

    await set(newSpaceRef, space);
    return space;
  } catch (error) {
    console.error('Error creating space:', error);
    throw error;
  }
}

export async function getSpacesByWing(wingId) {
  try {
    const spacesRef = ref(database, SPACES_PATH);
    const snapshot = await get(spacesRef);
    
    if (snapshot.exists()) {
      const spaces = snapshot.val();
      return Object.keys(spaces)
        .map(key => ({ ...spaces[key] }))
        .filter(space => space.wingId === wingId)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  } catch (error) {
    console.error('Error fetching spaces by wing:', error);
    return [];
  }
}

export async function getSpacesByFloor(floorId) {
  try {
    const spacesRef = ref(database, SPACES_PATH);
    const snapshot = await get(spacesRef);
    
    if (snapshot.exists()) {
      const spaces = snapshot.val();
      return Object.keys(spaces)
        .map(key => ({ ...spaces[key] }))
        .filter(space => space.floorId === floorId)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  } catch (error) {
    console.error('Error fetching spaces by floor:', error);
    return [];
  }
}

export async function getSpacesByBuilding(buildingId) {
  try {
    const spacesRef = ref(database, SPACES_PATH);
    const snapshot = await get(spacesRef);
    
    if (snapshot.exists()) {
      const spaces = snapshot.val();
      return Object.keys(spaces)
        .map(key => ({ ...spaces[key] }))
        .filter(space => space.buildingId === buildingId)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  } catch (error) {
    console.error('Error fetching spaces by building:', error);
    return [];
  }
}

export async function getSpace(spaceId) {
  try {
    const spaceRef = ref(database, `${SPACES_PATH}/${spaceId}`);
    const snapshot = await get(spaceRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching space:', error);
    throw error;
  }
}

export async function updateSpace(spaceId, updates) {
  try {
    const spaceRef = ref(database, `${SPACES_PATH}/${spaceId}`);
    await update(spaceRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return await getSpace(spaceId);
  } catch (error) {
    console.error('Error updating space:', error);
    throw error;
  }
}

// ============================================================
// EFFICIENT CASCADE DELETE FUNCTIONS
// ============================================================

/**
 * Universal helper to wipe all dependencies below a certain hierarchy node
 */
async function wipeHierarchyData(fieldName, id, pathsToWipe) {
  // 1. Wipe standard flat collections
  for (const path of pathsToWipe) {
    const q = query(ref(database, path), orderByChild(fieldName), equalTo(id));
    const snap = await get(q);
    if (snap.exists()) {
      for (const key of Object.keys(snap.val())) {
        await remove(ref(database, `${path}/${key}`));
      }
    }
  }

  // 2. Wipe Tasks and their connected Submissions
  const qTasks = query(ref(database, 'tasks'), orderByChild(fieldName), equalTo(id));
  const snapTasks = await get(qTasks);
  if (snapTasks.exists()) {
    const tasks = snapTasks.val();
    const taskIds = Object.keys(tasks);

    // Wipe Submissions linked to these tasks
    const subSnap = await get(ref(database, 'taskSubmissions'));
    if (subSnap.exists()) {
      const subs = subSnap.val();
      for (const [key, sub] of Object.entries(subs)) {
        if (taskIds.includes(sub.taskId)) {
          await remove(ref(database, `taskSubmissions/${key}`));
        }
      }
    }

    // Wipe Tasks
    for (const key of taskIds) {
      await remove(ref(database, `tasks/${key}`));
    }
  }
}

export async function deleteSpace(spaceId) {
  try {
    await wipeHierarchyData('spaceId', spaceId, ['activities']);
    await remove(ref(database, `${SPACES_PATH}/${spaceId}`));
    return true;
  } catch (error) {
    console.error('Error deleting space:', error);
    throw error;
  }
}

export async function deleteWing(wingId) {
  try {
    await wipeHierarchyData('wingId', wingId, ['spaces', 'activities']);
    await remove(ref(database, `${WINGS_PATH}/${wingId}`));
    return true;
  } catch (error) {
    console.error('Error deleting wing:', error);
    throw error;
  }
}

export async function deleteFloor(floorId) {
  try {
    await wipeHierarchyData('floorId', floorId, ['wings', 'spaces', 'activities']);
    await remove(ref(database, `${FLOORS_PATH}/${floorId}`));
    return true;
  } catch (error) {
    console.error('Error deleting floor:', error);
    throw error;
  }
}

export async function deleteBuilding(buildingId) {
  try {
    await wipeHierarchyData('buildingId', buildingId, ['floors', 'wings', 'spaces', 'activities']);
    await remove(ref(database, `${BUILDINGS_PATH}/${buildingId}`));
    return true;
  } catch (error) {
    console.error('Error deleting building:', error);
    throw error;
  }
}