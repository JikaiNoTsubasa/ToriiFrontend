import { parseApiEnum } from '../../core/http/api-enum';
import { TICKET_PRIORITIES, TICKET_TYPES, TicketPriority, TicketType } from '../../core/services/ticket-classification';
import { OPEN_TICKET_STATUSES, TICKET_STATUSES, TicketStatus } from '../../core/services/ticket-status';
import {
  DEFAULT_TICKET_SORT,
  SORT_DIRECTIONS,
  TICKET_SORT_FIELDS,
  TicketSort,
  TicketSortField,
} from '../../core/services/ticket-sort';

/** URL value selecting every value of a filter. */
export const ALL_PARAM = 'all';
/** URL value selecting no value at all. */
export const NONE_PARAM = 'none';

/** A multi-select filter over an API enum: its values (display order) and its default selection. */
export interface EnumFilter<T extends string> {
  all: readonly T[];
  defaults: readonly T[];
}

/** Status filter: defaults to the open statuses (not resolved / closed / cancelled). */
export const STATUS_FILTER: EnumFilter<TicketStatus> = { all: TICKET_STATUSES, defaults: OPEN_TICKET_STATUSES };
/** Type filter: defaults to every type. */
export const TYPE_FILTER: EnumFilter<TicketType> = { all: TICKET_TYPES, defaults: TICKET_TYPES };
/** Priority filter: defaults to every priority. */
export const PRIORITY_FILTER: EnumFilter<TicketPriority> = { all: TICKET_PRIORITIES, defaults: TICKET_PRIORITIES };

/**
 * Selection from a query parameter: absent → the filter's defaults, `all`, `none`, or a
 * comma-separated list (unknown values are ignored, case-insensitive).
 */
export function parseSetParam<T extends string>(filter: EnumFilter<T>, param: string | null | undefined): ReadonlySet<T> {
  if (param == null || param === '') return new Set(filter.defaults);
  if (param === ALL_PARAM) return new Set(filter.all);
  if (param === NONE_PARAM) return new Set();
  const values = param
    .split(',')
    .map((value) => parseApiEnum(filter.all, value.trim()))
    .filter((value): value is T => value !== null);
  return new Set(values);
}

/** Query parameter for a selection (`null` = the defaults, left out of the URL). */
export function setParam<T extends string>(filter: EnumFilter<T>, selected: ReadonlySet<T>): string | null {
  if (sameValues(selected, filter.defaults)) return null;
  if (selected.size === filter.all.length) return ALL_PARAM;
  if (selected.size === 0) return NONE_PARAM;
  // Display order keeps the URL stable whatever the click order.
  return filter.all.filter((value) => selected.has(value)).join(',');
}

/** API parameters for a selection: `null` when every value is selected (no filter). */
export function apiValues<T extends string>(filter: EnumFilter<T>, selected: ReadonlySet<T>): T[] | null {
  return selected.size === filter.all.length ? null : filter.all.filter((value) => selected.has(value));
}

export function sameValues<T extends string>(selected: ReadonlySet<T>, values: readonly T[]): boolean {
  return selected.size === values.length && values.every((value) => selected.has(value));
}

// --- Status shortcuts ---

export const parseStatusParam = (param: string | null | undefined) => parseSetParam(STATUS_FILTER, param);
export const statusParam = (selected: ReadonlySet<TicketStatus>) => setParam(STATUS_FILTER, selected);
export const apiStatuses = (selected: ReadonlySet<TicketStatus>) => apiValues(STATUS_FILTER, selected);
export const sameStatuses = sameValues<TicketStatus>;

/** `?page=` value (1-based; anything invalid → 1). */
export function parsePageParam(param: string | null | undefined): number {
  const page = Number(param);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/** Sort from the `sort` / `dir` query parameters (missing or unknown → newest first). */
export function parseSortParams(sort: string | null | undefined, dir: string | null | undefined): TicketSort {
  const field = parseApiEnum(TICKET_SORT_FIELDS, sort);
  if (!field) return DEFAULT_TICKET_SORT;
  return { field, direction: parseApiEnum(SORT_DIRECTIONS, dir) ?? firstDirection(field) };
}

/** Query parameters of a sort (`null` = the default, left out of the URL). */
export function sortParams(sort: TicketSort): { sort: string | null; dir: string | null } {
  const isDefault = sort.field === DEFAULT_TICKET_SORT.field && sort.direction === DEFAULT_TICKET_SORT.direction;
  return isDefault ? { sort: null, dir: null } : { sort: sort.field, dir: sort.direction };
}

/** Header click: the same column flips its direction, another one starts in its natural one. */
export function nextSort(current: TicketSort, field: TicketSortField): TicketSort {
  return current.field === field
    ? { field, direction: current.direction === 'ASC' ? 'DESC' : 'ASC' }
    : { field, direction: firstDirection(field) };
}

/** Dates, numbers and priorities start with the newest / most urgent; text starts A → Z. */
function firstDirection(field: TicketSortField): TicketSort['direction'] {
  return field === 'TITLE' || field === 'TYPE' || field === 'CREATED_BY' ? 'ASC' : 'DESC';
}
