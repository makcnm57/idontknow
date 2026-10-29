/**
 * Rectangle, plein ou en contour selon le réglage courant. Maj : carré.
 */
import { boxFromDrag } from '../shapes/shape-geometry';
import { createDragShapeTool } from './drag-shape';

export const rectTool = createDragShapeTool({
  id: 'rect',
  build: (id, start, current, constrain, ctx) => ({
    id,
    kind: 'rect',
    ...boxFromDrag(start, current, constrain),
    fill: ctx.state.fill,
    color: ctx.state.color,
    size: ctx.state.size,
  }),
});
