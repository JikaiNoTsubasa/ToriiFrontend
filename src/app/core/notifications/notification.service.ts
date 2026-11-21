import { Injectable, signal } from '@angular/core';

export type NotificationKind = 'error' | 'success' | 'info' | 'warning';

export interface Notification {
  id: number;
  kind: NotificationKind;
  title: string;
  detail?: string;
}

/**
 * File de notifications globales (toasts), pilotée par signal. Alimentée par
 * l'intercepteur d'erreurs pour les erreurs HTTP, mais utilisable partout
 * (`success`, `info`) pour un retour utilisateur cohérent.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _items = signal<Notification[]>([]);
  readonly items = this._items.asReadonly();

  private nextId = 1;

  /** Durée d'affichage (ms) avant disparition automatique. */
  private readonly autoDismissMs = 6000;

  error(title: string, detail?: string): void {
    this.push('error', title, detail);
  }

  success(title: string, detail?: string): void {
    this.push('success', title, detail);
  }

  info(title: string, detail?: string): void {
    this.push('info', title, detail);
  }

  warning(title: string, detail?: string): void {
    this.push('warning', title, detail);
  }

  dismiss(id: number): void {
    this._items.update((items) => items.filter((n) => n.id !== id));
  }

  clear(): void {
    this._items.set([]);
  }

  private push(kind: NotificationKind, title: string, detail?: string): void {
    const id = this.nextId++;
    this._items.update((items) => [...items, { id, kind, title, detail }]);
    setTimeout(() => this.dismiss(id), this.autoDismissMs);
  }
}
