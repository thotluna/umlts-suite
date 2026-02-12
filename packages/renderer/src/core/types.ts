export * from './contract/ir';
export * from './model/nodes';

import type { DiagramModel } from './model/nodes';


export interface LayoutResult {
  model: DiagramModel;
  totalWidth: number;
  totalHeight: number;
}

export interface DiagramConfig {
  theme?: string;
  layout?: {
    direction?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
    spacing?: number;
    nodePadding?: number;
    routing?: 'ORTHOGONAL' | 'SPLINES' | 'POLYLINE';
  };
  render?: {
    showVisibility?: boolean;
    showIcons?: boolean;
    showAbstractItalic?: boolean;
  };
}
