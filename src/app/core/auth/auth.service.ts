import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { skipErrorNotification } from '../http/problem-details';
import { TokenStorageService } from './token-storage.service';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegistrationResponse,
  UserDto,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(TokenStorageService);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly _user = signal<UserDto | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  // Auth flows handle their errors inline / in the background:
  // they disable the global notification through skipErrorNotification().
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, request, skipErrorNotification())
      .pipe(tap((res) => this.handleAuth(res)));
  }

  /** Requests an account; no session: it can only sign in once an administrator approves it. */
  register(request: RegisterRequest): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(`${this.baseUrl}/register`, request, skipErrorNotification());
  }

  /** Renews the access token from the stored refresh token. */
  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.baseUrl}/refresh`,
        { refreshToken: this.storage.refreshToken },
        skipErrorNotification(),
      )
      .pipe(tap((res) => this.handleAuth(res)));
  }

  /** Reloads the current user from an existing token (at startup). */
  loadCurrentUser(): Observable<UserDto> {
    return this.http
      .get<UserDto>(`${this.baseUrl}/me`, skipErrorNotification())
      .pipe(tap((user) => this._user.set(user)));
  }

  logout(): void {
    const refreshToken = this.storage.refreshToken;
    if (refreshToken) {
      // "fire and forget": revoke on the server without blocking the UI.
      this.http
        .post(`${this.baseUrl}/logout`, { refreshToken }, skipErrorNotification())
        .subscribe({ error: () => {} });
    }
    this.storage.clear();
    this._user.set(null);
  }

  /** Updates the signed-in user after a profile change (sidebar, guards…). */
  updateUser(changes: Partial<UserDto>): void {
    this._user.update((user) => (user ? { ...user, ...changes } : user));
  }

  /** Applies a session issued outside the login flow (e.g. after a password change). */
  applySession(res: AuthResponse): void {
    this.handleAuth(res);
  }

  private handleAuth(res: AuthResponse): void {
    this.storage.setTokens(res.accessToken, res.refreshToken);
    this._user.set(res.user);
  }
}
