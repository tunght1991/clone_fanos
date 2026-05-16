import type { AuthUserRole } from './auth.types.js';

export type AuthRequirement = AuthUserRole;

const roleOrder: Record<AuthUserRole, number> = {
  user: 1,
  admin: 2,
};

export function hasRequiredRole(currentRole: AuthUserRole, requiredRole: AuthRequirement): boolean {
  return roleOrder[currentRole] >= roleOrder[requiredRole];
}

