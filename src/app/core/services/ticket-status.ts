import { apiEnum, ApiEnumMap, ApiEnumValue } from '../http/api-enum';

/** Ticket channel statuses — mirror of the backend `TicketStatus` enum, in workflow order. */
export const TICKET_STATUSES = apiEnum(
  'NEW',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'WAITING_FOR_REQUESTER',
  'WAITING_FOR_THIRD_PARTY',
  'ON_HOLD',
  'RESOLVED',
  'CLOSED',
  'CANCELLED',
);
export type TicketStatus = ApiEnumValue<typeof TICKET_STATUSES>;

/** Statuses of finished work (hidden by the default ticket list filter). */
export const DONE_TICKET_STATUSES: readonly TicketStatus[] = ['RESOLVED', 'CLOSED', 'CANCELLED'];

/** Statuses still needing attention (default ticket list filter). */
export const OPEN_TICKET_STATUSES: readonly TicketStatus[] = TICKET_STATUSES.filter(
  (status) => !DONE_TICKET_STATUSES.includes(status),
);

export interface TicketStatusMeta {
  label: string;
  /** Badge modifier class (styles.scss). */
  badge: string;
  description: string;
}

/** Display data of every status (exhaustive: the compiler flags a missing one). */
export const TICKET_STATUS_META: ApiEnumMap<TicketStatus, TicketStatusMeta> = {
  NEW: { label: 'New', badge: 'badge--new', description: 'Created, not yet looked at.' },
  ACKNOWLEDGED: { label: 'Acknowledged', badge: 'badge--ongoing', description: 'Seen and accepted, work not started yet.' },
  IN_PROGRESS: { label: 'In progress', badge: 'badge--ongoing', description: 'Being worked on.' },
  WAITING_FOR_REQUESTER: {
    label: 'Waiting for requester',
    badge: 'badge--waiting',
    description: 'Waiting for an answer from the requester.',
  },
  WAITING_FOR_THIRD_PARTY: {
    label: 'Waiting for third party',
    badge: 'badge--waiting',
    description: 'Waiting for an external party (supplier, other team…).',
  },
  ON_HOLD: { label: 'On hold', badge: 'badge--hold', description: 'Deliberately paused.' },
  RESOLVED: { label: 'Resolved', badge: 'badge--done', description: 'A solution was provided, waiting for confirmation.' },
  CLOSED: { label: 'Closed', badge: 'badge--closed', description: 'Done.' },
  CANCELLED: { label: 'Cancelled', badge: 'badge--cancelled', description: 'Dropped without resolution.' },
};
