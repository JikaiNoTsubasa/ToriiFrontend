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
// Tiptap v3: Placeholder (and History, Focus, etc.) now live in
// the bundled @tiptap/extensions package, as named exports (no default export).
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
 * Reusable Notion-style rich text editor.
 *
 * Usage with formControlName / ngModel:
 *   <app-rich-text-editor formControlName="description" placeholder="Describe the project..." />
 *   <app-rich-text-editor [(ngModel)]="task.description" />
 *
 * The content is stored/restored as HTML (editor.getHTML()).
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

  /** Placeholder shown when the document is empty (read at creation). */
  readonly placeholder = input("Type '/' to insert a block...");

  /** Switches the editor to read-only (e.g. history view / audit log). */
  readonly editable = input(true);

  /** Minimum height of the writing area (CSS length, e.g. `'24rem'`); default 120px. */
  readonly minHeight = input<string | null>(null);

  /** Emitted on every content change, with the current HTML. */
  readonly contentChange = output<string>();

  /** Emitted on blur, with the current HTML (handy for saving). */
  readonly editorBlur = output<string>();

  editor?: Editor;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private pendingContent = '';
  private disabled = false;

  constructor() {
    // Tiptap's host element only exists after the first render.
    afterNextRender(() => this.createEditor());

    // Tracks the `editable` input (and the form's disabled state) once the editor exists.
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
          // disable StarterKit's codeBlock to replace it
          // with the syntax-highlighted version (lowlight)
          codeBlock: false,
          // Link ships with StarterKit v3, so configure it here
          // rather than importing a separate package
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
