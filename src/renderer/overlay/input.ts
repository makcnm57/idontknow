/**
 * Entrées pointeur (souris, tactile, stylet) : transmet les événements à l'outil actif.
 */
import type { Tool, ToolContext } from './tools/tool';

/** Bouton « gomme » d'un stylet (bout arrière), selon la spécification Pointer Events. */
export const PEN_ERASER_BUTTON = 5;

/**
 * Branche les Pointer Events sur `target`.
 * Un seul pointeur est suivi à la fois ; l'outil est choisi au début du geste
 * (`pickTool` reçoit l'événement pour détecter le bout gomme du stylet).
 */
export function attachPointerInput(
  target: HTMLElement,
  pickTool: (e: PointerEvent) => Tool | undefined,
  ctx: ToolContext,
): void {
  let activePointer: number | null = null;
  let activeTool: Tool | undefined;

  target.addEventListener('pointerdown', (e) => {
    // Bouton principal (souris gauche, pointe du stylet, doigt) ou bout gomme du stylet.
    if (activePointer !== null || (e.button !== 0 && e.button !== PEN_ERASER_BUTTON)) return;
    activeTool = pickTool(e);
    if (!activeTool) return;
    activePointer = e.pointerId;
    target.setPointerCapture(e.pointerId);
    activeTool.onPointerDown(e, ctx);
  });

  target.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activePointer || !activeTool) return;
    // Les événements regroupés par le navigateur entre deux images : aucun point perdu
    // avec un stylet rapide.
    const events = e.getCoalescedEvents();
    for (const event of events.length > 0 ? events : [e]) activeTool.onPointerMove(event, ctx);
  });

  const end = (e: PointerEvent): void => {
    if (e.pointerId !== activePointer || !activeTool) return;
    activeTool.onPointerUp(e, ctx);
    activePointer = null;
    activeTool = undefined;
  };
  target.addEventListener('pointerup', end);
  target.addEventListener('pointercancel', end);
}
