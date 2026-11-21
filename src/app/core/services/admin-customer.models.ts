import { UserDto } from '../auth/auth.models';

/** Mirror of `CustomerListItemDto` (Torii.Api.Dtos). */
export interface CustomerListItem {
  id: number;
  name: string;
  memberCount: number;
  createdAt: string;
}

/** Mirror of `CustomerDetailDto` (Torii.Api.Dtos). */
export interface CustomerDetail {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string | null;
  members: UserDto[];
}
