import { apiEnum, ApiEnumValue } from '../http/api-enum';

/** Application role — mirror of the backend `UserRole` enum. */
export const USER_ROLES = apiEnum('USER', 'ADMIN');
export type UserRole = ApiEnumValue<typeof USER_ROLES>;

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

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}
