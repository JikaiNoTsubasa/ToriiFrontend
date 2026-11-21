import { Extension } from '@tiptap/core';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';

export interface SlashCommandOptions {
  suggestion: Partial<SuggestionOptions>;
}

/**
 * Extension "/" façon Notion.
 * La logique d'affichage (items + render) est injectée via .configure()
 * depuis le composant qui monte l'éditeur — voir rich-text-editor.component.ts
 */
export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});