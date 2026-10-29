/**
 * Flèche : ligne avec une pointe à l'arrivée. Maj : angle arrondi à 45°.
 */
import { constrainLine } from '../shapes/shape-geometry';
import { createDragShapeTool } from './drag-shape';

export const arrowTool = createDragShapeTool({
  id: 'arrow',
  build: (id, from, current, constrain, ctx) => ({
    id,
    kind: 'line',
    from,
    to: constrain ? constrainLine(from, current) : current,
    arrow: true,
    color: ctx.state.color,
    size: ctx.state.size,
  }),
});
