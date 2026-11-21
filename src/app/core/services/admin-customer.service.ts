import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserDto } from '../auth/auth.models';
import { CustomerDetail, CustomerListItem } from './admin-customer.models';

/**
 * Customer administration (`/api/admin/*` routes, ADMIN only).
 * Reads = signal resources (create them in an injection context); writes =
 * Observables. Errors go through errorInterceptor (toast + AppError).
 */
@Injectable({ providedIn: 'root' })
export class AdminCustomerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/customers`;
  private readonly usersUrl = `${environment.apiUrl}/admin/users`;

  customers(): HttpResourceRef<CustomerListItem[]> {
    return httpResource<CustomerListItem[]>(() => this.baseUrl, { defaultValue: [] });
  }

  /** Customer details; reloads when `id()` changes. */
  customer(id: () => number | undefined): HttpResourceRef<CustomerDetail | undefined> {
    return httpResource<CustomerDetail>(() => {
      const value = id();
      return value === undefined ? undefined : `${this.baseUrl}/${value}`;
    });
  }

  /** User search; idle (no request) while `search()` is empty. */
  searchUsers(search: () => string): HttpResourceRef<UserDto[]> {
    return httpResource<UserDto[]>(
      () => {
        const value = search();
        return value ? { url: this.usersUrl, params: { search: value } } : undefined;
      },
      { defaultValue: [] },
    );
  }

  create(name: string): Observable<CustomerDetail> {
    return this.http.post<CustomerDetail>(this.baseUrl, { name });
  }

  rename(id: number, name: string): Observable<CustomerDetail> {
    return this.http.put<CustomerDetail>(`${this.baseUrl}/${id}`, { name });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addMember(id: number, userId: number): Observable<CustomerDetail> {
    return this.http.post<CustomerDetail>(`${this.baseUrl}/${id}/members`, { userId });
  }

  removeMember(id: number, userId: number): Observable<CustomerDetail> {
    return this.http.delete<CustomerDetail>(`${this.baseUrl}/${id}/members/${userId}`);
  }
}
