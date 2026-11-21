import { Injectable, signal } from '@angular/core';

export type NotificationKind = 'error' | 'success' | 'info' | 'warning';

/** Optional action link of a toast (router navigation). */
export interface NotificationLink {
  label: string;
  commands: readonly unknown[];
  queryParams?: Record<string, string | number>;
}

export interface Notification {
  id: number;
  kind: NotificationKind;
  title: string;
  detail?: string;
  link?: NotificationLink;
}

/**
 * Signal-driven queue of global notifications (toasts). Fed by the error
 * interceptor for HTTP errors, but usable anywhere (`success`, `info`)
 * for consistent user feedback.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _items = signal<Notification[]>([]);
  readonly items = this._items.asReadonly();

  private nextId = 1;

  /** Display duration (ms) before automatic dismissal. */
  private readonly autoDismissMs = 6000;

  error(title: string, detail?: string): void {
    this.push('error', title, detail);
  }

  success(title: string, detail?: string): void {
    this.push('success', title, detail);
  }

  info(title: string, detail?: string, link?: NotificationLink): void {
    this.push('info', title, detail, link);
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

  private push(kind: NotificationKind, title: string, detail?: string, link?: NotificationLink): void {
    const id = this.nextId++;
    this._items.update((items) => [...items, { id, kind, title, detail, link }]);
    setTimeout(() => this.dismiss(id), this.autoDismissMs);
  }
}
