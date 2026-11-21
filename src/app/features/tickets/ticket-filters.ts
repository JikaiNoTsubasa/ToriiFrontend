import { OPEN_TICKET_STATUSES, TICKET_STATUSES, TicketStatus } from '../../core/services/ticket-status';
import { parseApiEnum } from '../../core/http/api-enum';

/** `?status=` value selecting every status (no value = the default open statuses). */
export const ALL_STATUSES_PARAM = 'all';
/** `?status=` value selecting no status at all. */
export const NO_STATUS_PARAM = 'none';

/**
 * Statuses selected by the `?status=` query parameter: absent → the open statuses (default),
 * `all`, `none`, or a comma-separated list (unknown values are ignored).
 */
export function parseStatusParam(param: string | null | undefined): ReadonlySet<TicketStatus> {
  if (param == null || param === '') return new Set(OPEN_TICKET_STATUSES);
  if (param === ALL_STATUSES_PARAM) return new Set(TICKET_STATUSES);
  if (param === NO_STATUS_PARAM) return new Set();
  const statuses = param
    .split(',')
    .map((value) => parseApiEnum(TICKET_STATUSES, value.trim()))
    .filter((status): status is TicketStatus => status !== null);
  return new Set(statuses);
}

/** `?status=` value for a selection (`null` = the default, so it is left out of the URL). */
export function statusParam(selected: ReadonlySet<TicketStatus>): string | null {
  if (sameStatuses(selected, OPEN_TICKET_STATUSES)) return null;
  if (selected.size === TICKET_STATUSES.length) return ALL_STATUSES_PARAM;
  if (selected.size === 0) return NO_STATUS_PARAM;
  // Workflow order keeps the URL stable whatever the click order.
  return TICKET_STATUSES.filter((status) => selected.has(status)).join(',');
}

export function sameStatuses(selected: ReadonlySet<TicketStatus>, statuses: readonly TicketStatus[]): boolean {
  return selected.size === statuses.length && statuses.every((status) => selected.has(status));
}

/**
 * `status` parameters sent to the API (filtering is done server-side): `null` when every
 * status is selected (no filter), otherwise the selection in workflow order.
 */
export function apiStatuses(selected: ReadonlySet<TicketStatus>): TicketStatus[] | null {
  return selected.size === TICKET_STATUSES.length ? null : TICKET_STATUSES.filter((status) => selected.has(status));
}

/** `?page=` value (1-based; anything invalid → 1). */
export function parsePageParam(param: string | null | undefined): number {
  const page = Number(param);
  return Number.isInteger(page) && page > 0 ? page : 1;
}
