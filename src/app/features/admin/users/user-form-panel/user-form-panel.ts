import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { disabled, email, form, FormField, maxLength, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { UserRole } from '../../../../core/auth/auth.models';
import { AuthService } from '../../../../core/auth/auth.service';
import { AdminUser } from '../../../../core/services/admin-user.models';
import { AdminUserService } from '../../../../core/services/admin-user.service';
import { SidePanelRef } from '../../../../shared/side-panel/side-panel.models';

const MIN_PASSWORD_LENGTH = 8;

interface UserForm {
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  /** Initial password on creation; optional new password on edit ('' = unchanged). */
  password: string;
}

/**
 * Side panel form creating a user, or updating one when `user` is given.
 * Your own role and active state cannot be changed (also enforced by the API).
 * Closes the panel with the saved {@link AdminUser}.
 */
@Component({
  selector: 'app-user-form-panel',
  imports: [FormField],
  templateUrl: './user-form-panel.html',
})
export class UserFormPanel {
  private readonly service = inject(AdminUserService);
  private readonly auth = inject(AuthService);
  protected readonly ref = inject<SidePanelRef<AdminUser>>(SidePanelRef);

  /** User to edit; `null` creates a new one. */
  readonly user = input<AdminUser | null>(null);

  protected readonly isEdit = computed(() => this.user() !== null);
  protected readonly isSelf = computed(() => this.user()?.id === this.auth.user()?.id);
  protected readonly saving = signal(false);

  /** Form model, reset whenever the edited user changes. */
  private readonly model = linkedSignal<UserForm>(() => {
    const user = this.user();
    return {
      email: user?.email ?? '',
      displayName: user?.displayName ?? '',
      role: user?.role ?? 'USER',
      isActive: user?.isActive ?? true,
      password: '',
    };
  });
  protected readonly form = form(this.model, (path) => {
    required(path.email, { message: 'Email is required.' });
    email(path.email, { message: 'Enter a valid email address.' });
    maxLength(path.email, 256, { message: '256 characters maximum.' });
    required(path.displayName, { message: 'Display name is required.' });
    maxLength(path.displayName, 128, { message: '128 characters maximum.' });
    required(path.password, { message: 'An initial password is required.', when: () => !this.isEdit() });
    validate(path.password, ({ value }) =>
      value() && value().length < MIN_PASSWORD_LENGTH
        ? { kind: 'minLength', message: `${MIN_PASSWORD_LENGTH} characters minimum.` }
        : undefined,
    );
    disabled(path.role, () => (this.isSelf() ? 'You cannot change your own role.' : false));
    disabled(path.isActive, () => (this.isSelf() ? 'You cannot disable your own account.' : false));
  });

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    if (this.saving()) {
      return;
    }
    await submit(this.form, async () => {
      const { email, displayName, role, isActive, password } = this.model();
      const user = this.user();
      this.saving.set(true);
      try {
        const saved = await firstValueFrom(
          user
            ? this.service.update(user.id, { email, displayName, role, isActive, newPassword: password || null })
            : this.service.create({ email, displayName, role, password }),
        );
        this.ref.close(saved);
      } catch {
        // Error already notified by errorInterceptor; the panel stays open.
      } finally {
        this.saving.set(false);
      }
      return undefined;
    });
  }
}
