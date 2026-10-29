/**
 * Registre des outils. Les outils pas encore implémentés n'y figurent pas :
 * les interactions sont alors simplement ignorées.
 */
import type { ToolId } from '@shared/types';
import { arrowTool } from './arrow';
import { badgeTool } from './badge';
import { ellipseTool } from './ellipse';
import { eraserTool } from './eraser';
import { highlighterTool } from './highlighter';
import { laserTool } from './laser';
import { lineTool } from './line';
import { penTool } from './pen';
import { rectTool } from './rect';
import { selectTool } from './select';
import { textTool } from './text';
import type { Tool } from './tool';

const tools: Partial<Record<ToolId, Tool>> = {};
const ALL_TOOLS = [
  selectTool,
  penTool,
  highlighterTool,
  eraserTool,
  lineTool,
  arrowTool,
  rectTool,
  ellipseTool,
  textTool,
  badgeTool,
  laserTool,
];
for (const tool of ALL_TOOLS) tools[tool.id] = tool;

export function getTool(id: ToolId): Tool | undefined {
  return tools[id];
}
