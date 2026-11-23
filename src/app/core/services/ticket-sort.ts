import { apiEnum, ApiEnumValue } from '../http/api-enum';

/** Sort columns of the ticket list — mirror of the backend `TicketSortField` enum. */
export const TICKET_SORT_FIELDS = apiEnum('CREATED_AT', 'NUMBER', 'TITLE', 'TYPE', 'PRIORITY', 'CREATED_BY');
export type TicketSortField = ApiEnumValue<typeof TICKET_SORT_FIELDS>;

/** Mirror of the backend `SortDirection` enum. */
export const SORT_DIRECTIONS = apiEnum('ASC', 'DESC');
export type SortDirection = ApiEnumValue<typeof SORT_DIRECTIONS>;

export interface TicketSort {
  field: TicketSortField;
  direction: SortDirection;
}

/** Newest first (also the API default). */
export const DEFAULT_TICKET_SORT: TicketSort = { field: 'CREATED_AT', direction: 'DESC' };
