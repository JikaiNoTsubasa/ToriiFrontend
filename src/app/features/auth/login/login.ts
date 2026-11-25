import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ACCOUNT_PENDING_CODE, ACCOUNT_REJECTED_CODE } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { SingpassService } from '../../../core/auth/singpass.service';
import { AppError } from '../../../core/http/problem-details';

interface LoginModel {
  email: string;
  password: string;
}

/** Valid credentials, but the account cannot sign in yet (or at all). */
interface AccountNotice {
  kind: 'pending' | 'rejected';
  title: string;
  detail: string;
}

@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<AccountNotice | null>(null);

  // Signal form: the model is the source of truth, validators
  // are declared in the schema.
  private readonly model = signal<LoginModel>({ email: '', password: '' });
  protected readonly form = form(this.model, (path) => {
    required(path.email);
    email(path.email);
    required(path.password);
  });

  // --- Singpass (button hidden while unavailable) ---
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

    // submit() marks every field as touched and only runs the action
    // if the form is valid.
    await submit(this.form, async () => {
      this.loading.set(true);
      this.error.set(null);
      this.notice.set(null);
      try {
        await firstValueFrom(this.auth.login(this.model()));
        this.router.navigate(['/']);
      } catch (err) {
        // errorInterceptor normalized the error into an AppError (ProblemDetails).
        const error = err as AppError;
        const code = error?.problem?.['code'];
        if (code === ACCOUNT_PENDING_CODE || code === ACCOUNT_REJECTED_CODE) {
          this.notice.set({
            kind: code === ACCOUNT_PENDING_CODE ? 'pending' : 'rejected',
            title: error.title,
            detail: error.detail,
          });
        } else {
          this.error.set(error?.detail ?? 'Sign-in failed.');
        }
      } finally {
        this.loading.set(false);
      }
      return undefined;
    });
  }
}
