import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SingpassConfig, SingpassConfigUpdate, SingpassTestResult } from './admin-singpass.models';

/**
 * Singpass settings (`/api/admin/singpass`, ADMIN only). Errors go through errorInterceptor
 * (toast + AppError); validation errors carry per-field messages.
 */
@Injectable({ providedIn: 'root' })
export class AdminSingpassService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/singpass`;

  /** Public JWKS URL to register in the Singpass Developer Portal. */
  readonly jwksUrl = new URL(`${environment.apiUrl}/auth/singpass/jwks`, globalThis.location?.origin).toString();

  get(): Observable<SingpassConfig> {
    return this.http.get<SingpassConfig>(this.baseUrl);
  }

  update(request: SingpassConfigUpdate): Observable<SingpassConfig> {
    return this.http.put<SingpassConfig>(this.baseUrl, request);
  }

  generateKeys(): Observable<SingpassConfig> {
    return this.http.post<SingpassConfig>(`${this.baseUrl}/keys`, null);
  }

  test(): Observable<SingpassTestResult> {
    return this.http.post<SingpassTestResult>(`${this.baseUrl}/test`, null);
  }
}
