# RichTextEditorComponent (Tiptap)

Reusable Notion-style rich text editor: `/` commands, code with syntax
highlighting, task lists, quotes, etc. Meant to be plugged into any "rich
content" field of Torii (descriptions, comments…).

## 1. Dependencies

Already declared in `package.json` (Tiptap v3):

```bash
npm install @tiptap/core @tiptap/starter-kit @tiptap/suggestion @tiptap/extensions @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-code-block-lowlight lowlight tippy.js
```

⚠️ **Tiptap v3** reorganized its packages: `Placeholder` now lives in
`@tiptap/extensions` (not `@tiptap/extension-placeholder`, now an internal
deprecated package), and `Link` ships with `StarterKit`.

If you still get `Cannot find module`:
1. Check that the install finished without errors (`npm install` sometimes
   prints a peer dependency resolution error in the middle of the logs).
2. Check what is actually in `node_modules/@tiptap/` (`ls node_modules/@tiptap/`):
   the package name must appear exactly (e.g. `extensions`, not
   `extension-placeholder`).
3. If a single module is missing after a clean install, reinstall it alone:
   `npm install @tiptap/extensions`.

## 2. Files

```
shared/rich-text-editor/
├── rich-text-editor.ts           # RichTextEditorComponent (signals + ControlValueAccessor)
├── rich-text-editor.html
├── rich-text-editor.scss
├── slash-menu.global.scss        # imported globally, see step 3
└── extensions/
    ├── slash-command.ts
    ├── suggestion-items.ts       # customize the command list here
    └── slash-menu.render.ts
```

## 3. Global menu styles

The command popup is positioned by `tippy.js` **outside** the Angular tree
(`appendTo: document.body`), so the component's style encapsulation
(`ViewEncapsulation.Emulated`) does not reach it. That is why
`slash-menu.global.scss` is loaded from `src/styles.scss`:

```scss
@use 'app/shared/rich-text-editor/slash-menu.global' as *;
```

- The path is **relative to `src/`**, not to the project root.
- `@import` is deprecated in Sass: use `@use`.

## 4. Usage

### With a form control (`formControlName` / `ngModel`)

The component implements `ControlValueAccessor`:

```html
<app-rich-text-editor
  formControlName="description"
  placeholder="Describe the project, its goals, its scope..."
/>
```

```html
<app-rich-text-editor
  [(ngModel)]="task.description"
  placeholder="Detail the task..."
  (contentChange)="onDescriptionChange($event)"
/>
```

```ts
import { RichTextEditorComponent } from '../../shared/rich-text-editor/rich-text-editor';

@Component({
  imports: [RichTextEditorComponent /* , ReactiveFormsModule or FormsModule */],
  // ...
})
```

### Read-only (details view, audit log, archived comment)

```html
<app-rich-text-editor [editable]="false" [ngModel]="task.description" />
```

### Inputs / outputs

| Name            | Kind   | Description                                         |
|-----------------|--------|-----------------------------------------------------|
| `placeholder`   | input  | Shown when the document is empty (read at creation) |
| `editable`      | input  | `false` switches to read-only (tracked live)        |
| `contentChange` | output | Current HTML on every change                        |
| `editorBlur`    | output | Current HTML on blur (handy for saving)             |

## 5. Storage

The component emits and receives **HTML** (`editor.getHTML()`). Store it as is
in PostgreSQL (`text` column, or `jsonb` if you also want to keep Tiptap's JSON
format through `editor.getJSON()` — useful for finer full-text search than on
raw HTML).

If you display this content anywhere other than through this component (PDF
export, notification email, etc.), sanitize the HTML on the backend before any
external use — Tiptap does not sanitize stored content for you.

## 6. Customizing the "/" commands

Everything happens in `extensions/suggestion-items.ts` — the `allCommandItems`
array. Each entry has a `title`, a `description`, a small inline SVG icon, and a
`command` function using Tiptap's chainable API (`editor.chain().focus()...run()`).

Possible additions:
- a "Mention" command for `@member` (requires `@tiptap/extension-mention`)
- a "Link to ticket" command inserting an internal `/tickets/:number` link
- a "Table" command through `@tiptap/extension-table`

## 7. Technical notes

- `StarterKit` already includes: paragraph, headings, bold/italic, lists,
  quote, inline code, undo/redo. Only its `codeBlock` is disabled, replaced by
  `CodeBlockLowlight` (syntax highlighting).
- `lowlight` with `common` loads a set of common languages (JS, TS, bash, JSON,
  CSS, HTML, Python, C#, etc.). If the final bundle gets too heavy, import only
  the languages you need — see the lowlight docs for selective imports.
- The Tiptap instance is created in `afterNextRender` (its host element only
  exists after the first render).
