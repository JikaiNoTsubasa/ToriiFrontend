import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Side menu entry. An entry with `children` is a section: its sub-entries
 * are shown while the current URL is under `path`.
 */
interface NavItem {
  label: string;
  icon: string;
  path: string;
  /** Visible to ADMINs only (the route must be guarded too). */
  adminOnly?: boolean;
  children?: NavItem[];
}

const NAV: NavItem[] = [
  { label: 'Home', icon: 'fa fa-home', path: '/' },
  { label: 'Tickets', icon: 'fa fa-ticket', path: '/tickets' },
  {
    label: 'Administration',
    icon: 'fa fa-gear',
    path: '/admin',
    adminOnly: true,
    children: [{ label: 'Customers', icon: 'fa fa-building', path: '/admin/customers' }],
  },
];

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;

  /** Current URL, used to expand the active section. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** Menu filtered by the signed-in user's role. */
  protected readonly nav = computed(() => {
    const isAdmin = this.auth.isAdmin();
    return NAV.filter((item) => !item.adminOnly || isAdmin);
  });

  protected isOpen(item: NavItem): boolean {
    const url = this.url();
    return url === item.path || url.startsWith(`${item.path}/`);
  }

  protected goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
