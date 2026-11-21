import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TicketEdge, TicketEdgeUpdate } from './admin-ticket-edge.models';

/**
 * Ticket configuration edges (`/api/admin/ticket-edges`, ADMIN only).
 * Reads = signal resources (create them in an injection context); writes =
 * Observables. Errors go through errorInterceptor (toast + AppError).
 */
@Injectable({ providedIn: 'root' })
export class AdminTicketEdgeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/ticket-edges`;

  edges(): HttpResourceRef<TicketEdge[]> {
    return httpResource<TicketEdge[]>(() => this.baseUrl, { defaultValue: [] });
  }

  create(sourceCustomerId: number, targetCustomerId: number): Observable<TicketEdge> {
    return this.http.post<TicketEdge>(this.baseUrl, { sourceCustomerId, targetCustomerId });
  }

  update(id: number, update: TicketEdgeUpdate): Observable<TicketEdge> {
    return this.http.put<TicketEdge>(`${this.baseUrl}/${id}`, update);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
