import { UserRole } from '../auth/auth.models';

/** Mirror of `AdminUserDto` (Torii.Api.Dtos): user as listed in the administration. */
export interface AdminUser {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: UserRole;
  isActive: boolean;
  customerCount: number;
  createdAt: string;
  updatedAt: string | null;
}

/** Mirror of `AdminUserCreateRequest`. */
export interface AdminUserCreate {
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
}

/** Mirror of `AdminUserUpdateRequest`; `newPassword: null` keeps the current password. */
export interface AdminUserUpdate {
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  newPassword: string | null;
}
