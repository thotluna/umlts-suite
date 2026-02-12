export * from './contract/ir';
export * from './model/nodes';

import type { DiagramModel } from './model/nodes';

export interface LayoutResult {
  model: DiagramModel;
  totalWidth: number;
  totalHeight: number;
}
