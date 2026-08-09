import { database } from '../lib/firebase';
import { ref, set, get, update, push, remove } from 'firebase/database';

/**
 * Space Service - Handles Buildings, Floors, Wings, and Spaces
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
    console.log('📝 Creating space with data:', { spaceData, wingId, floorId, buildingId, projectId });
    
    // Verify parent exists
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
    console.log('✅ Space created successfully:', space);
    return space;
  } catch (error) {
    console.error('❌ Error creating space:', error);
    throw error;
  }
}

export async function getSpacesByWing(wingId) {
  try {
    console.log('🔍 Fetching spaces for wing:', wingId);
    const spacesRef = ref(database, SPACES_PATH);
    const snapshot = await get(spacesRef);
    
    if (snapshot.exists()) {
      const spaces = snapshot.val();
      console.log('📦 All spaces in database:', spaces);
      
      const result = Object.keys(spaces)
        .map(key => {
          const space = spaces[key];
          console.log(`  - Space ${key}:`, space);
          return { ...space };
        })
        .filter(space => space.wingId === wingId)
        .sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`✅ Found ${result.length} spaces for wing ${wingId}:`, result);
      return result;
    }
    console.log('ℹ️ No spaces found in database');
    return [];
  } catch (error) {
    console.error('❌ Error fetching spaces by wing:', error);
    return [];
  }
}

export async function getSpacesByFloor(floorId) {
  try {
    console.log('🔍 Fetching spaces for floor:', floorId);
    const spacesRef = ref(database, SPACES_PATH);
    const snapshot = await get(spacesRef);
    
    if (snapshot.exists()) {
      const spaces = snapshot.val();
      const result = Object.keys(spaces)
        .map(key => ({ ...spaces[key] }))
        .filter(space => space.floorId === floorId)
        .sort((a, b) => a.name.localeCompare(b.name));
      console.log(`✅ Found ${result.length} spaces for floor ${floorId}:`, result);
      return result;
    }
    console.log('ℹ️ No spaces found for floor:', floorId);
    return [];
  } catch (error) {
    console.error('Error fetching spaces by floor:', error);
    return [];
  }
}

export async function getSpacesByBuilding(buildingId) {
  try {
    console.log('🔍 Fetching spaces for building:', buildingId);
    const spacesRef = ref(database, SPACES_PATH);
    const snapshot = await get(spacesRef);
    
    if (snapshot.exists()) {
      const spaces = snapshot.val();
      const result = Object.keys(spaces)
        .map(key => ({ ...spaces[key] }))
        .filter(space => space.buildingId === buildingId)
        .sort((a, b) => a.name.localeCompare(b.name));
      console.log(`✅ Found ${result.length} spaces for building ${buildingId}:`, result);
      return result;
    }
    console.log('ℹ️ No spaces found for building:', buildingId);
    return [];
  } catch (error) {
    console.error('Error fetching spaces by building:', error);
    return [];
  }
}

export async function getSpacesByProject(projectId) {
  try {
    console.log('🔍 Fetching spaces for project:', projectId);
    const spacesRef = ref(database, SPACES_PATH);
    const snapshot = await get(spacesRef);
    
    if (snapshot.exists()) {
      const spaces = snapshot.val();
      const result = Object.keys(spaces)
        .map(key => ({ ...spaces[key] }))
        .filter(space => space.projectId === projectId)
        .sort((a, b) => a.name.localeCompare(b.name));
      console.log(`✅ Found ${result.length} spaces for project ${projectId}:`, result);
      return result;
    }
    console.log('ℹ️ No spaces found for project:', projectId);
    return [];
  } catch (error) {
    console.error('Error fetching spaces by project:', error);
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

export async function deleteSpace(spaceId) {
  try {
    const spaceRef = ref(database, `${SPACES_PATH}/${spaceId}`);
    await update(spaceRef, {
      status: 'archived',
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error deleting space:', error);
    throw error;
  }
}