import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { Injectable, Signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser, AdminUserCreate, AdminUserUpdate } from './admin-user.models';

/** Maximum number of users loaded by the administration list. */
const LIST_TAKE = 500;

/**
 * User administration (`/api/admin/users`, ADMIN only).
 * Reads = signal resources (create them in an injection context); writes =
 * Observables. Errors go through errorInterceptor (toast + AppError).
 */
@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/users`;

  /** Every user, disabled ones included; deleted ones too while `includeDeleted()` is true. */
  users(includeDeleted?: Signal<boolean>): HttpResourceRef<AdminUser[]> {
    return httpResource<AdminUser[]>(
      () => ({ url: this.baseUrl, params: { take: LIST_TAKE, includeDeleted: includeDeleted?.() ?? false } }),
      { defaultValue: [] },
    );
  }

  create(request: AdminUserCreate): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.baseUrl, request);
  }

  update(id: number, request: AdminUserUpdate): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
