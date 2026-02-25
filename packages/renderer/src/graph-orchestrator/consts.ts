// ─── ELK option keys ──────────────────────────────────────────────────────────
export const BASE_LAYOUT_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.edgeRouting': 'UNDEFINED',

  // Spacing optimizations
  'elk.spacing.nodeNode': '50',
  'elk.layered.spacing.nodeNodeBetweenLayers': '60',
  'elk.spacing.componentComponent': '70',
  'elk.padding': '[top=50,left=50,bottom=50,right=50]',
  'elk.separateConnectedComponents': 'true',
  'elk.layered.mergeEdges': 'false',
  'elk.portConstraints': 'FREE',

  // Long Hierarchical Edges optimizations
  'elk.layered.spacing.edgeEdgeBetweenLayers': '25',
  'elk.layered.spacing.edgeNodeBetweenLayers': '25',
  'elk.layered.unnecessaryEdgeBends': 'true',
  'elk.layered.compaction': 'true',

  // Layered specifics to reduce crossing and "messy" look
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
}
