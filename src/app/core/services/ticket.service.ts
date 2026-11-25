import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateTicketRequest,
  FileRef,
  ForwardFileRequest,
  ForwardFileResult,
  ForwardMessageRequest,
  ForwardResult,
  OpenChannelRequest,
  TicketDetail,
  TicketListItem,
  TicketMessage,
  TicketSendOption,
} from './ticket.models';
import { PagedResult } from '../http/paged-result';
import { TicketPriority, TicketType } from './ticket-classification';
import { TicketStatus } from './ticket-status';
import { TicketSort } from './ticket-sort';

/**
 * Ticket list query. `statuses` keeps tickets where at least one of the user's channels has
 * one of them; `types` / `priorities` keep tickets of one of them (`null` = no filter);
 * `page` is 1-based; `sort` defaults to newest first on the API side.
 */
export interface TicketListQuery {
  search: string;
  statuses: readonly TicketStatus[] | null;
  types: readonly TicketType[] | null;
  priorities: readonly TicketPriority[] | null;
  page: number;
  pageSize: number;
  sort: TicketSort;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tickets`;

  /**
   * One page of the tickets visible to the signed-in user, filtered and paginated by the API,
   * as a signal resource reloading whenever `query()` changes (`undefined` = no request).
   * Call it in an injection context (component field initializer). Errors go through
   * errorInterceptor (toast + AppError).
   */
  visibleTickets(query: () => TicketListQuery | undefined): HttpResourceRef<PagedResult<TicketListItem> | undefined> {
    return httpResource<PagedResult<TicketListItem>>(() => {
      const q = query();
      if (!q) {
        return undefined;
      }
      const params: Record<string, string | number | readonly string[]> = {
        page: q.page,
        pageSize: q.pageSize,
        sort: q.sort.field,
        dir: q.sort.direction,
      };
      if (q.search) {
        params['search'] = q.search;
      }
      if (q.statuses) {
        params['status'] = q.statuses;
      }
      if (q.types) {
        params['type'] = q.types;
      }
      if (q.priorities) {
        params['priority'] = q.priorities;
      }
      return { url: this.baseUrl, params };
    });
  }

  /** Customers the user may send tickets from, with their allowed targets (signal resource). */
  sendOptions(): HttpResourceRef<TicketSendOption[]> {
    return httpResource<TicketSendOption[]>(() => `${this.baseUrl}/send-options`, { defaultValue: [] });
  }

  /** Creates the ticket, its channel and the first message; returns the listed ticket. */
  create(request: CreateTicketRequest): Observable<TicketListItem> {
    return this.http.post<TicketListItem>(this.baseUrl, request);
  }

  /** Changes the type and priority of a ticket (shared by all its channels). */
  updateClassification(number: string, type: TicketType, priority: TicketPriority): Observable<TicketListItem> {
    return this.http.put<TicketListItem>(`${this.baseUrl}/${number}/classification`, { type, priority });
  }

  /** Changes the status of one channel of a ticket; returns the updated listed ticket. */
  updateChannelStatus(number: string, channelId: number, status: TicketStatus): Observable<TicketListItem> {
    return this.http.put<TicketListItem>(`${this.baseUrl}/${number}/channels/${channelId}/status`, { status });
  }

  /**
   * Ticket details as seen by the user (their channels + messages), as a signal resource
   * reloading when `number()` changes.
   */
  ticket(number: () => string | undefined): HttpResourceRef<TicketDetail | undefined> {
    return httpResource<TicketDetail>(() => {
      const value = number();
      return value ? `${this.baseUrl}/${encodeURIComponent(value)}` : undefined;
    });
  }

  /** Replies in one channel of the ticket. */
  postMessage(number: string, channelId: number, content: string): Observable<TicketMessage> {
    return this.http.post<TicketMessage>(`${this.baseUrl}/${number}/channels/${channelId}/messages`, { content });
  }

  /**
   * Posts in the internal thread of one of the user's customers (created by its first message);
   * only that customer's members see it.
   */
  postInternalMessage(number: string, customerId: number, content: string): Observable<TicketMessage> {
    return this.http.post<TicketMessage>(`${this.baseUrl}/${number}/internal/${customerId}/messages`, { content });
  }

  /** Forwards a message to another channel of the ticket (created when needed). */
  forwardMessage(
    number: string,
    channelId: number,
    messageId: number,
    request: ForwardMessageRequest,
  ): Observable<ForwardResult> {
    return this.http.post<ForwardResult>(
      `${this.baseUrl}/${number}/channels/${channelId}/messages/${messageId}/forward`,
      request,
    );
  }

  /** Uploads files to a channel (recorded in its activity feed). */
  uploadFiles(number: string, channelId: number, files: readonly File[]): Observable<FileRef[]> {
    const body = new FormData();
    for (const file of files) {
      body.append('files', file, file.name);
    }
    return this.http.post<FileRef[]>(`${this.baseUrl}/${number}/channels/${channelId}/files`, body);
  }

  /** File content of a channel, as a Blob (the API requires the Bearer token, so no plain link). */
  downloadFile(number: string, channelId: number, fileId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${number}/channels/${channelId}/files/${fileId}`, {
      responseType: 'blob',
    });
  }

  /** Forwards a file to another channel of the ticket (only its id is linked; created when needed). */
  forwardFile(
    number: string,
    channelId: number,
    fileId: number,
    request: ForwardFileRequest,
  ): Observable<ForwardFileResult> {
    return this.http.post<ForwardFileResult>(
      `${this.baseUrl}/${number}/channels/${channelId}/files/${fileId}/forward`,
      request,
    );
  }

  /** Opens a new channel on the ticket (with its first message); returns the updated details. */
  openChannel(number: string, request: OpenChannelRequest): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(`${this.baseUrl}/${number}/channels`, request);
  }
}
