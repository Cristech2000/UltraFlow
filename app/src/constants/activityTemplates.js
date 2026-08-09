/**
 * Activity Templates for UltraFlow
 * Predefined activity lists for different construction disciplines
 */

export const ACTIVITY_TEMPLATES = {
  ELECTRICAL_INSTALLATION: {
    name: 'Electrical Installation',
    discipline: 'electrical',
    activities: [
      { name: 'Routing', code: 'ELEC-001', order: 1 },
      { name: 'Dropping', code: 'ELEC-002', order: 2 },
      { name: 'CU Mounting', code: 'ELEC-003', order: 3 },
      { name: 'Boxing', code: 'ELEC-004', order: 4 },
      { name: 'Wall Chasing', code: 'ELEC-005', order: 5 },
      { name: 'Plastering', code: 'ELEC-006', order: 6 },
      { name: 'Accessory Fitting', code: 'ELEC-007', order: 7 },
      { name: 'Testing', code: 'ELEC-008', order: 8 },
    ]
  },
  FIRST_FIX: {
    name: 'First Fix Electrical',
    discipline: 'electrical',
    activities: [
      { name: 'Chasing', code: 'FFIX-001', order: 1 },
      { name: 'Routing', code: 'FFIX-002', order: 2 },
      { name: 'Dropping', code: 'FFIX-003', order: 3 },
      { name: 'Boxing', code: 'FFIX-004', order: 4 },
      { name: 'CU Installation', code: 'FFIX-005', order: 5 },
    ]
  },
  SECOND_FIX: {
    name: 'Second Fix Electrical',
    discipline: 'electrical',
    activities: [
      { name: 'Wiring', code: 'SFIX-001', order: 1 },
      { name: 'Socket Installation', code: 'SFIX-002', order: 2 },
      { name: 'Switch Installation', code: 'SFIX-003', order: 3 },
      { name: 'Lighting Installation', code: 'SFIX-004', order: 4 },
      { name: 'Fan Installation', code: 'SFIX-005', order: 5 },
    ]
  },
  TESTING_COMMISSIONING: {
    name: 'Testing & Commissioning',
    discipline: 'electrical',
    activities: [
      { name: 'Continuity Testing', code: 'TEST-001', order: 1 },
      { name: 'Insulation Resistance Testing', code: 'TEST-002', order: 2 },
      { name: 'Polarity Testing', code: 'TEST-003', order: 3 },
      { name: 'Functional Testing', code: 'TEST-004', order: 4 },
    ]
  },
  CIVIL_WORKS: {
    name: 'Civil Works',
    discipline: 'civil',
    activities: [
      { name: 'Foundation', code: 'CIV-001', order: 1 },
      { name: 'Structural Framing', code: 'CIV-002', order: 2 },
      { name: 'Flooring', code: 'CIV-003', order: 3 },
      { name: 'Plastering', code: 'CIV-004', order: 4 },
      { name: 'Painting', code: 'CIV-005', order: 5 },
    ]
  },
  PLUMBING: {
    name: 'Plumbing Installation',
    discipline: 'plumbing',
    activities: [
      { name: 'Pipe Routing', code: 'PL-001', order: 1 },
      { name: 'Pipe Fixing', code: 'PL-002', order: 2 },
      { name: 'Jointing', code: 'PL-003', order: 3 },
      { name: 'Test & Commissioning', code: 'PL-004', order: 4 },
    ]
  },
  HVAC: {
    name: 'HVAC Installation',
    discipline: 'hvac',
    activities: [
      { name: 'Ducting', code: 'HVAC-001', order: 1 },
      { name: 'Insulation', code: 'HVAC-002', order: 2 },
      { name: 'Equipment Installation', code: 'HVAC-003', order: 3 },
      { name: 'Testing', code: 'HVAC-004', order: 4 },
    ]
  },
};

/**
 * Get all available template names
 */
export function getTemplateNames() {
  return Object.keys(ACTIVITY_TEMPLATES).map(key => ({
    id: key,
    name: ACTIVITY_TEMPLATES[key].name,
    discipline: ACTIVITY_TEMPLATES[key].discipline,
    activityCount: ACTIVITY_TEMPLATES[key].activities.length,
  }));
}

/**
 * Get a template by ID
 */
export function getTemplateById(templateId) {
  return ACTIVITY_TEMPLATES[templateId] || null;
}