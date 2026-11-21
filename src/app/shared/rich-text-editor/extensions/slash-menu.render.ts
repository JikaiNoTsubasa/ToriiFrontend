import tippy, { GetReferenceClientRect, Instance as TippyInstance } from 'tippy.js';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import { CommandItem } from './suggestion-items';

/**
 * Classe DOM "vanilla" pour la liste de commandes.
 * On reste en DOM natif ici (plutôt que de monter un vrai composant Angular)
 * car le popup est rendu par tippy en dehors de l'arbre de vues Angular
 * (appendTo: document.body) — c'est l'approche recommandée par Tiptap.
 */
class CommandList {
  readonly dom: HTMLDivElement;
  private items: CommandItem[] = [];
  private selectedIndex = 0;

  constructor(private readonly onSelect: (item: CommandItem) => void) {
    this.dom = document.createElement('div');
    this.dom.className = 'slash-menu';
  }

  updateItems(items: CommandItem[]): void {
    this.items = items;
    this.selectedIndex = 0;
    this.render();
  }

  onKeyDown({ event }: { event: KeyboardEvent }): boolean {
    if (event.key === 'ArrowUp') {
      this.selectedIndex = (this.selectedIndex + this.items.length - 1) % this.items.length;
      this.render();
      return true;
    }
    if (event.key === 'ArrowDown') {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
      this.render();
      return true;
    }
    if (event.key === 'Enter') {
      const item = this.items[this.selectedIndex];
      if (item) this.onSelect(item);
      return true;
    }
    return false;
  }

  private render(): void {
    this.dom.innerHTML = '';

    if (this.items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'slash-menu__empty';
      empty.textContent = 'Aucun résultat';
      this.dom.appendChild(empty);
      return;
    }

    this.items.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slash-menu__item' + (index === this.selectedIndex ? ' is-selected' : '');
      button.innerHTML = `
        <span class="slash-menu__icon">${item.icon}</span>
        <span class="slash-menu__text">
          <span class="slash-menu__title">${item.title}</span>
          <span class="slash-menu__desc">${item.description}</span>
        </span>
      `;
      // mousedown (pas click) pour éviter que l'éditeur perde le focus avant le clic
      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
        this.onSelect(item);
      });
      this.dom.appendChild(button);
    });
  }
}

/**
 * Fonction "render" attendue par l'extension Suggestion de Tiptap.
 * Typée avec SuggestionProps<CommandItem> / SuggestionKeyDownProps (types
 * réels exportés par @tiptap/suggestion en v3) plutôt que des types maison,
 * pour rester compatible avec la signature attendue par SuggestionOptions.render.
 */
export function renderSlashMenu() {
  let popup: TippyInstance[];
  let list: CommandList;

  return {
    onStart: (props: SuggestionProps<CommandItem>) => {
      list = new CommandList((item) => {
        item.command({ editor: props.editor, range: props.range });
      });
      list.updateItems(props.items);

      if (!props.clientRect) return;

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect as GetReferenceClientRect,
        appendTo: () => document.body,
        content: list.dom,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        offset: [0, 4],
        arrow: false,
      });
    },

    onUpdate: (props: SuggestionProps<CommandItem>) => {
      list.updateItems(props.items);
      if (!props.clientRect) return;
      popup[0].setProps({ getReferenceClientRect: props.clientRect as GetReferenceClientRect });
    },

    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (props.event.key === 'Escape') {
        popup[0].hide();
        return true;
      }
      return list.onKeyDown(props);
    },

    onExit: () => {
      popup[0]?.destroy();
    },
  };
}