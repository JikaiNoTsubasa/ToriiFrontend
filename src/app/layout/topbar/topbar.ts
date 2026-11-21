import { Component, input } from '@angular/core';

/**
 * Barre supérieure optionnelle, à inclure par les pages qui en ont besoin.
 * Elle est « sticky » : elle reste épinglée en haut de la zone de contenu
 * pendant que le reste de la page défile.
 *
 * Le titre est fourni via l'input `title`, et un espace d'actions à droite
 * est projeté via `<ng-content>`.
 */
@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.html',
})
export class Topbar {
  readonly heading = input<string>('');
}
