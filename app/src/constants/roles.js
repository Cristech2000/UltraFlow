/**
 * UltraFlow Role Constants
 * Defined in order of hierarchy (lowest to highest)
 */

export const ROLES = {
  ELECTRICIAN: 'electrician',
  FOREMAN: 'foreman',
  DOCUMENTATION_ASSISTANT: 'documentation_assistant',
  SUPERVISOR: 'supervisor',
  ENGINEER: 'engineer',
  HR: 'hr',
  DIRECTOR: 'director',
};

export const ROLE_HIERARCHY = {
  [ROLES.ELECTRICIAN]: 1,
  [ROLES.FOREMAN]: 2,
  [ROLES.DOCUMENTATION_ASSISTANT]: 3,
  [ROLES.SUPERVISOR]: 4,
  [ROLES.ENGINEER]: 5,
  [ROLES.HR]: 6,
  [ROLES.DIRECTOR]: 7,
};

export const ROLE_DISPLAY_NAMES = {
  [ROLES.ELECTRICIAN]: 'Electrician',
  [ROLES.FOREMAN]: 'Foreman',
  [ROLES.DOCUMENTATION_ASSISTANT]: 'Documentation Assistant',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.ENGINEER]: 'Engineer',
  [ROLES.HR]: 'HR',
  [ROLES.DIRECTOR]: 'Director',
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.ELECTRICIAN]: 'Performs electrical installation work on site',
  [ROLES.FOREMAN]: 'Manages electricians and assigns daily tasks',
  [ROLES.DOCUMENTATION_ASSISTANT]: 'Site Secretary - Documents everything, tracks progress, creates reports',
  [ROLES.SUPERVISOR]: 'Oversees all site operations and quality',
  [ROLES.ENGINEER]: 'Ensures technical quality and compliance',
  [ROLES.HR]: 'Manages personnel and roles',
  [ROLES.DIRECTOR]: 'Executive oversight and strategic decisions',
};

/**
 * Check if a user has a specific role or higher
 */
export function hasRoleOrHigher(userRole, requiredRole) {
  const hierarchy = ROLE_HIERARCHY;
  return hierarchy[userRole] >= hierarchy[requiredRole];
}

/**
 * Check if a user has exactly a specific role
 */
export function hasExactRole(userRole, requiredRole) {
  return userRole === requiredRole;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role) {
  return ROLE_DISPLAY_NAMES[role] || role;
}

/**
 * Get role description
 */
export function getRoleDescription(role) {
  return ROLE_DESCRIPTIONS[role] || '';
}