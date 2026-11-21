# RichTextEditorComponent (Tiptap) — pour Torii

Éditeur de texte riche réutilisable façon Notion : commandes `/`, code avec
coloration syntaxique, listes de tâches, citations, etc. Prévu pour être
branché sur `project.description`, `task.description`, ou tout autre champ
"contenu riche" de Torii.

## 1. Installation

⚠️ **Tiptap v3** (version installée par défaut aujourd'hui) a réorganisé ses
packages : `Placeholder` vit maintenant dans `@tiptap/extensions` (pas
`@tiptap/extension-placeholder`, devenu un package interne "deprecated"),
et `Link` est inclus nativement dans `StarterKit`. Utilise cette commande,
testée avec Tiptap 3.27.3 :

```bash
npm install @tiptap/core @tiptap/starter-kit @tiptap/suggestion @tiptap/extensions @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-code-block-lowlight lowlight tippy.js
```

Si tu obtiens quand même `Cannot find module` après cette commande :
1. Vérifie que l'install s'est bien terminée sans erreur (`npm install`
   affiche parfois une erreur de résolution de peer dependency au milieu
   des logs, facile à rater).
2. Vérifie le contenu réel de `node_modules/@tiptap/` :
   ```bash
   ls node_modules/@tiptap/
   ```
   Le nom du package doit apparaître exactement (ex: `extensions`, pas
   `extension-placeholder`).
3. Si un seul module manque après une install propre, réinstalle-le seul :
   `npm install @tiptap/extensions`.

## 2. Fichiers à copier dans le projet

```
shared/rich-text-editor/
├── rich-text-editor.component.ts
├── rich-text-editor.component.html
├── rich-text-editor.component.scss
├── slash-menu.global.scss        <-- à importer globalement, voir étape 3
└── extensions/
    ├── slash-command.ts
    ├── suggestion-items.ts        <-- personnalise ici la liste des commandes
    └── slash-menu.render.ts
```

## 3. Import du style global du menu (étape importante)

Le popup de commandes est positionné par `tippy.js` **en dehors** de
l'arbre Angular (`appendTo: document.body`), donc l'encapsulation de style
du composant (`ViewEncapsulation.Emulated`) ne l'atteint pas.

Ajoute dans `styles.scss` (racine du projet, généralement `src/styles.scss`).

⚠️ Deux pièges fréquents :
- **Le chemin est relatif à `src/`**, pas à la racine du projet. Si le
  fichier est dans `src/app/shared/rich-text-editor/`, il faut écrire
  `app/shared/rich-text-editor/...` (le segment `app/` est facile à
  oublier).
- **`@import` est déprécié en Sass** (sera supprimé de Dart Sass), on
  utilise `@use` à la place :

```scss
@use 'app/shared/rich-text-editor/slash-menu.global' as *;
```

**Alternative plus robuste** (évite de recalculer le chemin relatif à
chaque déplacement de fichier) : ajoute le dossier dans les
`includePaths` de `angular.json`, puis importe sans chemin relatif :

```json
"stylePreprocessorOptions": {
  "includePaths": ["src"]
}
```

(dans `architect.build.options` de `angular.json`), ce qui permet ensuite
d'écrire simplement, où que soit `styles.scss` :

```scss
@use 'app/shared/rich-text-editor/slash-menu.global' as *;
```

Ou encore plus simple : copie tout le contenu de
`slash-menu.global.scss` directement dans `styles.scss` si tu ne veux pas
te embêter avec les chemins d'import pour un seul petit fichier.

## 4. Usage

### Avec Reactive Forms

```html
<form [formGroup]="projectForm">
  <label>Description du projet</label>
  <app-rich-text-editor
    formControlName="description"
    placeholder="Décrivez le projet, ses objectifs, son périmètre..."
  />
</form>
```

```typescript
import { RichTextEditorComponent } from 'shared/rich-text-editor/rich-text-editor.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RichTextEditorComponent],
  // ...
})
export class ProjectFormComponent {
  projectForm = this.fb.group({
    name: [''],
    description: [''], // stocké en HTML
  });
}
```

### Avec ngModel (ex: description de tâche dans une modale)

```html
<app-rich-text-editor
  [(ngModel)]="task.description"
  placeholder="Détaillez la tâche..."
  (contentChange)="onDescriptionChange($event)"
/>
```

### En lecture seule (ex: vue détail, audit log, commentaire archivé)

```html
<app-rich-text-editor [editable]="false" [ngModel]="task.description" />
```

## 5. Stockage

Le composant émet et reçoit du **HTML** (`editor.getHTML()`). Pour Torii,
stocke ce HTML tel quel dans PostgreSQL (colonne `text` ou `jsonb` si tu
préfères garder aussi le format JSON de Tiptap via `editor.getJSON()` —
utile si tu veux un jour faire de la recherche full-text plus fine que sur
du HTML brut).

Si tu affiches ce contenu ailleurs qu'via ce composant (export PDF, email de
notification, etc.), pense à sanitizer le HTML côté backend avant tout envoi
externe — Tiptap ne fait pas cette sanitization pour toi côté stockage.

## 6. Personnaliser les commandes du menu "/"

Tout se passe dans `extensions/suggestion-items.ts` — le tableau
`allCommandItems`. Chaque entrée a un `title`, une `description`, une petite
icône SVG inline, et une fonction `command` qui utilise l'API chainable de
Tiptap (`editor.chain().focus()...run()`).

Exemples d'ajouts possibles pour Torii :
- une commande "Mention" pour `@membre` (nécessite `@tiptap/extension-mention`)
- une commande "Lien vers tâche" qui insère un lien interne `/tasks/:id`
- une commande "Tableau" via `@tiptap/extension-table`

## 7. Notes techniques

- `StarterKit` inclut déjà : paragraphe, titres, gras/italique, listes,
  citation, code inline, undo/redo. On désactive juste son `codeBlock` pour
  le remplacer par `CodeBlockLowlight` (coloration syntaxique).
- `lowlight` avec `common` charge un jeu de langages courants (JS, TS,
  bash, JSON, CSS, HTML, Python, C#, etc.). Si le bundle final est trop
  lourd, tu peux importer seulement les langages dont tu as besoin — voir
  la doc lowlight pour l'import sélectif.
- Le composant est 100% standalone (pas besoin de NgModule).