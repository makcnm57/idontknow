/**
 * Ligne droite. Maj : angle arrondi à 45°.
 */
import { constrainLine } from '../shapes/shape-geometry';
import { createDragShapeTool } from './drag-shape';

export const lineTool = createDragShapeTool({
  id: 'line',
  build: (id, from, current, constrain, ctx) => ({
    id,
    kind: 'line',
    from,
    to: constrain ? constrainLine(from, current) : current,
    arrow: false,
    color: ctx.state.color,
    size: ctx.state.size,
  }),
});
