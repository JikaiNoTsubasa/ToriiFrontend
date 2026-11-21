import { UserRole } from '../auth/auth.models';

/** Mirror of `AdminUserDto` (Torii.Api.Dtos): user as listed in the administration. */
export interface AdminUser {
  id: number;
  email: string;
  displayName: string;
  /** Free-text position in the company (`null` = none). */
  position: string | null;
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
  position: string | null;
  password: string;
  role: UserRole;
}

/** Mirror of `AdminUserUpdateRequest`; `newPassword: null` keeps the current password. */
export interface AdminUserUpdate {
  email: string;
  displayName: string;
  position: string | null;
  role: UserRole;
  isActive: boolean;
  newPassword: string | null;
}
