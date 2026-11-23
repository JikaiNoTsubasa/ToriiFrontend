import { Component, computed, inject, signal } from '@angular/core';
import { email, form, FormField, maxLength, minLength, required, submit, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { SingpassService } from '../../../core/auth/singpass.service';
import { AppError } from '../../../core/http/problem-details';
import { passwordStrength } from '../../../shared/forms/password-strength';
import { RequestSent } from '../request-sent/request-sent';

const MIN_PASSWORD_LENGTH = 8;
const MAX_NAME_LENGTH = 128;

interface RegisterModel {
  email: string;
  displayName: string;
  position: string;
  password: string;
  confirmPassword: string;
}

/**
 * Account request. The account is not usable right away: it waits for an administrator's
 * approval, so a successful request shows a confirmation instead of signing in.
 */
@Component({
  selector: 'app-register',
  imports: [FormField, RouterLink, RequestSent],
  templateUrl: './register.html',
})
export class Register {
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly showPasswords = signal(false);
  /** Email of the request sent (the form is replaced by a confirmation). */
  protected readonly requested = signal<string | null>(null);

  private readonly model = signal<RegisterModel>({
    email: '',
    displayName: '',
    position: '',
    password: '',
    confirmPassword: '',
  });
  protected readonly form = form(this.model, (path) => {
    required(path.email, { message: 'Enter your email.' });
    email(path.email, { message: 'Enter a valid email.' });
    required(path.displayName, { message: 'Enter your name.' });
    maxLength(path.displayName, MAX_NAME_LENGTH, { message: `${MAX_NAME_LENGTH} characters maximum.` });
    maxLength(path.position, MAX_NAME_LENGTH, { message: `${MAX_NAME_LENGTH} characters maximum.` });
    required(path.password, { message: 'Choose a password.' });
    minLength(path.password, MIN_PASSWORD_LENGTH, { message: `${MIN_PASSWORD_LENGTH} characters minimum.` });
    validate(path.confirmPassword, ({ value, valueOf }) =>
      value() !== valueOf(path.password) ? { kind: 'mismatch', message: 'The passwords do not match.' } : undefined,
    );
  });
  protected readonly strength = computed(() => passwordStrength(this.model().password));

  // --- Singpass (button greyed out while unavailable) ---
  private readonly singpassService = inject(SingpassService);
  protected readonly singpass = this.singpassService.status();
  protected readonly redirecting = signal(false);
  protected readonly singpassError = signal<string | null>(null);

  protected async withSingpass(): Promise<void> {
    if (!this.singpass.value().enabled || this.redirecting()) {
      return;
    }
    this.redirecting.set(true);
    this.singpassError.set(null);
    try {
      await this.singpassService.start(); // leaves the app
    } catch (err) {
      this.singpassError.set((err as AppError)?.detail ?? 'Singpass is unavailable. Please try again later.');
      this.redirecting.set(false);
    }
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.loading()) {
      return;
    }

    await submit(this.form, async () => {
      const { email, displayName, position, password } = this.model();
      this.loading.set(true);
      this.error.set(null);
      try {
        const res = await firstValueFrom(
          this.auth.register({ email, displayName, password, position: position.trim() || null }),
        );
        this.requested.set(res.email);
      } catch (err) {
        const error = err as AppError;
        this.error.set(
          error?.errors?.['email']?.[0] ??
            error?.errors?.['displayName']?.[0] ??
            error?.errors?.['password']?.[0] ??
            error?.detail ??
            'The account request failed.',
        );
      } finally {
        this.loading.set(false);
      }
      return undefined;
    });
  }
}
