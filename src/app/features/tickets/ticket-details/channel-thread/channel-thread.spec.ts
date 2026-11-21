import { TicketActivity, TicketChannelDetail, TicketMessage } from '../../../../core/services/ticket.models';
import { buildFeed, sideNames } from './channel-thread';

function channel(overrides: Partial<TicketChannelDetail> = {}): TicketChannelDetail {
  return {
    id: 1,
    status: 'NEW',
    statusChangedAt: null,
    participants: [],
    messages: [],
    activities: [],
    files: [],
    ...overrides,
  };
}

const user = { id: 1, displayName: 'Alice', avatarUrl: '' };

function message(id: number, createdAt: string): TicketMessage {
  return {
    id,
    channelId: 1,
    author: user,
    authorCustomerName: 'ACME',
    isMine: true,
    isOwnSide: true,
    content: '<p>hi</p>',
    createdAt,
    forwarded: null,
  };
}

function activity(id: number, createdAt: string, type: TicketActivity['type'] = 'STATUS_CHANGED'): TicketActivity {
  return { id, type, actor: user, createdAt, fromStatus: 'NEW', toStatus: 'IN_PROGRESS', file: null };
}

describe('sideNames', () => {
  it('splits a channel into the user side and the other side', () => {
    const ch = channel({
      participants: [
        { customerId: 1, customerName: 'ACME', isOwn: true },
        { customerId: 2, customerName: 'Globex', isOwn: false },
      ],
    });

    expect(sideNames(ch, true)).toBe('ACME');
    expect(sideNames(ch, false)).toBe('Globex');
  });

  it('returns an empty other side when the user belongs to every participant', () => {
    const ch = channel({
      participants: [
        { customerId: 1, customerName: 'ACME', isOwn: true },
        { customerId: 2, customerName: 'Globex', isOwn: true },
      ],
    });

    expect(sideNames(ch, false)).toBe('');
    expect(sideNames(ch, true)).toBe('ACME, Globex');
  });
});

describe('buildFeed', () => {
  it('interleaves messages and activities chronologically', () => {
    const feed = buildFeed(
      channel({
        messages: [message(1, '2026-11-21T10:00:00Z'), message(2, '2026-11-21T12:00:00Z')],
        activities: [activity(1, '2026-11-21T11:00:00Z')],
      }),
    );

    expect(feed.map((item) => item.key)).toEqual(['m1', 'a1', 'm2']);
  });

  it('puts an activity before a message on the same date (e.g. channel opened, then first message)', () => {
    const at = '2026-11-21T10:00:00Z';
    const feed = buildFeed(
      channel({ messages: [message(1, at)], activities: [activity(1, at, 'CHANNEL_OPENED')] }),
    );

    expect(feed.map((item) => item.key)).toEqual(['a1', 'm1']);
  });
});
