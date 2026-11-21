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

  // Les flux d'auth gèrent leurs erreurs en ligne / en arrière-plan :
  // ils désactivent la notification globale via skipErrorNotification().
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, request, skipErrorNotification())
      .pipe(tap((res) => this.handleAuth(res)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, request, skipErrorNotification())
      .pipe(tap((res) => this.handleAuth(res)));
  }

  /** Renouvelle l'access token à partir du refresh token stocké. */
  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.baseUrl}/refresh`,
        { refreshToken: this.storage.refreshToken },
        skipErrorNotification(),
      )
      .pipe(tap((res) => this.handleAuth(res)));
  }

  /** Recharge l'utilisateur courant depuis un token existant (au démarrage). */
  loadCurrentUser(): Observable<UserDto> {
    return this.http
      .get<UserDto>(`${this.baseUrl}/me`, skipErrorNotification())
      .pipe(tap((user) => this._user.set(user)));
  }

  logout(): void {
    const refreshToken = this.storage.refreshToken;
    if (refreshToken) {
      // "fire and forget" : on révoque côté serveur sans bloquer l'UI.
      this.http
        .post(`${this.baseUrl}/logout`, { refreshToken }, skipErrorNotification())
        .subscribe({ error: () => {} });
    }
    this.storage.clear();
    this._user.set(null);
  }

  private handleAuth(res: AuthResponse): void {
    this.storage.setTokens(res.accessToken, res.refreshToken);
    this._user.set(res.user);
  }
}
