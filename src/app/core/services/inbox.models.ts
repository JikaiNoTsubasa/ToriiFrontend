import { UserRef } from './ticket.models';

/** Notification kinds — mirror of the backend `NotificationType` enum. */
export type InboxNotificationType = 'MESSAGE_POSTED';

/**
 * In-app notification — mirror of `NotificationDto`. Unread notifications are coalesced per
 * channel: `count` messages, `actor` / `preview` / `createdAt` of the latest one.
 */
export interface InboxNotification {
  id: number;
  type: InboxNotificationType;
  ticketNumber: string;
  ticketTitle: string;
  channelId: number;
  /** Other customer(s) of the channel. */
  counterpart: string;
  actor: UserRef;
  /** Plain-text excerpt of the latest message. */
  preview: string;
  isForward: boolean;
  count: number;
  createdAt: string;
  readAt: string | null;
}

/** Mirror of `NotificationListDto`. */
export interface InboxList {
  items: InboxNotification[];
  unreadCount: number;
}

/** Mirror of `UnreadSummaryDto`. */
export interface UnreadSummary {
  count: number;
  /** Latest unread notification (`null` when none). */
  latestAt: string | null;
}
