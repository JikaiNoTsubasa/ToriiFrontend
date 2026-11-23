import { OPEN_TICKET_STATUSES, TICKET_STATUSES, TicketStatus } from '../../core/services/ticket-status';
import { TICKET_TYPES } from '../../core/services/ticket-classification';
import {
  apiStatuses,
  apiValues,
  nextSort,
  parsePageParam,
  parseSortParams,
  sortParams,
  parseSetParam,
  parseStatusParam,
  PRIORITY_FILTER,
  setParam,
  statusParam,
  TYPE_FILTER,
} from './ticket-filters';

describe('ticket filters', () => {
  it('defaults to the open statuses (not resolved / closed / cancelled)', () => {
    const selected = parseStatusParam(undefined);
    expect([...selected]).toEqual([...OPEN_TICKET_STATUSES]);
    expect(selected.has('RESOLVED')).toBe(false);
    expect(selected.has('CLOSED')).toBe(false);
    expect(selected.has('CANCELLED')).toBe(false);
  });

  it('round-trips the status query parameter', () => {
    expect(statusParam(parseStatusParam(undefined))).toBeNull();
    expect(statusParam(parseStatusParam('all'))).toBe('all');
    expect(statusParam(parseStatusParam('none'))).toBe('none');
    expect(statusParam(new Set<TicketStatus>(['CLOSED', 'NEW']))).toBe('NEW,CLOSED');
    expect([...parseStatusParam('new,BOGUS,closed')]).toEqual(['NEW', 'CLOSED']);
    expect(parseStatusParam('all').size).toBe(TICKET_STATUSES.length);
  });

  it('sends no status filter to the API when every status is selected', () => {
    expect(apiStatuses(parseStatusParam('all'))).toBeNull();
    expect(apiStatuses(new Set<TicketStatus>(['CLOSED', 'NEW']))).toEqual(['NEW', 'CLOSED']);
    expect(apiStatuses(parseStatusParam(undefined))).toEqual([...OPEN_TICKET_STATUSES]);
  });

  it('defaults the type and priority filters to every value (no API filter)', () => {
    const types = parseSetParam(TYPE_FILTER, undefined);
    expect(types.size).toBe(TICKET_TYPES.length);
    expect(setParam(TYPE_FILTER, types)).toBeNull();
    expect(apiValues(TYPE_FILTER, types)).toBeNull();

    const priorities = parseSetParam(PRIORITY_FILTER, 'critical,high');
    expect(apiValues(PRIORITY_FILTER, priorities)).toEqual(['CRITICAL', 'HIGH']);
    expect(setParam(PRIORITY_FILTER, priorities)).toBe('CRITICAL,HIGH');
  });

  it('parses the page parameter, falling back to 1', () => {
    expect(parsePageParam('3')).toBe(3);
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam('0')).toBe(1);
    expect(parsePageParam('abc')).toBe(1);
  });
});

describe('ticket sort', () => {
  it('defaults to newest first, also for unknown values', () => {
    expect(parseSortParams(null, null)).toEqual({ field: 'CREATED_AT', direction: 'DESC' });
    expect(parseSortParams('nope', 'ASC')).toEqual({ field: 'CREATED_AT', direction: 'DESC' });
  });

  it('parses a field with its direction, or the natural one when missing', () => {
    expect(parseSortParams('priority', 'asc')).toEqual({ field: 'PRIORITY', direction: 'ASC' });
    expect(parseSortParams('TITLE', null)).toEqual({ field: 'TITLE', direction: 'ASC' });
  });

  it('leaves the default sort out of the URL', () => {
    expect(sortParams({ field: 'CREATED_AT', direction: 'DESC' })).toEqual({ sort: null, dir: null });
    expect(sortParams({ field: 'CREATED_AT', direction: 'ASC' })).toEqual({ sort: 'CREATED_AT', dir: 'ASC' });
  });

  it('flips the direction on the same column, starts naturally on another one', () => {
    expect(nextSort({ field: 'PRIORITY', direction: 'DESC' }, 'PRIORITY')).toEqual({ field: 'PRIORITY', direction: 'ASC' });
    expect(nextSort({ field: 'PRIORITY', direction: 'DESC' }, 'TITLE')).toEqual({ field: 'TITLE', direction: 'ASC' });
    expect(nextSort({ field: 'TITLE', direction: 'ASC' }, 'CREATED_AT')).toEqual({ field: 'CREATED_AT', direction: 'DESC' });
  });
});
