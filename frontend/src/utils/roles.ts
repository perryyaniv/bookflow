import { UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'מנהל',
  editor: 'עורך',
  viewer: 'צופה',
};

export function hasWriteAccess(role?: UserRole): boolean {
  return role === 'admin' || role === 'editor';
}
