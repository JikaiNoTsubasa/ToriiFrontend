import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    // Application shell: fixed menu on the left + content on the right.
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then((m) => m.ProfilePage),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/tickets/tickets').then((m) => m.Tickets),
      },
      {
        // Dedicated writing page; asks before dropping a started draft.
        path: 'tickets/new',
        loadComponent: () =>
          import('./features/tickets/ticket-create/ticket-create').then((m) => m.TicketCreate),
        canDeactivate: [(page: { canLeave(): boolean }) => page.canLeave()],
      },
      {
        // Ticket details (after `tickets/new`, which must match first); `?channel=` selects a channel.
        path: 'tickets/:number',
        loadComponent: () =>
          import('./features/tickets/ticket-details/ticket-details').then((m) => m.TicketDetails),
        canDeactivate: [(page: { canLeave(): boolean }) => page.canLeave()],
      },
      {
        // ADMIN-only section; each child = one submenu entry (shell.ts).
        path: 'admin',
        canMatch: [adminGuard],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'customers' },
          {
            path: 'users',
            loadComponent: () => import('./features/admin/users/users').then((m) => m.AdminUsers),
          },
          {
            path: 'customers',
            loadComponent: () =>
              import('./features/admin/customers/customers').then((m) => m.AdminCustomers),
          },
          {
            path: 'customers/:id',
            loadComponent: () =>
              import('./features/admin/customer-details/customer-details').then(
                (m) => m.AdminCustomerDetails,
              ),
          },
          {
            path: 'tickets',
            loadComponent: () =>
              import('./features/admin/ticket-config/ticket-config').then((m) => m.AdminTicketConfig),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
