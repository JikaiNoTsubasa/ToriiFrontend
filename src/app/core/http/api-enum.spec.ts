import { apiEnum, ApiEnumValue, parseApiEnum } from './api-enum';

const STATUSES = apiEnum('NEW', 'ON_GOING', 'COMPLETED');
type Status = ApiEnumValue<typeof STATUSES>;

describe('api-enum', () => {
  it('exposes the values in order and freezes them', () => {
    expect(STATUSES).toEqual(['NEW', 'ON_GOING', 'COMPLETED']);
    expect(Object.isFrozen(STATUSES)).toBe(true);
  });

  it('parses a known value, ignoring case', () => {
    const status: Status | null = parseApiEnum(STATUSES, 'on_going');
    expect(status).toBe('ON_GOING');
  });

  it('returns null for an unknown or missing value', () => {
    expect(parseApiEnum(STATUSES, 'BOGUS')).toBeNull();
    expect(parseApiEnum(STATUSES, null)).toBeNull();
    expect(parseApiEnum(STATUSES, undefined)).toBeNull();
  });
});
