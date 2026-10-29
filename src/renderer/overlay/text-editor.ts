/**
 * Zone de saisie de texte posée sur l'overlay (outil Texte).
 *
 * Entrée valide, Maj+Entrée passe à la ligne, Échap ou la perte du focus valident aussi.
 * Le texte validé devient une forme `text` dessinée sur le canvas ; un texte vide est abandonné.
 */
import { TEXT_FONT_FAMILY, TEXT_LINE_HEIGHT, textFontSize } from '@shared/palette';
import type { DrawState, Point, TextShape } from '@shared/types';
import type { ToolContext } from './tools/tool';

export class TextEditor {
  private element: HTMLDivElement | null = null;
  private ctx: ToolContext | null = null;
  private fontSize = 20;
  private color = '#ff3b30';

  get isOpen(): boolean {
    return this.element !== null;
  }

  /** Ouvre la saisie : le point cliqué se trouve au milieu de la première ligne. */
  open(at: Point, ctx: ToolContext): void {
    this.commit();
    this.ctx = ctx;
    const element = document.createElement('div');
    element.className = 'text-editor';
    element.contentEditable = 'plaintext-only';
    element.spellcheck = false;
    element.style.fontFamily = TEXT_FONT_FAMILY;
    element.style.lineHeight = String(TEXT_LINE_HEIGHT);
    this.element = element;
    this.applyStyle(ctx.state);
    element.style.left = `${at.x}px`;
    element.style.top = `${at.y - (this.fontSize * TEXT_LINE_HEIGHT) / 2}px`;

    element.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' && !e.shiftKey) || e.key === 'Escape') {
        // Échap valide le texte au lieu de quitter le mode dessin.
        e.preventDefault();
        e.stopPropagation();
        this.commit();
      }
    });
    element.addEventListener('blur', () => this.commit());

    document.body.append(element);
    element.focus();
  }

  /** Suit la couleur et la taille courantes, y compris pendant la saisie (molette). */
  applyStyle(state: DrawState): void {
    if (!this.element) return;
    this.fontSize = textFontSize(state.size);
    this.color = state.color;
    this.element.style.fontSize = `${this.fontSize}px`;
    this.element.style.color = this.color;
  }

  /** Valide la saisie en cours (sans effet si aucune n'est ouverte). */
  commit(): void {
    const element = this.element;
    const ctx = this.ctx;
    if (!element || !ctx) return;
    // Remis à zéro avant `remove()`, qui déclenche `blur` et donc un nouvel appel.
    this.element = null;
    this.ctx = null;

    // `innerText` peut ajouter un saut de ligne final : on l'ignore.
    const text = element.innerText.replace(/\n$/, '');
    const box = element.getBoundingClientRect();
    element.remove();
    if (text.trim() === '') return;

    const shape: TextShape = {
      id: crypto.randomUUID(),
      kind: 'text',
      text,
      x: box.left,
      y: box.top,
      width: box.width,
      height: box.height,
      fontSize: this.fontSize,
      color: this.color,
    };
    ctx.commitShapes([...ctx.getShapes(), shape]);
  }
}
