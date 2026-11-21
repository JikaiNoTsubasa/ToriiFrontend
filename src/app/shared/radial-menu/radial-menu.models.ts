/**
 * An action shown as a round button in the radial menu.
 * Each action is fully customizable (icon, color, label)
 * depending on where in the app the menu is opened.
 */
export interface RadialMenuAction {
  /** Label shown in the tooltip on hover. */
  label: string;

  /** FontAwesome icon class(es), e.g. `'fas fa-plus'`. */
  icon: string;

  /** Callback fired on click. The menu closes right after. */
  run: () => void;

  /**
   * Accent color (button background). Any valid CSS value.
   * Default: the app's primary color.
   */
  color?: string;
  bg?: string;

  /** Disables the button (greyed out, not clickable) when true. */
  disabled?: boolean;
}

/** Internal state of the radial menu: its screen position and its actions. */
export interface RadialMenuState {
  /** Horizontal position of the menu center (px, viewport coordinates). */
  x: number;

  /** Vertical position of the menu center (px, viewport coordinates). */
  y: number;

  /** Buttons to lay out in a circle around the center. */
  actions: RadialMenuAction[];
}
