import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../auth/auth.models';
import { skipErrorNotification } from '../http/problem-details';
import { Profile } from './profile.models';

/**
 * The signed-in user's own profile (`/api/profile`). Password / email changes report a
 * wrong current password inline, so they skip the global error toast.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/profile`;

  profile(): HttpResourceRef<Profile | undefined> {
    return httpResource<Profile>(() => this.baseUrl);
  }

  update(displayName: string): Observable<Profile> {
    return this.http.put<Profile>(this.baseUrl, { displayName });
  }

  changeEmail(newEmail: string, currentPassword: string): Observable<Profile> {
    return this.http.put<Profile>(`${this.baseUrl}/email`, { newEmail, currentPassword }, skipErrorNotification());
  }

  /** Revokes every session and returns a fresh one for this browser. */
  changePassword(currentPassword: string, newPassword: string): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(
      `${this.baseUrl}/password`,
      { currentPassword, newPassword },
      skipErrorNotification(),
    );
  }

  uploadAvatar(image: Blob, fileName: string): Observable<Profile> {
    const body = new FormData();
    body.append('file', image, fileName);
    return this.http.post<Profile>(`${this.baseUrl}/avatar`, body);
  }

  removeAvatar(): Observable<Profile> {
    return this.http.delete<Profile>(`${this.baseUrl}/avatar`);
  }

  /** Signs out of all devices (the current session included). */
  revokeAllSessions(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/sessions/revoke-all`, {});
  }
}
