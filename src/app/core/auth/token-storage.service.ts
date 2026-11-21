import { Injectable } from '@angular/core';

const ACCESS_TOKEN_KEY = 'torii.accessToken';
const REFRESH_TOKEN_KEY = 'torii.refreshToken';

/**
 * Stockage des tokens. Le refresh token est persisté (localStorage) pour
 * survivre à un rechargement de page ; l'access token l'est aussi ici par
 * simplicité (à durcir plus tard : mémoire seule + cookie httpOnly).
 */
@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
