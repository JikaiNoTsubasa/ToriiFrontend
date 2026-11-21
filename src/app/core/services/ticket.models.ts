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

/** Minimal customer reference — mirror of `CustomerRefDto`. */
export interface CustomerRef {
  id: number;
  name: string;
}

/**
 * Customer of the signed-in user that may send tickets, with its allowed targets
 * (active ticket edges) — mirror of `TicketSendOptionDto`.
 */
export interface TicketSendOption {
  customerId: number;
  customerName: string;
  targets: CustomerRef[];
}

/** Ticket creation — mirror of `CreateTicketRequest`; `content` (HTML) is the first message. */
export interface CreateTicketRequest {
  sourceCustomerId: number;
  targetCustomerId: number;
  title: string;
  content: string;
}
