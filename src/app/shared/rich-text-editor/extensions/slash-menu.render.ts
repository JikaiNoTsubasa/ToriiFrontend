import tippy, { GetReferenceClientRect, Instance as TippyInstance } from 'tippy.js';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import { CommandItem } from './suggestion-items';

/**
 * "Vanilla" DOM class for the command list.
 * We stick to the native DOM here (rather than mounting a real Angular component)
 * because the popup is rendered by tippy outside the Angular view tree
 * (appendTo: document.body) — this is the approach recommended by Tiptap.
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
      empty.textContent = 'No results';
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
      // mousedown (not click) so the editor does not lose focus before the click
      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
        this.onSelect(item);
      });
      this.dom.appendChild(button);
    });
  }
}

/**
 * "render" function expected by Tiptap's Suggestion extension.
 * Typed with SuggestionProps<CommandItem> / SuggestionKeyDownProps (the actual
 * types exported by @tiptap/suggestion in v3) rather than custom types,
 * to stay compatible with the signature expected by SuggestionOptions.render.
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