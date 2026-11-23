import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Confirmation shown once an account request is sent (email or Singpass sign-up). */
@Component({
  selector: 'app-request-sent',
  imports: [RouterLink],
  host: { class: 'panel login__panel login__panel--wide', role: 'status' },
  template: `
    <h1 class="login__title"><img src="/Torii_logo.png" alt="Torii Logo" width="64" height="64" /><br />Torii</h1>

    <div class="login__done">
      <i class="fas fa-user-clock" aria-hidden="true"></i>
      <h2>Request sent</h2>
      <p>
        Your account <strong>{{ email() }}</strong> has been created and is waiting for an
        administrator's approval.
      </p>
      <p class="text-muted">
        You will be able to sign in{{ singpass() ? ' with Singpass' : '' }} once it is approved.
      </p>
    </div>

    <a class="btn" routerLink="/login">Back to sign in</a>
  `,
})
export class RequestSent {
  readonly email = input.required<string>();
  readonly singpass = input(false);
}
