import { timeAgo } from './time-ago';

describe('timeAgo', () => {
  const now = Date.parse('2026-11-21T12:00:00Z');

  it('formats recent times relatively', () => {
    expect(timeAgo('2026-11-21T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-11-21T11:55:00Z', now)).toBe('5 min ago');
    expect(timeAgo('2026-11-21T09:00:00Z', now)).toBe('3 h ago');
    expect(timeAgo('2026-11-19T12:00:00Z', now)).toBe('2 d ago');
  });

  it('falls back to the date after a week', () => {
    expect(timeAgo('2026-11-01T12:00:00Z', now)).toBe('Nov 1, 2026');
  });
});
