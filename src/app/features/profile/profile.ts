import { DatePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { email, form, FormField, maxLength, minLength, required, submit, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AppError } from '../../core/http/problem-details';
import { NotificationService } from '../../core/notifications/notification.service';
import { Profile } from '../../core/services/profile.models';
import { ProfileService } from '../../core/services/profile.service';
import { Topbar } from '../../layout/topbar/topbar';
import { cropSquareImage } from '../../shared/files/files';
import { passwordStrength } from '../../shared/forms/password-strength';

/** Size (px) of the uploaded avatar, center-cropped to a square in the browser. */
const AVATAR_SIZE = 256;
/** Same limit as the API (ProfileManager). */
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Profile page (`/profile`): identity card with avatar upload, personal information, email
 * change (current password required), password change with a strength meter, and
 * "sign out of all devices". Changes are reflected right away in the sidebar.
 */
@Component({
  selector: 'app-profile',
  imports: [Topbar, DatePipe, FormField],
  templateUrl: './profile.html',
})
export class ProfilePage {
  private readonly service = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly profile = this.service.profile();

  protected readonly initials = computed(() => {
    const name = this.profile.value()?.displayName ?? '';
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  });

  // --- Avatar ---
  protected readonly avatarBusy = signal(false);

  protected async pickAvatar(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = ''; // allow picking the same file again
    if (!file || this.avatarBusy()) {
      return;
    }
    // GIFs are sent as they are: a canvas only draws their first frame, so cropping them
    // would drop the animation (they are still shown square thanks to object-fit: cover).
    const isGif = file.type === 'image/gif';
    if (isGif && file.size > MAX_AVATAR_BYTES) {
      this.notifications.error('Image too large', 'An animated avatar must not exceed 5 MB.');
      return;
    }
    this.avatarBusy.set(true);
    try {
      const image = isGif
        ? file
        : await cropSquareImage(file, AVATAR_SIZE).catch(() => {
            throw new Error('unreadable');
          });
      const extension = isGif ? 'gif' : image.type === 'image/webp' ? 'webp' : 'png';
      this.applyProfile(await firstValueFrom(this.service.uploadAvatar(image, `avatar.${extension}`)));
      this.notifications.success('Photo updated');
    } catch (err) {
      if (err instanceof Error && err.message === 'unreadable') {
        this.notifications.error('Unsupported image', 'Choose a PNG, JPEG, WebP or GIF image.');
      }
      // HTTP errors are already notified by errorInterceptor.
    } finally {
      this.avatarBusy.set(false);
    }
  }

  protected async removeAvatar(): Promise<void> {
    if (this.avatarBusy()) {
      return;
    }
    this.avatarBusy.set(true);
    try {
      this.applyProfile(await firstValueFrom(this.service.removeAvatar()));
      this.notifications.success('Photo removed');
    } catch {
      // Already notified by errorInterceptor.
    } finally {
      this.avatarBusy.set(false);
    }
  }

  // --- Personal information ---
  protected readonly savingInfo = signal(false);
  private readonly infoModel = linkedSignal(() => ({
    displayName: this.profile.value()?.displayName ?? '',
    position: this.profile.value()?.position ?? '',
  }));
  protected readonly infoForm = form(this.infoModel, (path) => {
    required(path.displayName, { message: 'Display name is required.' });
    maxLength(path.displayName, 128, { message: '128 characters maximum.' });
    maxLength(path.position, 128, { message: '128 characters maximum.' });
  });
  protected readonly infoChanged = computed(() => {
    const { displayName, position } = this.infoModel();
    const profile = this.profile.value();
    return displayName.trim() !== (profile?.displayName ?? '') || position.trim() !== (profile?.position ?? '');
  });

  protected async saveInfo(event: Event): Promise<void> {
    event.preventDefault();
    if (this.savingInfo() || !this.infoChanged()) {
      return;
    }
    await submit(this.infoForm, async () => {
      this.savingInfo.set(true);
      try {
        const { displayName, position } = this.infoModel();
        this.applyProfile(await firstValueFrom(this.service.update(displayName.trim(), position.trim() || null)));
        this.notifications.success('Profile updated');
      } catch {
        // Already notified by errorInterceptor.
      } finally {
        this.savingInfo.set(false);
      }
      return undefined;
    });
  }

  // --- Email ---
  protected readonly savingEmail = signal(false);
  protected readonly emailError = signal<string | null>(null);
  private readonly emailModel = signal({ newEmail: '', currentPassword: '' });
  protected readonly emailForm = form(this.emailModel, (path) => {
    required(path.newEmail, { message: 'Enter the new email address.' });
    email(path.newEmail, { message: 'Enter a valid email address.' });
    required(path.currentPassword, { message: 'Confirm with your current password.' });
  });

  protected async saveEmail(event: Event): Promise<void> {
    event.preventDefault();
    if (this.savingEmail()) {
      return;
    }
    await submit(this.emailForm, async () => {
      const { newEmail, currentPassword } = this.emailModel();
      this.savingEmail.set(true);
      this.emailError.set(null);
      try {
        this.applyProfile(await firstValueFrom(this.service.changeEmail(newEmail, currentPassword)));
        this.emailForm().reset({ newEmail: '', currentPassword: '' });
        this.notifications.success('Email updated', newEmail.trim().toLowerCase());
      } catch (err) {
        this.emailError.set(firstError(err as AppError, 'currentPassword'));
      } finally {
        this.savingEmail.set(false);
      }
      return undefined;
    });
  }

  // --- Password ---
  protected readonly savingPassword = signal(false);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly showPasswords = signal(false);
  private readonly passwordModel = signal({ currentPassword: '', newPassword: '', confirmPassword: '' });
  protected readonly passwordForm = form(this.passwordModel, (path) => {
    required(path.currentPassword, { message: 'Enter your current password.' });
    required(path.newPassword, { message: 'Choose a new password.' });
    minLength(path.newPassword, MIN_PASSWORD_LENGTH, { message: `${MIN_PASSWORD_LENGTH} characters minimum.` });
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() !== valueOf(path.newPassword) ? { kind: 'mismatch', message: 'The passwords do not match.' } : undefined,
    );
  });
  protected readonly strength = computed(() => passwordStrength(this.passwordModel().newPassword));

  protected async savePassword(event: Event): Promise<void> {
    event.preventDefault();
    if (this.savingPassword()) {
      return;
    }
    await submit(this.passwordForm, async () => {
      const { currentPassword, newPassword } = this.passwordModel();
      this.savingPassword.set(true);
      this.passwordError.set(null);
      try {
        // Every session is revoked server-side; this browser gets a fresh one.
        this.auth.applySession(await firstValueFrom(this.service.changePassword(currentPassword, newPassword)));
        this.passwordForm().reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
        this.notifications.success('Password updated', 'Your other devices have been signed out.');
      } catch (err) {
        this.passwordError.set(firstError(err as AppError, 'currentPassword', 'newPassword'));
      } finally {
        this.savingPassword.set(false);
      }
      return undefined;
    });
  }

  // --- Sessions ---
  protected readonly signingOut = signal(false);

  protected signOutEverywhere(): void {
    if (!confirm('Sign out of all devices, including this one?')) {
      return;
    }
    this.signingOut.set(true);
    this.service.revokeAllSessions().subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/login']);
      },
      error: () => this.signingOut.set(false),
    });
  }

  /** Shows the saved profile and mirrors it in the signed-in user (sidebar). */
  private applyProfile(profile: Profile): void {
    this.profile.set(profile);
    this.auth.updateUser({
      displayName: profile.displayName,
      position: profile.position,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
    });
  }
}

/** First API error message of the given fields, else the error detail. */
function firstError(error: AppError | undefined, ...fields: string[]): string {
  for (const field of fields) {
    const message = error?.errors?.[field]?.[0];
    if (message) {
      return message;
    }
  }
  return error?.detail ?? 'Something went wrong. Please try again.';
}
