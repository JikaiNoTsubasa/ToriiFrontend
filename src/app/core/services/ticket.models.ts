/**
 * Ticket listed for the signed-in user — mirror of the backend
 * `TicketListItemDto` (Torii.Api.Dtos). `number` uses the `TI000001` format.
 */
export interface TicketListItem {
  number: string;
  title: string;
  channels: TicketChannel[];
}

/** (Bidirectional) channel of a ticket between customers. */
export interface TicketChannel {
  id: number;
  participants: ChannelParticipant[];
}

export interface ChannelParticipant {
  customerId: number;
  customerName: string;
}
