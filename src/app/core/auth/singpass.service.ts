import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { DOCUMENT, Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { skipErrorNotification } from '../http/problem-details';
import { RegistrationResponse } from './auth.models';
import { AuthService } from './auth.service';
import {
  SingpassCallbackRequest,
  SingpassCallbackResponse,
  SingpassRegisterRequest,
  SingpassStart,
  SingpassStatus,
} from './singpass.models';

/**
 * Singpass sign-in / account request (`/api/auth/singpass`). `start()` leaves the app for the
 * Singpass page; Singpass then returns to `/auth/singpass/callback`, which calls `callback()`.
 * Errors are handled inline by the pages (no global toast).
 */
@Injectable({ providedIn: 'root' })
export class SingpassService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly baseUrl = `${environment.apiUrl}/auth/singpass`;

  /** Whether the Singpass buttons are usable (disabled while loading or unreachable). */
  status(): HttpResourceRef<SingpassStatus> {
    return httpResource<SingpassStatus>(() => ({ url: this.baseUrl, ...skipErrorNotification() }), {
      defaultValue: { enabled: false },
    });
  }

  /** Pushes the authorization request, then sends the browser to Singpass. */
  async start(): Promise<void> {
    const { authorizationUrl } = await firstValueFrom(
      this.http.post<SingpassStart>(`${this.baseUrl}/start`, null, skipErrorNotification()),
    );
    this.document.location.assign(authorizationUrl);
  }

  /** Completes the sign-in; a `SIGNED_IN` outcome opens the session. */
  callback(request: SingpassCallbackRequest): Observable<SingpassCallbackResponse> {
    return this.http
      .post<SingpassCallbackResponse>(`${this.baseUrl}/callback`, request, skipErrorNotification())
      .pipe(tap((res) => res.session && this.auth.applySession(res.session)));
  }

  register(request: SingpassRegisterRequest): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(`${this.baseUrl}/register`, request, skipErrorNotification());
  }
}
