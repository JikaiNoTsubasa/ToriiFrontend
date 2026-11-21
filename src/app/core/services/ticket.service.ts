import { httpResource, HttpResourceRef } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TicketListItem } from './ticket.models';

@Injectable({ providedIn: 'root' })
export class TicketService {
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
}
