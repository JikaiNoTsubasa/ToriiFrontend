import { apiEnum, ApiEnumValue } from '../http/api-enum';
import { AuthResponse } from './auth.models';

/** How an account signs in — mirror of the backend `AccountType` enum. */
export const ACCOUNT_TYPES = apiEnum('APPLICATION', 'SINGPASS', 'GOOGLE');
export type AccountType = ApiEnumValue<typeof ACCOUNT_TYPES>;

/** Mirror of `SingpassStatusDto`: the Singpass buttons are usable. */
export interface SingpassStatus {
  enabled: boolean;
}

/** Mirror of `SingpassStartResponse`. */
export interface SingpassStart {
  authorizationUrl: string;
}

/** Query parameters Singpass sends back to the callback page (mirror of `SingpassCallbackRequest`). */
export interface SingpassCallbackRequest {
  code: string | null;
  state: string | null;
  iss: string | null;
  error: string | null;
}

/** Mirror of `SingpassRegistrationDto`: single-use proof of the Singpass authentication + prefill. */
export interface SingpassRegistration {
  token: string;
  displayName: string | null;
  email: string | null;
}

/** Mirror of `SingpassCallbackResponse`. */
export interface SingpassCallbackResponse {
  outcome: 'SIGNED_IN' | 'REGISTRATION_REQUIRED';
  session: AuthResponse | null;
  registration: SingpassRegistration | null;
}

/** Mirror of `SingpassRegisterRequest`. */
export interface SingpassRegisterRequest {
  token: string;
  email: string;
  displayName: string;
  position: string | null;
}
