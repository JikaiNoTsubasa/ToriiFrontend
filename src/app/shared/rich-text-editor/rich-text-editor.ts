import {
  Component,
  ElementRef,
  afterNextRender,
  effect,
  forwardRef,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
// Tiptap v3 : Placeholder (et History, Focus, etc.) vivent maintenant dans
// le package groupé @tiptap/extensions, en export nommé (pas de default export).
import { Placeholder } from '@tiptap/extensions';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';

import { SlashCommand } from './extensions/slash-command';
import { getSuggestionItems } from './extensions/suggestion-items';
import { renderSlashMenu } from './extensions/slash-menu.render';

const lowlight = createLowlight(common);

/**
 * Éditeur de texte riche réutilisable, façon Notion.
 *
 * Usage avec formControlName / ngModel :
 *   <app-rich-text-editor formControlName="description" placeholder="Décrivez le projet..." />
 *   <app-rich-text-editor [(ngModel)]="task.description" />
 *
 * Le contenu est stocké/restitué en HTML (editor.getHTML()).
 */
@Component({
  selector: 'app-rich-text-editor',
  templateUrl: './rich-text-editor.html',
  styleUrls: ['./rich-text-editor.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true,
    },
  ],
})
export class RichTextEditorComponent implements OnDestroy, ControlValueAccessor {
  private readonly editorRef = viewChild.required<ElementRef<HTMLDivElement>>('editorRef');

  /** Placeholder affiché quand le document est vide (lu à la création). */
  readonly placeholder = input("Écrivez '/' pour insérer un bloc...");

  /** Passe l'éditeur en lecture seule (ex: vue historique / audit log). */
  readonly editable = input(true);

  /** Émis à chaque changement de contenu, avec le HTML courant. */
  readonly contentChange = output<string>();

  /** Émis à la perte de focus, avec le HTML courant (pratique pour sauver). */
  readonly editorBlur = output<string>();

  editor?: Editor;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private pendingContent = '';
  private disabled = false;

  constructor() {
    // L'élément hôte de Tiptap n'existe qu'après le premier rendu.
    afterNextRender(() => this.createEditor());

    // Suit l'input `editable` (et l'état disabled du formulaire) une fois l'éditeur créé.
    effect(() => {
      const editable = this.editable();
      this.editor?.setEditable(editable && !this.disabled);
    });
  }

  private createEditor(): void {
    this.editor = new Editor({
      element: this.editorRef().nativeElement,
      editable: this.editable() && !this.disabled,
      extensions: [
        StarterKit.configure({
          // on désactive le codeBlock du StarterKit pour le remplacer
          // par la version avec coloration syntaxique (lowlight)
          codeBlock: false,
          // Link est inclus nativement dans StarterKit v3, on le configure ici
          // plutôt que d'importer un package séparé
          link: { openOnClick: false, autolink: true },
        }),
        CodeBlockLowlight.configure({ lowlight }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Placeholder.configure({ placeholder: this.placeholder() }),
        SlashCommand.configure({
          suggestion: {
            items: getSuggestionItems,
            render: renderSlashMenu,
          },
        }),
      ],
      content: this.pendingContent,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        this.onChange(html);
        this.contentChange.emit(html);
      },
      onBlur: ({ editor }) => {
        this.onTouched();
        this.editorBlur.emit(editor.getHTML());
      },
    });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  // --- ControlValueAccessor ---

  writeValue(value: string): void {
    this.pendingContent = value ?? '';
    if (this.editor && !this.editor.isDestroyed) {
      const isSame = this.editor.getHTML() === this.pendingContent;
      if (!isSame) {
        this.editor.commands.setContent(this.pendingContent, { emitUpdate: false });
      }
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.editor?.setEditable(this.editable() && !isDisabled);
  }
}
