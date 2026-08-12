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

/**
 * 🔥 MEGA CLONER: Deep clones a Floor, including all its Wings, Spaces, and Activities.
 */
export async function bulkCloneFloor(floorId, cloneConfig, userId) {
  try {
    const origFloor = await getFloor(floorId);
    if (!origFloor) throw new Error('Original floor not found');

    const { count, prefix, startNumber } = cloneConfig;

    // 1. Fetch all hierarchical children
    const origWings = await getWingsByFloor(floorId);
    const origSpaces = await getSpacesByFloor(floorId);
    
    // Fetch all activities attached anywhere within this floor
    const activitiesQuery = query(ref(database, 'activities'), orderByChild('floorId'), equalTo(floorId));
    const actsSnap = await get(activitiesQuery);
    const origActs = actsSnap.exists() ? Object.values(actsSnap.val()) : [];

    const floorsRef = ref(database, FLOORS_PATH);
    const wingsRef = ref(database, WINGS_PATH);
    const spacesRef = ref(database, SPACES_PATH);
    const activitiesRef = ref(database, 'activities');
    
    const createdFloors = [];

    // 2. Run the duplication loop
    for (let i = 0; i < count; i++) {
      const currentNumber = startNumber + i;
      const newFloorName = `${prefix}${currentNumber}`;
      
      // Create New Floor
      const newFloorRef = push(floorsRef);
      const newFloorId = newFloorRef.key;
      
      const newFloor = {
        ...origFloor,
        floorId: newFloorId,
        name: newFloorName,
        levelNumber: (origFloor.levelNumber || 0) + i + 1, // Auto-increment structural level
        code: origFloor.code ? `${origFloor.code.replace(/\d+$/, '')}${currentNumber}` : '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId || '',
      };
      await set(newFloorRef, newFloor);
      createdFloors.push(newFloor);

      // Maps to track old IDs to new IDs so child elements get linked to the correct clones
      const wingIdMap = {};
      const spaceIdMap = {};

      // Clone Wings
      for (const ow of origWings) {
        const newWingRef = push(wingsRef);
        const newWingId = newWingRef.key;
        wingIdMap[ow.wingId] = newWingId;

        const newWing = {
          ...ow,
          wingId: newWingId,
          floorId: newFloorId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: userId || '',
        };
        await set(newWingRef, newWing);
      }

      // Clone Spaces
      for (const os of origSpaces) {
        const newSpaceRef = push(spacesRef);
        const newSpaceId = newSpaceRef.key;
        spaceIdMap[os.spaceId] = newSpaceId;

        const newSpace = {
          ...os,
          spaceId: newSpaceId,
          floorId: newFloorId,
          wingId: wingIdMap[os.wingId] || os.wingId, // Link to the newly cloned wing!
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: userId || '',
        };
        await set(newSpaceRef, newSpace);
      }

      // Clone Activities
      for (const oa of origActs) {
        const newActRef = push(activitiesRef);
        const newActId = newActRef.key;
        
        const newAct = {
          ...oa,
          activityId: newActId,
          floorId: newFloorId,
          wingId: oa.wingId ? wingIdMap[oa.wingId] : null,
          spaceId: oa.spaceId ? spaceIdMap[oa.spaceId] : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: userId || '',
          // Reset progress for the fresh clone
          progress: 0,
          automaticProgress: 0,
          status: 'not_started',
          actualStartDate: null,
          actualCompletionDate: null,
          manualOverrideReason: null,
          manualOverrideBy: null,
          manualOverrideAt: null,
          manualProgress: null,
          progressSource: 'automatic'
        };
        await set(newActRef, newAct);
      }
    }

    return createdFloors;
  } catch (error) {
    console.error('Error in deep floor cloning:', error);
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

/**
 * 🔥 SMART BULK CLONE: Generates names automatically using prefix + startNumber
 */
export async function bulkCloneSpace(spaceId, cloneConfig, userId) {
  try {
    const originalSpace = await getSpace(spaceId);
    if (!originalSpace) throw new Error('Original space not found');

    const { count, prefix, startNumber } = cloneConfig;

    const activitiesQuery = query(ref(database, 'activities'), orderByChild('spaceId'), equalTo(spaceId));
    const actsSnap = await get(activitiesQuery);
    const originalActivities = actsSnap.exists() ? Object.values(actsSnap.val()) : [];

    const spacesRef = ref(database, SPACES_PATH);
    const activitiesRef = ref(database, 'activities');
    const createdSpaces = [];

    for (let i = 0; i < count; i++) {
      const newSpaceRef = push(spacesRef);
      const newSpaceId = newSpaceRef.key;
      
      const currentNumber = startNumber + i;
      const newSpaceName = `${prefix}${currentNumber}`;

      const space = {
        spaceId: newSpaceId,
        wingId: originalSpace.wingId,
        floorId: originalSpace.floorId,
        buildingId: originalSpace.buildingId,
        projectId: originalSpace.projectId,
        name: newSpaceName,
        code: originalSpace.code ? `${originalSpace.code}-${currentNumber}` : '',
        type: originalSpace.type,
        status: originalSpace.status,
        description: originalSpace.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId || '',
      };

      await set(newSpaceRef, space);
      createdSpaces.push(space);

      // Clone activities
      for (const origAct of originalActivities) {
        const newActRef = push(activitiesRef);
        const newActId = newActRef.key;
        
        const newAct = {
          ...origAct,
          activityId: newActId,
          spaceId: newSpaceId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: userId || '',
          progress: 0,
          automaticProgress: 0,
          status: 'not_started',
          actualStartDate: null,
          actualCompletionDate: null,
          manualOverrideReason: null,
          manualOverrideBy: null,
          manualOverrideAt: null,
          manualProgress: null,
          progressSource: 'automatic'
        };
        await set(newActRef, newAct);
      }
    }

    return createdSpaces;
  } catch (error) {
    console.error('Error bulk cloning space:', error);
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

async function wipeHierarchyData(fieldName, id, pathsToWipe) {
  for (const path of pathsToWipe) {
    const q = query(ref(database, path), orderByChild(fieldName), equalTo(id));
    const snap = await get(q);
    if (snap.exists()) {
      for (const key of Object.keys(snap.val())) {
        await remove(ref(database, `${path}/${key}`));
      }
    }
  }

  const qTasks = query(ref(database, 'tasks'), orderByChild(fieldName), equalTo(id));
  const snapTasks = await get(qTasks);
  if (snapTasks.exists()) {
    const tasks = snapTasks.val();
    const taskIds = Object.keys(tasks);

    const subSnap = await get(ref(database, 'taskSubmissions'));
    if (subSnap.exists()) {
      const subs = subSnap.val();
      for (const [key, sub] of Object.entries(subs)) {
        if (taskIds.includes(sub.taskId)) {
          await remove(ref(database, `taskSubmissions/${key}`));
        }
      }
    }

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