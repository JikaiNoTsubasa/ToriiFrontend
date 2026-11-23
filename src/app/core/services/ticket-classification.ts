import { apiEnum, ApiEnumMap, ApiEnumValue } from '../http/api-enum';

/** Ticket types — mirror of the backend `TicketType` enum. */
export const TICKET_TYPES = apiEnum('BUG', 'INCIDENT', 'FEATURE_REQUEST', 'IMPROVEMENT', 'REQUEST', 'QUESTION');
export type TicketType = ApiEnumValue<typeof TICKET_TYPES>;

/** Ticket priorities — mirror of the backend `TicketPriority` enum, most urgent first. */
export const TICKET_PRIORITIES = apiEnum('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
export type TicketPriority = ApiEnumValue<typeof TICKET_PRIORITIES>;

export const DEFAULT_TICKET_TYPE: TicketType = 'REQUEST';
export const DEFAULT_TICKET_PRIORITY: TicketPriority = 'MEDIUM';

export interface ClassificationMeta {
  label: string;
  /** Font Awesome icon. */
  icon: string;
  /** Modifier class (styles.scss). */
  className: string;
  description: string;
}

/** Short tag of every type, used in copied references: `[Feat] TI000002 - Title`. */
export const TICKET_TYPE_TAGS: ApiEnumMap<TicketType, string> = {
  BUG: 'Bug',
  INCIDENT: 'Inc',
  FEATURE_REQUEST: 'Feat',
  IMPROVEMENT: 'Impr',
  REQUEST: 'Req',
  QUESTION: 'Quest',
};

/** One-line reference of a ticket, e.g. `[Feat] TI000002 - Title goes here`. */
export function ticketReference(ticket: { number: string; title: string; type: TicketType }): string {
  return `[${TICKET_TYPE_TAGS[ticket.type]}] ${ticket.number} - ${ticket.title}`;
}

/** Display data of every type (exhaustive: the compiler flags a missing one). */
export const TICKET_TYPE_META: ApiEnumMap<TicketType, ClassificationMeta> = {
  BUG: { label: 'Bug', icon: 'fas fa-bug', className: 'ticket-type--bug', description: 'Something does not work as expected.' },
  INCIDENT: { label: 'Incident', icon: 'fas fa-fire', className: 'ticket-type--incident', description: 'A service is disrupted or down.' },
  FEATURE_REQUEST: {
    label: 'Feature request',
    icon: 'fas fa-lightbulb',
    className: 'ticket-type--feature',
    description: 'A new capability is wanted.',
  },
  IMPROVEMENT: {
    label: 'Improvement',
    icon: 'fas fa-wand-magic-sparkles',
    className: 'ticket-type--improvement',
    description: 'An existing capability could be better.',
  },
  REQUEST: { label: 'Request', icon: 'fas fa-hand', className: 'ticket-type--request', description: 'A service or an action is asked for.' },
  QUESTION: { label: 'Question', icon: 'fas fa-circle-question', className: 'ticket-type--question', description: 'Information is needed.' },
};

/** Display data of every priority (exhaustive: the compiler flags a missing one). */
export const TICKET_PRIORITY_META: ApiEnumMap<TicketPriority, ClassificationMeta> = {
  CRITICAL: { label: 'Critical', icon: 'fas fa-angles-up', className: 'priority--critical', description: 'Blocking, needs immediate action.' },
  HIGH: { label: 'High', icon: 'fas fa-angle-up', className: 'priority--high', description: 'Important, to handle soon.' },
  MEDIUM: { label: 'Medium', icon: 'fas fa-equals', className: 'priority--medium', description: 'Normal priority.' },
  LOW: { label: 'Low', icon: 'fas fa-angle-down', className: 'priority--low', description: 'Can wait.' },
};

/** Types as dropdown options (icon + label + description), in enum order. */
export const TICKET_TYPE_OPTIONS: readonly ({ value: TicketType } & ClassificationMeta)[] = TICKET_TYPES.map((value) => ({
  value,
  ...TICKET_TYPE_META[value],
}));
