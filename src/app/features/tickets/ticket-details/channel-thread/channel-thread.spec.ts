import { TicketChannelDetail } from '../../../../core/services/ticket.models';
import { sideNames } from './channel-thread';

function channel(participants: TicketChannelDetail['participants']): TicketChannelDetail {
  return { id: 1, status: 'NEW', statusChangedAt: null, participants, messages: [] };
}

describe('sideNames', () => {
  it('splits a channel into the user side and the other side', () => {
    const ch = channel([
      { customerId: 1, customerName: 'ACME', isOwn: true },
      { customerId: 2, customerName: 'Globex', isOwn: false },
    ]);

    expect(sideNames(ch, true)).toBe('ACME');
    expect(sideNames(ch, false)).toBe('Globex');
  });

  it('returns an empty other side when the user belongs to every participant', () => {
    const ch = channel([
      { customerId: 1, customerName: 'ACME', isOwn: true },
      { customerId: 2, customerName: 'Globex', isOwn: true },
    ]);

    expect(sideNames(ch, false)).toBe('');
    expect(sideNames(ch, true)).toBe('ACME, Globex');
  });
});
