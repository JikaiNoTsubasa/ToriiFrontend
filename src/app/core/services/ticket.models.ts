import { TicketStatus } from './ticket-status';

/**
 * Ticket listed for the signed-in user — mirror of the backend
 * `TicketListItemDto` (Torii.Api.Dtos). `number` uses the `TI000001` format.
 * Only the channels the user takes part in are returned.
 */
export interface TicketListItem {
  number: string;
  title: string;
  /** Creator; `null` only for legacy tickets without any message. */
  createdBy: UserRef | null;
  createdAt: string;
  channels: TicketChannel[];
}

/** Minimal user reference for display — mirror of `UserRefDto`. */
export interface UserRef {
  id: number;
  displayName: string;
  avatarUrl: string;
}

/** (Bidirectional) channel of a ticket between customers, with its own status. */
export interface TicketChannel {
  id: number;
  status: TicketStatus;
  /** Last status change; `null` while still in the initial status. */
  statusChangedAt: string | null;
  participants: ChannelParticipant[];
}

export interface ChannelParticipant {
  customerId: number;
  customerName: string;
  /** The signed-in user is a member of this customer. */
  isOwn: boolean;
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
