/**
 * Registre des outils. Les outils pas encore implémentés n'y figurent pas :
 * les interactions sont alors simplement ignorées.
 */
import type { ToolId } from '@shared/types';
import { eraserTool } from './eraser';
import { highlighterTool } from './highlighter';
import { penTool } from './pen';
import type { Tool } from './tool';

const tools: Partial<Record<ToolId, Tool>> = {};
for (const tool of [penTool, highlighterTool, eraserTool]) tools[tool.id] = tool;

export function getTool(id: ToolId): Tool | undefined {
  return tools[id];
}
