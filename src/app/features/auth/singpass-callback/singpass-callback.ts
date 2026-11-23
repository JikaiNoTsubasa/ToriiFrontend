import { Component, inject, OnInit, signal } from '@angular/core';
import { email, form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ACCOUNT_PENDING_CODE, ACCOUNT_REJECTED_CODE } from '../../../core/auth/auth.models';
import { SingpassRegistration } from '../../../core/auth/singpass.models';
import { SingpassService } from '../../../core/auth/singpass.service';
import { AppError } from '../../../core/http/problem-details';
import { RequestSent } from '../request-sent/request-sent';

const MAX_NAME_LENGTH = 128;

type Step =
  | { kind: 'working' }
  | { kind: 'error'; title: string; detail: string }
  | { kind: 'notice'; pending: boolean; title: string; detail: string }
  | { kind: 'register'; registration: SingpassRegistration }
  | { kind: 'sent'; email: string };

interface CompleteModel {
  email: string;
  displayName: string;
  position: string;
}

/**
 * Page Singpass returns to (`/auth/singpass/callback?code&state&iss`). Sends the response to
 * the API, then: signs in (linked, approved account), explains why the account cannot sign in
 * yet (pending / declined), or asks for the missing details of a new account request.
 */
@Component({
  selector: 'app-singpass-callback',
  imports: [FormField, RouterLink, RequestSent],
  templateUrl: './singpass-callback.html',
})
export class SingpassCallback implements OnInit {
  private readonly singpass = inject(SingpassService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly step = signal<Step>({ kind: 'working' });
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly model = signal<CompleteModel>({ email: '', displayName: '', position: '' });
  protected readonly form = form(this.model, (path) => {
    required(path.email, { message: 'Enter your email.' });
    email(path.email, { message: 'Enter a valid email.' });
    required(path.displayName, { message: 'Enter your name.' });
    maxLength(path.displayName, MAX_NAME_LENGTH, { message: `${MAX_NAME_LENGTH} characters maximum.` });
    maxLength(path.position, MAX_NAME_LENGTH, { message: `${MAX_NAME_LENGTH} characters maximum.` });
  });

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    // Clean URL: the code is single use, a reload must not replay it.
    this.router.navigate([], { replaceUrl: true, queryParams: {} });

    try {
      const res = await firstValueFrom(
        this.singpass.callback({
          code: params.get('code'),
          state: params.get('state'),
          iss: params.get('iss'),
          error: params.get('error'),
        }),
      );
      if (res.outcome === 'SIGNED_IN') {
        this.router.navigate(['/']);
        return;
      }
      const registration = res.registration!;
      this.model.set({ email: registration.email ?? '', displayName: registration.displayName ?? '', position: '' });
      this.step.set({ kind: 'register', registration });
    } catch (err) {
      const error = err as AppError;
      const code = error?.problem?.['code'];
      if (code === ACCOUNT_PENDING_CODE || code === ACCOUNT_REJECTED_CODE) {
        this.step.set({ kind: 'notice', pending: code === ACCOUNT_PENDING_CODE, title: error.title, detail: error.detail });
      } else {
        this.step.set({
          kind: 'error',
          title: error?.title ?? 'Singpass sign-in failed',
          detail: error?.detail ?? 'Please try again.',
        });
      }
    }
  }

  protected async complete(event: Event, registration: SingpassRegistration): Promise<void> {
    event.preventDefault();
    if (this.sending()) {
      return;
    }
    await submit(this.form, async () => {
      const { email, displayName, position } = this.model();
      this.sending.set(true);
      this.error.set(null);
      try {
        const res = await firstValueFrom(
          this.singpass.register({ token: registration.token, email, displayName, position: position.trim() || null }),
        );
        this.step.set({ kind: 'sent', email: res.email });
      } catch (err) {
        const error = err as AppError;
        this.error.set(
          error?.errors?.['email']?.[0] ?? error?.errors?.['displayName']?.[0] ?? error?.detail ?? 'The account request failed.',
        );
      } finally {
        this.sending.set(false);
      }
      return undefined;
    });
  }
}
