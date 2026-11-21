import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateTicketRequest, TicketListItem, TicketSendOption } from './ticket.models';

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
}
