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

/** Ticket details as seen by the signed-in user — mirror of `TicketDetailDto`. */
export interface TicketDetail extends TicketListItem {
  channels: TicketChannelDetail[];
}

/** Channel with its conversation (messages oldest first) — mirror of `TicketChannelDetailDto`. */
export interface TicketChannelDetail extends TicketChannel {
  messages: TicketMessage[];
}

/** Message of a channel — mirror of `TicketMessageDto`. */
export interface TicketMessage {
  id: number;
  channelId: number;
  author: UserRef;
  /** The author's customer in this channel. */
  authorCustomerName: string | null;
  /** Written by the signed-in user. */
  isMine: boolean;
  /** Written by someone of the user's own customer(s). */
  isOwnSide: boolean;
  /**
   * HTML from the rich text editor (rendered through Angular's sanitizer). For a forward,
   * the forwarder's optional comment (may be empty).
   */
  content: string;
  createdAt: string;
  /** Original message when this one is a forward. */
  forwarded: ForwardedMessage | null;
}

/** Original of a forwarded message — mirror of `ForwardedMessageDto`. */
export interface ForwardedMessage {
  id: number;
  author: UserRef;
  authorCustomerName: string | null;
  content: string;
  createdAt: string;
}

/**
 * Forward destination — mirror of `ForwardMessageRequest`: either an existing channel
 * (`targetChannelId`) or a source/target customer pair (channel reused or created).
 */
export interface ForwardMessageRequest {
  targetChannelId: number | null;
  sourceCustomerId: number | null;
  targetCustomerId: number | null;
  comment: string | null;
}

/** Mirror of `ForwardResultDto`. */
export interface ForwardResult {
  channelId: number;
  channelCreated: boolean;
  message: TicketMessage;
}

/** New channel on an existing ticket — mirror of `OpenChannelRequest`. */
export interface OpenChannelRequest {
  sourceCustomerId: number;
  targetCustomerId: number;
  content: string;
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
