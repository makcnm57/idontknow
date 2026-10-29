/**
 * Registre des outils. Les outils pas encore implémentés n'y figurent pas :
 * les interactions sont alors simplement ignorées.
 */
import type { ToolId } from '@shared/types';
import { penTool } from './pen';
import type { Tool } from './tool';

const tools: Partial<Record<ToolId, Tool>> = {
  [penTool.id]: penTool,
};

export function getTool(id: ToolId): Tool | undefined {
  return tools[id];
}
