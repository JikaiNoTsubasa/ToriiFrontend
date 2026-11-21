# ⛩️ ToriiFrontend

Frontend de Torii, outil web de gestion de projet. « Torii » comme les portails
japonais : la porte d'entrée de vos projets.

L'API .NET vit dans le repo séparé **ToriiBackend**.

## Stack

- **Angular 22** (standalone, zoneless, `OnPush` par défaut), SCSS, TypeScript 6
- **Signals partout** : état (`signal`/`computed`), `input()`/`output()`/`model()`,
  `viewChild()`, formulaires signals (`@angular/forms/signals`). Pas de décorateurs
  `@Input`/`@Output`/`@ViewChild`/`@HostListener` (utiliser `host: {}`).
- Éditeur rich-text **Tiptap** (`@tiptap/core`)
- Tests : **Vitest** (`ng test`)
- Icônes : Font Awesome (kit chargé dans `src/index.html`)

## Prérequis

- **Node.js** + **npm**
- **Angular CLI 22** (`npm i -g @angular/cli` ou via `npx`)
- L'API ToriiBackend lancée sur `http://localhost:5080`

## Démarrage

```bash
npm install
npm start          # http://localhost:4200
```

L'URL de l'API se configure dans `src/environments/environment.ts`
(`apiUrl`, par défaut `http://localhost:5080/api`). En production,
`environment.production.ts` est utilisé (`/api`).

VS Code : **Run and Debug → « ng serve »**.

## Authentification

Côté `src/app/core/` :

- `auth/auth.service.ts` — login / register / refresh / logout, état `user` (signal).
- `auth/token-storage.service.ts` — stockage des tokens (localStorage).
- `interceptors/auth.interceptor.ts` — ajoute `Authorization: Bearer`, tente un
  refresh automatique sur 401 (dédupliqué), sinon redirige vers `/login`.
- `interceptors/error.interceptor.ts` — normalise les erreurs au format
  ProblemDetails et affiche un toast (désactivable via `skipErrorNotification()`).
- `guards/auth.guard.ts` — protège les routes authentifiées.

Au démarrage (`app.config.ts`), l'utilisateur est réhydraté via `/api/auth/me`
si un token est présent.

## Enums

L'API échange les enums en **chaîne MAJUSCULE** (`"ON_GOING"`), comme en base ;
les entiers sont refusés. Côté front, un enum est une union de chaînes, déclarée
avec `core/http/api-enum.ts` en miroir de l'enum C# :

```ts
export const TASK_STATUSES = apiEnum('NEW', 'ON_GOING', 'COMPLETED');
export type TaskStatus = ApiEnumValue<typeof TASK_STATUSES>;

const LABELS: ApiEnumMap<TaskStatus, string> = { NEW: 'Nouvelle', ON_GOING: 'En cours', COMPLETED: 'Terminée' };
parseApiEnum(TASK_STATUSES, route.queryParamMap.get('status')); // 'ON_GOING' | … | null
```

## Design

Tous les styles sont centralisés dans `src/styles.scss` (variables en tête de
fichier : couleur primaire `#bc002d`, panneaux carrés, police Inter). Classes
disponibles : `.panel`, `.btn` / `.btn--ghost`, `.field`, `.alert`, `.badge--*`,
`.tabs`, `.table`, `.link`, plus la coquille `.layout` / `.sidebar` / `.content` /
`.page` / `.topbar`.

## Structure

```
src/app/
├── core/          # auth, interceptors, guard, notifications, clipboard, problem-details
├── features/      # auth/login, home
├── layout/        # shell (sidebar + contenu), topbar
└── shared/        # notifications (toasts), radial-menu (clic droit),
                   # editable-input-text, rich-text-editor (Tiptap + slash commands)
```

## Ajouter une fonctionnalité

1. Créer la feature sous `src/app/features/<nom>/`.
2. L'ajouter en lazy route enfant du `Shell` dans `app.routes.ts` (protégée par `authGuard`).
3. Ajouter l'entrée de menu dans `layout/shell/shell.ts` (`nav`).

## Build

```bash
npm run build      # sortie dans dist/torii-web
npm test
```

## À faire

- [ ] Fonctionnalités métier
- [ ] Page d'inscription (l'endpoint `register` existe déjà)
- [ ] Page profil (le lien du menu utilisateur pointe vers `/profile`)
- [ ] Durcir le stockage des tokens (cookie httpOnly) avant prod
