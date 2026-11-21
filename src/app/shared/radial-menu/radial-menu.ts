import { Component, inject } from '@angular/core';
import { RadialMenuAction } from './radial-menu.models';
import { RadialMenuService } from './radial-menu.service';

/**
 * Menu radial global : à monter une seule fois (dans `app.html`). Il affiche,
 * quand le {@link RadialMenuService} le demande, une couronne de boutons ronds
 * autour du point cliqué. Les boutons apparaissent l'un après l'autre en
 * tournant autour du centre.
 *
 * Fermeture : clic à l'extérieur, bouton croix central, ou touche Échap.
 * L'ouverture se pilote via `RadialMenuService.open(event, actions)`.
 */
@Component({
  selector: 'app-radial-menu',
  templateUrl: './radial-menu.html',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class RadialMenu {
  private readonly service = inject(RadialMenuService);

  /** État courant (position + actions), `null` quand le menu est fermé. */
  protected readonly state = this.service.state;

  /** Rayon (px) du cercle sur lequel sont disposés les boutons. */
  protected readonly radius = 70; // 92;

  /** Angle (deg) du bouton d'index `index` parmi `count` boutons. */
  protected angle(index: number, count: number): number {
    return (360 / count) * index;
  }

  /** Exécute l'action puis ferme le menu. */
  protected trigger(action: RadialMenuAction): void {
    if (action.disabled) {
      return;
    }
    this.service.close();
    action.run();
  }

  /** Ferme le menu sans rien exécuter. */
  protected close(): void {
    this.service.close();
  }

  protected onEscape(): void {
    this.close();
  }
}
