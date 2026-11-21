import { httpResource, HttpResourceRef } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TicketPriority, TicketType } from './ticket-classification';
import { TicketListItem, UserRef } from './ticket.models';
import { TicketStatus } from './ticket-status';

/** Mirror of `DashboardDto` (computed on the channels the user can see; UTC days). */
export interface Dashboard {
  kpis: DashboardKpis;
  /** Every status, zeros included, in workflow order. */
  channelsByStatus: { status: TicketStatus; count: number }[];
  /** Tickets with at least one open channel, most urgent first (absent priority = 0). */
  openTicketsByPriority: { priority: TicketPriority; count: number }[];
  /** Last 14 UTC days, oldest first, zeros included (`date` = `yyyy-MM-dd`). */
  messagesPerDay: { date: string; count: number }[];
  needsAttention: AttentionItem[];
  latestTickets: TicketListItem[];
}

export interface DashboardKpis {
  openChannels: number;
  /** Open channels whose latest message comes from the other side. */
  awaitingReply: number;
  createdLast7Days: number;
  resolvedLast30Days: number;
  messagesLast14Days: number;
}

/** Open channel waiting for the user's side to answer — mirror of `AttentionItemDto`. */
export interface AttentionItem {
  ticketNumber: string;
  title: string;
  type: TicketType;
  priority: TicketPriority;
  channelId: number;
  status: TicketStatus;
  counterpart: string;
  lastAuthor: UserRef;
  lastMessageAt: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  dashboard(): HttpResourceRef<Dashboard | undefined> {
    return httpResource<Dashboard>(() => this.baseUrl);
  }
}
