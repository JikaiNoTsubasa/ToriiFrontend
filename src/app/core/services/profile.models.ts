import { UserRole } from '../auth/auth.models';
import { CustomerRef } from './ticket.models';

/** The signed-in user's own profile — mirror of `ProfileDto`. */
export interface Profile {
  id: number;
  email: string;
  displayName: string;
  /** Default avatar, or the uploaded one (`/api/users/{id}/avatar?v=…`, served through the dev proxy). */
  avatarUrl: string;
  hasCustomAvatar: boolean;
  role: UserRole;
  createdAt: string;
  customers: CustomerRef[];
}
