import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { AdminUser, originalEmail } from '../../../core/services/admin-user.models';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { Topbar } from '../../../layout/topbar/topbar';
import { RadialMenuService } from '../../../shared/radial-menu/radial-menu.service';
import { SidePanelService } from '../../../shared/side-panel/side-panel.service';
import { UserFormPanel } from './user-form-panel/user-form-panel';

@Component({
  selector: 'app-admin-users',
  imports: [Topbar, DatePipe],
  templateUrl: './users.html',
})
export class AdminUsers {
  private readonly service = inject(AdminUserService);
  private readonly notifications = inject(NotificationService);
  private readonly radial = inject(RadialMenuService);
  private readonly panel = inject(SidePanelService);
  private readonly auth = inject(AuthService);

  /** Shows the deleted accounts too (read-only rows). */
  protected readonly showDeleted = signal(false);
  protected readonly users = this.service.users(this.showDeleted);
  protected readonly originalEmail = originalEmail;

  /** Request in progress (toggle, delete). */
  protected readonly busy = signal(false);

  // --- Client-side filter (name or email) ---
  protected readonly search = signal('');
  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const users = this.users.value();
    return term
      ? users.filter((u) => u.displayName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
      : users;
  });

  protected readonly userCount = computed(() => this.users.value().filter((u) => !u.isDeleted).length);
  protected readonly activeCount = computed(() => this.users.value().filter((u) => u.isActive).length);
  protected readonly deletedCount = computed(() => this.users.value().filter((u) => u.isDeleted).length);

  protected isSelf(user: AdminUser): boolean {
    return user.id === this.auth.user()?.id;
  }

  // --- Create / edit (side panel) ---
  protected openCreate(): void {
    this.panel
      .open<AdminUser>(UserFormPanel, { title: 'New user' })
      .closed.then((created) => {
        if (created) {
          this.notifications.success('User created', created.displayName);
          this.users.reload();
        }
      });
  }

  protected openEdit(user: AdminUser): void {
    this.panel
      .open<AdminUser>(UserFormPanel, { title: 'Edit user', subtitle: user.email, inputs: { user } })
      .closed.then((saved) => {
        if (saved) {
          this.notifications.success('User updated', saved.displayName);
          this.users.reload();
          // Own account edited: refresh the signed-in user (sidebar name / email).
          if (this.isSelf(saved)) {
            this.auth.loadCurrentUser().subscribe({ error: () => {} });
          }
        }
      });
  }

  // --- Row actions ---
  protected toggleActive(user: AdminUser): void {
    const isActive = !user.isActive;
    this.run(
      this.service.update(user.id, {
        email: user.email,
        displayName: user.displayName,
        position: user.position,
        role: user.role,
        isActive,
        newPassword: null,
      }),
      isActive ? 'User enabled' : 'User disabled',
      user.displayName,
    );
  }

  protected remove(user: AdminUser): void {
    if (!confirm(`Delete user "${user.displayName}" (${user.email})? They will no longer be able to sign in.`)) {
      return;
    }
    this.run(this.service.delete(user.id), 'User deleted', user.displayName);
  }

  protected onContextMenu(event: MouseEvent, user: AdminUser): void {
    if (user.isDeleted) {
      return; // read-only row: the browser menu stays available
    }
    const self = this.isSelf(user);
    this.radial.open(event, [
      {
        label: 'Edit',
        icon: 'fas fa-pen',
        run: () => this.openEdit(user),
      },
      {
        label: user.isActive ? 'Disable' : 'Enable',
        icon: user.isActive ? 'fas fa-toggle-off' : 'fas fa-toggle-on',
        disabled: self,
        run: () => this.toggleActive(user),
      },
      {
        label: 'Delete',
        icon: 'fas fa-trash',
        color: '#b00020',
        bg: '#b00020',
        disabled: self,
        run: () => this.remove(user),
      },
    ]);
  }

  /** Runs a write, then reloads the list (errors are already notified). */
  private run(request: Observable<unknown>, title: string, detail: string): void {
    this.busy.set(true);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.notifications.success(title, detail);
        this.users.reload();
      },
      error: () => this.busy.set(false),
    });
  }
}
