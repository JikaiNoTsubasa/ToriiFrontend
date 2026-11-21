/**
 * Une action affichée sous forme de bouton rond dans le menu radial.
 * Chaque action est entièrement personnalisable (icône, couleur, libellé)
 * selon l'endroit de l'app où le menu est ouvert.
 */
export interface RadialMenuAction {
  /** Libellé affiché dans le tooltip au survol. */
  label: string;

  /** Classe(s) d'icône FontAwesome, ex. `'fas fa-plus'`. */
  icon: string;

  /** Callback déclenché au clic. Le menu se ferme juste après. */
  run: () => void;

  /**
   * Couleur d'accent (fond du bouton). Toute valeur CSS valide.
   * Défaut : la couleur primaire de l'app.
   */
  color?: string;
  bg?: string;

  /** Désactive le bouton (grisé, non cliquable) si vrai. */
  disabled?: boolean;
}

/** État interne du menu radial : sa position à l'écran et ses actions. */
export interface RadialMenuState {
  /** Position horizontale du centre du menu (px, repère viewport). */
  x: number;

  /** Position verticale du centre du menu (px, repère viewport). */
  y: number;

  /** Boutons à disposer en cercle autour du centre. */
  actions: RadialMenuAction[];
}
