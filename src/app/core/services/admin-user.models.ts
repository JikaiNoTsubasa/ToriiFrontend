import { AccountStatus, UserRole } from '../auth/auth.models';
import { AccountType } from '../auth/singpass.models';

/**
 * Mirror of `AdminUserDto` (Torii.Api.Dtos): user as listed in the administration (pending
 * account requests excluded: see the account requests page).
 */
export interface AdminUser {
  id: number;
  email: string;
  displayName: string;
  /** Free-text position in the company (`null` = none). */
  position: string | null;
  avatarUrl: string;
  role: UserRole;
  isActive: boolean;
  /** `REJECTED` = declined account request; enabling it approves it. */
  status: AccountStatus;
  /** How the user signs in (`SINGPASS` accounts have no usable password). */
  accountType: AccountType;
  customerCount: number;
  createdAt: string;
  updatedAt: string | null;
  /** Deleted account (only listed on request): read-only, `email` is the released one. */
  isDeleted: boolean;
  deletedAt: string | null;
}

/** Original address of a deleted account (`deleted-{id}-{unix seconds}-{email}`, see `UserManager`). */
export function originalEmail(user: AdminUser): string {
  return user.isDeleted ? user.email.replace(/^deleted-\d+-\d+-/, '') : user.email;
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
