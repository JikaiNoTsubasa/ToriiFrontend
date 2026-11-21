import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { AppError } from '../../../core/http/problem-details';

interface LoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [FormField],
  templateUrl: './login.html',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  // Formulaire signal : le modèle est la source de vérité, les validateurs
  // sont déclarés dans le schéma.
  private readonly model = signal<LoginModel>({ email: '', password: '' });
  protected readonly form = form(this.model, (path) => {
    required(path.email);
    email(path.email);
    required(path.password);
  });

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.loading()) {
      return;
    }

    // submit() marque tous les champs comme touchés et n'exécute l'action
    // que si le formulaire est valide.
    await submit(this.form, async () => {
      this.loading.set(true);
      this.error.set(null);
      try {
        await firstValueFrom(this.auth.login(this.model()));
        this.router.navigate(['/']);
      } catch (err) {
        // errorInterceptor a normalisé l'erreur au format AppError (ProblemDetails).
        this.error.set((err as AppError)?.detail ?? 'Échec de la connexion.');
      } finally {
        this.loading.set(false);
      }
      return undefined;
    });
  }
}
