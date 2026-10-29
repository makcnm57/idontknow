/**
 * Entrées pointeur (souris, tactile, stylet) : transmet les événements à l'outil actif.
 */
import type { Tool, ToolContext } from './tools/tool';

/**
 * Branche les Pointer Events sur `target`.
 * Un seul pointeur est suivi à la fois ; l'outil est figé au début du geste.
 */
export function attachPointerInput(
  target: HTMLElement,
  getTool: () => Tool | undefined,
  ctx: ToolContext,
): void {
  let activePointer: number | null = null;
  let activeTool: Tool | undefined;

  target.addEventListener('pointerdown', (e) => {
    // Souris : bouton gauche uniquement. Stylet et tactile : contact principal.
    if (activePointer !== null || e.button !== 0) return;
    activeTool = getTool();
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
