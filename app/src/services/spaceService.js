import { database } from '../lib/firebase';
import { ref, set, get, update, push, remove } from 'firebase/database';

/**
 * Space Service - Handles Buildings, Floors, Wings, and Spaces
 * With Cascade Delete functionality
 */

// ============================================================
// BUILDINGS
// ============================================================

const BUILDINGS_PATH = 'buildings';

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

const FLOORS_PATH = 'floors';

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

const WINGS_PATH = 'wings';

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

const SPACES_PATH = 'spaces';

export const SPACE_TYPES = [
  'Bedroom',
  'Bathroom',
  'Kitchen',
  'Living Room',
  'Dining Room',
  'Corridor',
  'Staircase',
  'Lobby',
  'Balcony',
  'Roof',
  'Plant Room',
  'Electrical Room',
  'Store',
  'External Area',
  'Office',
  'Meeting Room',
  'Pantry',
  'Utility Room',
  'Garage',
  'Other',
];

export async function createSpace(spaceData, wingId, floorId, buildingId, projectId, userId) {
  try {
    const wing = await getWing(wingId);
    if (!wing) {
      throw new Error('Parent Wing not found');
    }

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
// CASCADE DELETE FUNCTIONS
// ============================================================

/**
 * DELETE SPACE - Deletes a space and ALL its activities
 */
export async function deleteSpace(spaceId) {
  try {
    console.log(`🗑️ Deleting space: ${spaceId}`);
    
    // 1. Find and delete all activities for this space
    const activitiesRef = ref(database, 'activities');
    const snapshot = await get(activitiesRef);
    
    if (snapshot.exists()) {
      const activities = snapshot.val();
      const spaceActivities = Object.keys(activities)
        .filter(key => activities[key].spaceId === spaceId);
      
      console.log(`   📝 Found ${spaceActivities.length} activities to delete`);
      
      for (const key of spaceActivities) {
        await remove(ref(database, `activities/${key}`));
        console.log(`   ✅ Deleted activity: ${key}`);
      }
    }
    
    // 2. Delete tasks for this space
    const tasksRef = ref(database, 'tasks');
    const tasksSnapshot = await get(tasksRef);
    
    if (tasksSnapshot.exists()) {
      const tasks = tasksSnapshot.val();
      const spaceTasks = Object.keys(tasks)
        .filter(key => {
          const task = tasks[key];
          return task.scopeIds && task.scopeIds.includes(spaceId);
        });
      
      console.log(`   📝 Found ${spaceTasks.length} tasks to delete`);
      
      for (const key of spaceTasks) {
        await remove(ref(database, `tasks/${key}`));
        console.log(`   ✅ Deleted task: ${key}`);
      }
    }
    
    // 3. Delete task submissions for this space
    const submissionsRef = ref(database, 'taskSubmissions');
    const submissionsSnapshot = await get(submissionsRef);
    
    if (submissionsSnapshot.exists()) {
      const submissions = submissionsSnapshot.val();
      const spaceSubmissions = Object.keys(submissions)
        .filter(key => {
          const sub = submissions[key];
          return sub.spaceId === spaceId;
        });
      
      for (const key of spaceSubmissions) {
        await remove(ref(database, `taskSubmissions/${key}`));
        console.log(`   ✅ Deleted task submission: ${key}`);
      }
    }
    
    // 4. Delete the space itself
    const spaceRef = ref(database, `${SPACES_PATH}/${spaceId}`);
    await remove(spaceRef);
    console.log(`   ✅ Deleted space: ${spaceId}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting space:', error);
    throw error;
  }
}

/**
 * DELETE WING - Deletes a wing, all its spaces, and ALL activities
 */
export async function deleteWing(wingId) {
  try {
    console.log(`🗑️ Deleting wing: ${wingId}`);
    
    // 1. Get all spaces in this wing
    const spaces = await getSpacesByWing(wingId);
    console.log(`   📍 Found ${spaces.length} spaces to delete`);
    
    // 2. Delete each space (which deletes its activities)
    for (const space of spaces) {
      await deleteSpace(space.spaceId);
    }
    
    // 3. Delete wing-wide activities
    const activitiesRef = ref(database, 'activities');
    const snapshot = await get(activitiesRef);
    
    if (snapshot.exists()) {
      const activities = snapshot.val();
      const wingActivities = Object.keys(activities)
        .filter(key => activities[key].wingId === wingId && activities[key].scope === 'wing');
      
      console.log(`   📝 Found ${wingActivities.length} wing-wide activities to delete`);
      
      for (const key of wingActivities) {
        await remove(ref(database, `activities/${key}`));
        console.log(`   ✅ Deleted activity: ${key}`);
      }
    }
    
    // 4. Delete tasks for this wing
    const tasksRef = ref(database, 'tasks');
    const tasksSnapshot = await get(tasksRef);
    
    if (tasksSnapshot.exists()) {
      const tasks = tasksSnapshot.val();
      const wingTasks = Object.keys(tasks)
        .filter(key => tasks[key].wingId === wingId);
      
      for (const key of wingTasks) {
        await remove(ref(database, `tasks/${key}`));
        console.log(`   ✅ Deleted task: ${key}`);
      }
    }
    
    // 5. Delete the wing itself
    const wingRef = ref(database, `${WINGS_PATH}/${wingId}`);
    await remove(wingRef);
    console.log(`   ✅ Deleted wing: ${wingId}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting wing:', error);
    throw error;
  }
}

/**
 * DELETE FLOOR - Deletes a floor, all its wings, spaces, and ALL activities
 */
export async function deleteFloor(floorId) {
  try {
    console.log(`🗑️ Deleting floor: ${floorId}`);
    
    // 1. Get all wings in this floor
    const wings = await getWingsByFloor(floorId);
    console.log(`   🏗️ Found ${wings.length} wings to delete`);
    
    // 2. Delete each wing (which deletes its spaces and activities)
    for (const wing of wings) {
      await deleteWing(wing.wingId);
    }
    
    // 3. Delete floor-wide activities
    const activitiesRef = ref(database, 'activities');
    const snapshot = await get(activitiesRef);
    
    if (snapshot.exists()) {
      const activities = snapshot.val();
      const floorActivities = Object.keys(activities)
        .filter(key => activities[key].floorId === floorId && activities[key].scope === 'level');
      
      console.log(`   📝 Found ${floorActivities.length} floor-wide activities to delete`);
      
      for (const key of floorActivities) {
        await remove(ref(database, `activities/${key}`));
        console.log(`   ✅ Deleted activity: ${key}`);
      }
    }
    
    // 4. Delete tasks for this floor
    const tasksRef = ref(database, 'tasks');
    const tasksSnapshot = await get(tasksRef);
    
    if (tasksSnapshot.exists()) {
      const tasks = tasksSnapshot.val();
      const floorTasks = Object.keys(tasks)
        .filter(key => tasks[key].floorId === floorId);
      
      for (const key of floorTasks) {
        await remove(ref(database, `tasks/${key}`));
        console.log(`   ✅ Deleted task: ${key}`);
      }
    }
    
    // 5. Delete the floor itself
    const floorRef = ref(database, `${FLOORS_PATH}/${floorId}`);
    await remove(floorRef);
    console.log(`   ✅ Deleted floor: ${floorId}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting floor:', error);
    throw error;
  }
}

/**
 * DELETE BUILDING - Deletes a building, all its floors, wings, spaces, and ALL activities
 */
export async function deleteBuilding(buildingId) {
  try {
    console.log(`🗑️ Deleting building: ${buildingId}`);
    
    // 1. Get all floors in this building
    const floors = await getFloorsByBuilding(buildingId);
    console.log(`   📐 Found ${floors.length} floors to delete`);
    
    // 2. Delete each floor (which deletes everything)
    for (const floor of floors) {
      await deleteFloor(floor.floorId);
    }
    
    // 3. Delete building-wide activities
    const activitiesRef = ref(database, 'activities');
    const snapshot = await get(activitiesRef);
    
    if (snapshot.exists()) {
      const activities = snapshot.val();
      const buildingActivities = Object.keys(activities)
        .filter(key => activities[key].buildingId === buildingId && activities[key].scope === 'building');
      
      console.log(`   📝 Found ${buildingActivities.length} building-wide activities to delete`);
      
      for (const key of buildingActivities) {
        await remove(ref(database, `activities/${key}`));
        console.log(`   ✅ Deleted activity: ${key}`);
      }
    }
    
    // 4. Delete tasks for this building
    const tasksRef = ref(database, 'tasks');
    const tasksSnapshot = await get(tasksRef);
    
    if (tasksSnapshot.exists()) {
      const tasks = tasksSnapshot.val();
      const buildingTasks = Object.keys(tasks)
        .filter(key => tasks[key].buildingId === buildingId);
      
      for (const key of buildingTasks) {
        await remove(ref(database, `tasks/${key}`));
        console.log(`   ✅ Deleted task: ${key}`);
      }
    }
    
    // 5. Delete the building itself
    const buildingRef = ref(database, `${BUILDINGS_PATH}/${buildingId}`);
    await remove(buildingRef);
    console.log(`   ✅ Deleted building: ${buildingId}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting building:', error);
    throw error;
  }
}