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
import { TicketStatus } from './ticket-status';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tickets`;

  /**
   * Tickets visible to the signed-in user, as a signal resource
   * (`value()`, `isLoading()`, `error()`, `reload()`). Call it in an injection
   * context (component field initializer): the request lives and dies with the
   * component. Errors go through errorInterceptor (toast + AppError).
   */
  visibleTickets(): HttpResourceRef<TicketListItem[]> {
    return httpResource<TicketListItem[]>(() => this.baseUrl, { defaultValue: [] });
  }

  /** Customers the user may send tickets from, with their allowed targets (signal resource). */
  sendOptions(): HttpResourceRef<TicketSendOption[]> {
    return httpResource<TicketSendOption[]>(() => `${this.baseUrl}/send-options`, { defaultValue: [] });
  }

  /** Creates the ticket, its channel and the first message; returns the listed ticket. */
  create(request: CreateTicketRequest): Observable<TicketListItem> {
    return this.http.post<TicketListItem>(this.baseUrl, request);
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
