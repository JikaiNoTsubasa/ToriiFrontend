import { apiEnum, ApiEnumValue } from '../http/api-enum';

/** Mirror of the backend `SingpassEnvironment` enum. */
export const SINGPASS_ENVIRONMENTS = apiEnum('STAGING', 'PRODUCTION');
export type SingpassEnvironment = ApiEnumValue<typeof SINGPASS_ENVIRONMENTS>;

/** Mirror of `SingpassConfigDto`: settings as shown to administrators (no private key). */
export interface SingpassConfig {
  enabled: boolean;
  environment: SingpassEnvironment;
  issuer: string;
  clientId: string | null;
  redirectUri: string | null;
  scopes: string;
  signingKeyId: string | null;
  encryptionKeyId: string | null;
  keysGeneratedAt: string | null;
  isConfigured: boolean;
  updatedAt: string | null;
}

/** Mirror of `SingpassConfigUpdateRequest`. */
export interface SingpassConfigUpdate {
  enabled: boolean;
  environment: SingpassEnvironment;
  clientId: string | null;
  redirectUri: string | null;
  scopes: string;
}

/** Mirror of `SingpassTestResultDto`: endpoints read from the discovery document. */
export interface SingpassTestResult {
  issuer: string;
  authorizationEndpoint: string;
  pushedAuthorizationRequestEndpoint: string;
  tokenEndpoint: string;
  jwksUri: string;
}
