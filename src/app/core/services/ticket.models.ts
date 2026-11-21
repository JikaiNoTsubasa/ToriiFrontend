import { TicketPriority, TicketType } from './ticket-classification';
import { TicketStatus } from './ticket-status';

/**
 * Ticket listed for the signed-in user — mirror of the backend
 * `TicketListItemDto` (Torii.Api.Dtos). `number` uses the `TI000001` format.
 * Only the channels the user takes part in are returned.
 */
export interface TicketListItem {
  number: string;
  title: string;
  /** Ticket-level, shared by all its channels. */
  type: TicketType;
  priority: TicketPriority;
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

/**
 * Channel with its conversation — mirror of `TicketChannelDetailDto`: messages and activity
 * events (both oldest first, merged into one feed by the UI) and the attached files.
 */
export interface TicketChannelDetail extends TicketChannel {
  messages: TicketMessage[];
  activities: TicketActivity[];
  files: ChannelFile[];
}

/** File attached to a channel — mirror of `ChannelFileDto` (`fileId` is shared by forwards). */
export interface ChannelFile {
  fileId: number;
  fileName: string;
  contentType: string;
  size: number;
  addedBy: UserRef;
  addedAt: string;
  isForwarded: boolean;
}

/** File reference — mirror of `FileRefDto`. */
export interface FileRef {
  fileId: number;
  fileName: string;
  contentType: string;
  size: number;
}

/** Activity kinds — mirror of the backend `TicketActivityType` enum. */
export type TicketActivityType =
  | 'CHANNEL_OPENED'
  | 'STATUS_CHANGED'
  | 'FILE_UPLOADED'
  | 'FILE_FORWARDED'
  | 'TYPE_CHANGED'
  | 'PRIORITY_CHANGED';

/** Activity event of a channel — mirror of `TicketActivityDto` (fields depend on `type`). */
export interface TicketActivity {
  id: number;
  type: TicketActivityType;
  actor: UserRef;
  createdAt: string;
  /** STATUS_CHANGED: previous status (`null` when unknown, e.g. backfilled history). */
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus | null;
  /** TYPE_CHANGED (ticket-wide, logged in every channel of the ticket). */
  fromType: TicketType | null;
  toType: TicketType | null;
  /** PRIORITY_CHANGED (ticket-wide, logged in every channel of the ticket). */
  fromPriority: TicketPriority | null;
  toPriority: TicketPriority | null;
  /** FILE_UPLOADED / FILE_FORWARDED. */
  file: FileRef | null;
}

/** File forward destination — mirror of `ForwardFileRequest`. */
export interface ForwardFileRequest {
  targetChannelId: number | null;
  sourceCustomerId: number | null;
  targetCustomerId: number | null;
}

/** Mirror of `ForwardFileResultDto`. */
export interface ForwardFileResult {
  channelId: number;
  channelCreated: boolean;
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
  type: TicketType;
  priority: TicketPriority;
}
