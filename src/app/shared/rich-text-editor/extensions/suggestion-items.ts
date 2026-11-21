import { Editor, Range } from '@tiptap/core';

export interface CommandItem {
  title: string;
  description: string;
  icon: string;
  command: (props: { editor: Editor; range: Range }) => void;
}

/** Petit helper pour définir une icône SVG inline (24x24, stroke currentColor). */
function icon(path: string): string {
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

/**
 * Liste complète des commandes disponibles via "/".
 * Ajoute ou retire des entrées ici pour customiser le menu.
 */
export const allCommandItems: CommandItem[] = [
  {
    title: 'Texte',
    description: 'Paragraphe simple',
    icon: icon('<path d="M4 6h16M4 12h10M4 18h7"/>'),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: 'Titre 1',
    description: 'Grand titre de section',
    icon: icon('<path d="M6 4v16M18 4v16M6 12h12"/>'),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: 'Titre 2',
    description: 'Titre de sous-section',
    icon: icon('<path d="M6 4v16M14 4v10M6 11h8"/>'),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: 'Titre 3',
    description: 'Petit titre',
    icon: icon('<path d="M6 5v14M12 5v8M6 9h6"/>'),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: 'Liste à puces',
    description: 'Liste simple non ordonnée',
    icon: icon('<circle cx="5" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="5" cy="18" r="1.2" fill="currentColor" stroke="none"/><path d="M9 6h11M9 12h11M9 18h11"/>'),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Liste numérotée',
    description: 'Liste ordonnée 1, 2, 3...',
    icon: icon('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h1v3M4 6l-1 1M4 13h1.5a1 1 0 000-2H4"/>'),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Liste de tâches',
    description: 'Checklist avec cases à cocher',
    icon: icon('<rect x="4" y="4" width="6" height="6" rx="1"/><path d="M5.5 7l1 1 2-2"/><path d="M13 7h7M13 17h7"/><rect x="4" y="14" width="6" height="6" rx="1"/>'),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Citation',
    description: 'Bloc de citation en retrait',
    icon: icon('<path d="M7 8c-2 0-3 1.5-3 3.5S5 15 7 15M7 8v7M17 8c-2 0-3 1.5-3 3.5s1 3.5 3 3.5M17 8v7"/>'),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Bloc de code',
    description: 'Code avec coloration syntaxique',
    icon: icon('<path d="M8 7l-4 5 4 5M16 7l4 5-4 5"/>'),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Séparateur',
    description: 'Ligne de séparation horizontale',
    icon: icon('<path d="M4 12h16"/>'),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

/** Fonction "items" attendue par l'extension Suggestion de Tiptap. */
export function getSuggestionItems({ query }: { query: string }): CommandItem[] {
  return allCommandItems
    .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10);
}