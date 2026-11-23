import { AccountType } from '../auth/singpass.models';

/** Mirror of `AccountRequestDto` (Torii.Api.Dtos): a pending account request. */
export interface AccountRequest {
  id: number;
  email: string;
  displayName: string;
  /** Free-text position in the company (`null` = none). */
  position: string | null;
  avatarUrl: string;
  /** How the person will sign in: `APPLICATION` (email + password) or `SINGPASS`. */
  accountType: AccountType;
  requestedAt: string;
}
