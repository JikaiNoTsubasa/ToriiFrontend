# ⛩️ ToriiFrontend

Frontend of Torii, a web-based project management tool. "Torii" as in the
Japanese gates: the entrance to your projects.

The .NET API lives in the separate **ToriiBackend** repository.

## Stack

- **Angular 22** (standalone, zoneless, `OnPush` by default), SCSS, TypeScript 6
- **Signals everywhere**: state (`signal`/`computed`), `input()`/`output()`/`model()`,
  `viewChild()`, signal forms (`@angular/forms/signals`), `httpResource` for reads.
  No `@Input`/`@Output`/`@ViewChild`/`@HostListener` decorators (use `host: {}`).
- **Tiptap** rich text editor (`@tiptap/core`)
- Tests: **Vitest** (`ng test`)
- Icons: Font Awesome (kit loaded in `src/index.html`)

## Prerequisites

- **Node.js** + **npm**
- **Angular CLI 22** (`npm i -g @angular/cli` or through `npx`)
- The ToriiBackend API running on `http://localhost:5080`

## Getting started

```bash
npm install
npm start          # http://localhost:4200
```

The API URL is configured in `src/environments/environment.ts`
(`apiUrl`, `http://localhost:5080/api` by default). In production,
`environment.production.ts` is used (`/api`).

VS Code: **Run and Debug → "ng serve"**.

## Authentication

In `src/app/core/`:

- `auth/auth.service.ts` — login / register / refresh / logout, `user` and `isAdmin` signals.
- `auth/token-storage.service.ts` — token storage (localStorage).
- `interceptors/auth.interceptor.ts` — adds `Authorization: Bearer`, tries an
  automatic refresh on 401 (deduplicated), otherwise redirects to `/login`.
- `interceptors/error.interceptor.ts` — normalizes errors to the ProblemDetails
  format and shows a toast (can be disabled with `skipErrorNotification()`).
- `guards/auth.guard.ts` — protects authenticated routes; `guards/admin.guard.ts`
  restricts the administration section to ADMINs.

At startup (`app.config.ts`), the user is rehydrated through `/api/auth/me`
when a token is present.

## Enums

The API exchanges enums as **UPPERCASE strings** (`"ON_GOING"`), as in the
database; integers are rejected. On the frontend, an enum is a string union,
declared with `core/http/api-enum.ts` as a mirror of the C# enum:

```ts
export const TASK_STATUSES = apiEnum('NEW', 'ON_GOING', 'COMPLETED');
export type TaskStatus = ApiEnumValue<typeof TASK_STATUSES>;

const LABELS: ApiEnumMap<TaskStatus, string> = { NEW: 'New', ON_GOING: 'In progress', COMPLETED: 'Completed' };
parseApiEnum(TASK_STATUSES, route.queryParamMap.get('status')); // 'ON_GOING' | … | null
```

## Design

Every style is centralized in `src/styles.scss` (variables at the top of the
file: primary color `#bc002d`, square panels, Inter font). Available classes:
`.panel` / `.panel__head`, `.btn` / `.btn--ghost` / `.btn--danger` / `.btn--sm`,
`.field`, `.inline-form`, `.alert`, `.badge--*`, `.tabs`, `.table`, `.detail__meta`,
`.user-chip`, `.link`, plus the `.layout` / `.sidebar` / `.content` / `.page` /
`.topbar` shell.

All user-facing text is written in English (dates formatted as `MMM d, y`), and so
are code comments.

## Structure

```
src/app/
├── core/          # auth, interceptors, guards, notifications, clipboard, problem-details,
│                  # api-enum, services/ (httpResource-based API services)
├── features/      # auth/login, home, tickets (list, `/tickets/new`, details `/tickets/:number`
│                  #   with one channel-thread per channel), 
│                  # admin/ (users, customers, customer-details, ticket-config: ticket edges)
├── layout/        # shell (sidebar with submenus + content), topbar
└── shared/        # notifications (toasts), radial-menu (right-click), side-panel (forms),
                   # info-hint ("i" icon with a help popover, projected content),
                   # editable-input-text, rich-text-editor (Tiptap + slash commands)
```

## Adding a feature

1. Create the feature under `src/app/features/<name>/`.
2. Add it as a lazy child route of the `Shell` in `app.routes.ts` (protected by `authGuard`).
3. Add the menu entry in `layout/shell/shell.ts` (`NAV`).

### Menu, submenus and administration

A `NAV` entry can have `children` (a submenu, expanded while the URL is under its
`path`) and `adminOnly` (hidden from non-admins). The **Administration** section
(`/admin`, `features/admin/`) is guarded by `adminGuard` (`canMatch`); for a new
admin screen: a child route of `admin` in `app.routes.ts` + a `children` entry in
the Administration item of `NAV`. Route parameters arrive in component `input()`s
(`withComponentInputBinding`).

### Writing pages vs side panel

Short forms on list rows (customers, ticket edges) use the side panel below. Content that
needs room to work on (e.g. a new ticket with its rich text message) gets a dedicated page
using the `.compose` layout (main column + sticky side column with the actions), guarded
by a `canDeactivate` that confirms before dropping a started draft (see
`features/tickets/ticket-create`).

### Side panel (create / update forms)

A single right-hand side panel is available everywhere (`shared/side-panel/`, host
`<app-side-panel />` mounted in `app.html`). Open any component in it and get its result:

```ts
private readonly panel = inject(SidePanelService);

this.panel
  .open<CustomerDetail>(CustomerFormPanel, { title: 'Edit customer', subtitle: c.name, inputs: { customer: c } })
  .closed.then((saved) => saved && this.customers.reload()); // undefined when dismissed
```

The content component injects `SidePanelRef` and calls `ref.close(result)`; its template
uses the shared layout: `<form class="side-panel__form">` → `.side-panel__body` (scrolls) +
`.side-panel__footer` (Cancel / Save). The host provides the header, the backdrop, Escape /
backdrop-click dismissal and the slide-in animation. Opening a panel dismisses the previous
one. Examples: `features/admin/customers/customer-form-panel`,
`features/admin/ticket-config/ticket-edge-form-panel` (both handle create and edit).

## Build

```bash
npm run build      # output in dist/torii-web
npm test
```

## To do

- [ ] Business features
- [ ] Sign-up page (the `register` endpoint already exists)
- [ ] Profile page (the user menu link points to `/profile`)
- [ ] Harden token storage (httpOnly cookie) before production
