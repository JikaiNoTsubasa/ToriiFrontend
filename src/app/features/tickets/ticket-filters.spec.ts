import { OPEN_TICKET_STATUSES, TICKET_STATUSES, TicketStatus } from '../../core/services/ticket-status';
import { TICKET_TYPES } from '../../core/services/ticket-classification';
import {
  apiStatuses,
  apiValues,
  parsePageParam,
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
