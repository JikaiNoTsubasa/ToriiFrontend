import { ticketReference } from './ticket-classification';

describe('ticketReference', () => {
  it('prefixes the number and title with the short type tag', () => {
    expect(ticketReference({ number: 'TI000002', title: 'Title goes here', type: 'FEATURE_REQUEST' })).toBe(
      '[Feat] TI000002 - Title goes here',
    );
    expect(ticketReference({ number: 'TI000003', title: 'Login fails', type: 'BUG' })).toBe('[Bug] TI000003 - Login fails');
    expect(ticketReference({ number: 'TI000004', title: 'New laptop', type: 'REQUEST' })).toBe('[Req] TI000004 - New laptop');
  });
});
