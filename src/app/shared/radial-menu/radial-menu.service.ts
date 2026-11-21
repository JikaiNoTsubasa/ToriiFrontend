import { Injectable, signal } from '@angular/core';
import { RadialMenuAction, RadialMenuState } from './radial-menu.models';

/**
 * Pilote l'unique menu radial de l'app (monté une seule fois dans `app.html`).
 * Permet d'ouvrir un menu circulaire d'actions n'importe où : il suffit
 * d'appeler `open()` depuis un gestionnaire d'événement (souvent `contextmenu`).
 *
 * Exemple — clic droit sur une ligne de table pour proposer des actions :
 *   private readonly radial = inject(RadialMenuService);
 *
 *   onContextMenu(event: MouseEvent, task: Task): void {
 *     this.radial.open(event, [
 *       { label: 'Nouvelle tâche', icon: 'fas fa-plus', color: '#1f7a3d',
 *         run: () => this.create() },
 *       { label: 'Dupliquer', icon: 'fas fa-copy',
 *         run: () => this.duplicate(task) },
 *       { label: 'Supprimer', icon: 'fas fa-trash', color: '#b00020',
 *         run: () => this.remove(task) },
 *     ]);
 *   }
 *
 * Dans le template :
 *   <tr (contextmenu)="onContextMenu($event, task)"> … </tr>
 */
@Injectable({ providedIn: 'root' })
export class RadialMenuService {
  private readonly _state = signal<RadialMenuState | null>(null);

  /** État courant du menu (`null` quand il est fermé). */
  readonly state = this._state.asReadonly();

  /** Marge minimale (px) entre le centre du menu et le bord de l'écran. */
  private readonly edgeMargin = 130;

  /**
   * Ouvre le menu à l'emplacement du clic avec les actions fournies.
   * Empêche le menu contextuel natif du navigateur.
   */
  open(event: MouseEvent, actions: RadialMenuAction[]): void {
    event.preventDefault();
    event.stopPropagation();

    if (actions.length === 0) {
      return;
    }

    // On garde le centre du menu à l'écran même si le clic est près d'un bord.
    const x = this.clamp(event.clientX, window.innerWidth);
    const y = this.clamp(event.clientY, window.innerHeight);

    this._state.set({ x, y, actions });
  }

  /** Ferme le menu. */
  close(): void {
    this._state.set(null);
  }

  private clamp(value: number, size: number): number {
    return Math.min(Math.max(value, this.edgeMargin), size - this.edgeMargin);
  }
}
