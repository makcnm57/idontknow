/**
 * Ellipse inscrite dans la boîte glissée, pleine ou en contour. Maj : cercle.
 */
import { boxFromDrag } from '../shapes/shape-geometry';
import { createDragShapeTool } from './drag-shape';

export const ellipseTool = createDragShapeTool({
  id: 'ellipse',
  build: (id, start, current, constrain, ctx) => ({
    id,
    kind: 'ellipse',
    ...boxFromDrag(start, current, constrain),
    fill: ctx.state.fill,
    color: ctx.state.color,
    size: ctx.state.size,
  }),
});
