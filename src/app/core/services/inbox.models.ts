import { UserRef } from './ticket.models';

/** Notification kinds — mirror of the backend `NotificationType` enum. */
export type InboxNotificationType = 'MESSAGE_POSTED' | 'ACCOUNT_REQUESTED';

/**
 * In-app notification — mirror of `NotificationDto`. Unread message notifications are
 * coalesced per channel: `count` messages, `actor` / `preview` / `createdAt` of the latest one.
 * `ACCOUNT_REQUESTED` (administrators only): no ticket fields, `actor` = the requester,
 * `preview` = their email.
 */
export interface InboxNotification {
  id: number;
  type: InboxNotificationType;
  ticketNumber: string | null;
  ticketTitle: string | null;
  channelId: number | null;
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

/** Where a notification leads (router commands + query params). */
export interface NotificationTarget {
  commands: readonly unknown[];
  queryParams?: Record<string, string | number>;
}

export function notificationTarget(n: InboxNotification): NotificationTarget {
  return n.type === 'ACCOUNT_REQUESTED'
    ? { commands: ['/admin/account-requests'] }
    : { commands: ['/tickets', n.ticketNumber], queryParams: { channel: n.channelId! } };
}

/** What the actor did, e.g. "replied" (follows the actor's name). */
export function notificationAction(n: InboxNotification): string {
  if (n.type === 'ACCOUNT_REQUESTED') {
    return 'requested an account';
  }
  return n.isForward ? 'forwarded a message' : 'replied';
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
