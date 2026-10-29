/**
 * Texte : un clic ouvre une zone de saisie à cet endroit. Cliquer ailleurs pendant
 * la saisie la valide sans en ouvrir une nouvelle.
 */
import { TextEditor } from '../text-editor';
import type { Tool } from './tool';

/** Zone de saisie de l'overlay, partagée avec `main.ts` (style courant, validation). */
export const textEditor = new TextEditor();

let wasEditing = false;

export const textTool: Tool = {
  id: 'text',
  cursor: 'text',

  onPointerDown() {
    wasEditing = textEditor.isOpen;
    textEditor.commit();
  },

  onPointerMove() {
    /* rien : le texte se place au relâchement */
  },

  // On ouvre au relâchement : à l'appui, le navigateur retire ensuite le focus
  // de la zone de saisie qu'on viendrait de créer.
  onPointerUp(e, ctx) {
    if (!wasEditing) textEditor.open({ x: e.clientX, y: e.clientY }, ctx);
  },
};
