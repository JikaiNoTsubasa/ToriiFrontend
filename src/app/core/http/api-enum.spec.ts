import { apiEnum, ApiEnumValue, parseApiEnum } from './api-enum';

const STATUSES = apiEnum('NEW', 'ON_GOING', 'COMPLETED');
type Status = ApiEnumValue<typeof STATUSES>;

describe('api-enum', () => {
  it('expose les valeurs dans l\'ordre et les fige', () => {
    expect(STATUSES).toEqual(['NEW', 'ON_GOING', 'COMPLETED']);
    expect(Object.isFrozen(STATUSES)).toBe(true);
  });

  it('parse une valeur connue, sans tenir compte de la casse', () => {
    const status: Status | null = parseApiEnum(STATUSES, 'on_going');
    expect(status).toBe('ON_GOING');
  });

  it('renvoie null pour une valeur inconnue ou absente', () => {
    expect(parseApiEnum(STATUSES, 'BOGUS')).toBeNull();
    expect(parseApiEnum(STATUSES, null)).toBeNull();
    expect(parseApiEnum(STATUSES, undefined)).toBeNull();
  });
});
