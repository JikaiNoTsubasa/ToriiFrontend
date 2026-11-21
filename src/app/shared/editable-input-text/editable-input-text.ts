import {
  Component,
  ElementRef,
  effect,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';

/**
 * Texte éditable « inline » : affiché normalement, il devient un champ de
 * saisie au clic, puis redevient un simple texte une fois validé.
 *
 * Validation : Entrée ou perte de focus. Annulation : Échap.
 *
 * Usage standalone (two-way binding + événement de sauvegarde) :
 *   <app-editable-input-text [(value)]="task.title" (save)="rename($event)" />
 */
@Component({
  selector: 'app-editable-input-text',
  templateUrl: './editable-input-text.html',
})
export class EditableInputText {
  /** Valeur courante, liable en two-way : [(value)]. */
  readonly value = model.required<string>();

  /** Texte grisé affiché quand la valeur est vide. */
  readonly placeholder = input('');

  /** Émis avec le texte modifié à chaque validation. */
  readonly save = output<string>();

  /** Vrai tant que l'utilisateur édite le champ. */
  protected readonly editing = signal(false);

  /** Brouillon en cours d'édition, isolé de la valeur tant que non validé. */
  protected readonly draft = signal('');

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  constructor() {
    // Dès que le champ apparaît, on lui donne le focus et on sélectionne
    // le texte pour permettre un remplacement immédiat.
    effect(() => {
      if (this.editing()) {
        this.inputRef()?.nativeElement.select();
      }
    });
  }

  /** Passe en mode édition en amorçant le brouillon avec la valeur courante. */
  protected startEdit(): void {
    this.draft.set(this.value());
    this.editing.set(true);
  }

  /** Valide le brouillon : met à jour la valeur, émet `save`, quitte l'édition. */
  protected commit(): void {
    if (!this.editing()) {
      return;
    }
    const next = this.draft().trim();
    this.editing.set(false);
    if (next !== this.value()) {
      this.value.set(next);
      this.save.emit(next);
    }
  }

  /** Annule l'édition sans modifier la valeur. */
  protected cancel(): void {
    this.editing.set(false);
  }
}
