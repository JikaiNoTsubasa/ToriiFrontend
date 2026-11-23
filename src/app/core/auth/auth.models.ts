import { apiEnum, ApiEnumValue } from '../http/api-enum';

/** Application role — mirror of the backend `UserRole` enum. */
export const USER_ROLES = apiEnum('USER', 'ADMIN');
export type UserRole = ApiEnumValue<typeof USER_ROLES>;

/** Approval state of an account — mirror of the backend `AccountStatus` enum. */
export const ACCOUNT_STATUSES = apiEnum('PENDING', 'ACTIVE', 'REJECTED');
export type AccountStatus = ApiEnumValue<typeof ACCOUNT_STATUSES>;

/**
 * `code` of the 403 returned by `/auth/login` when the credentials are valid but the account
 * is not approved (mirror of `AccountNotActiveException`).
 */
export const ACCOUNT_PENDING_CODE = 'ACCOUNT_PENDING';
export const ACCOUNT_REJECTED_CODE = 'ACCOUNT_REJECTED';

export interface UserDto {
  id: number;
  email: string;
  displayName: string;
  /** Free-text position in the company (`null` = none). */
  position: string | null;
  avatarUrl: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: UserDto;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** Account request: the account waits for an administrator's approval. */
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  /** Free-text position in the company (`null` = none). */
  position: string | null;
}

/** Mirror of `RegistrationResponse`: no session, the account is `PENDING`. */
export interface RegistrationResponse {
  email: string;
  status: AccountStatus;
}
