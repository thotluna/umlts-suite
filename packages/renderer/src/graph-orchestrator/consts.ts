// ─── ELK option keys ──────────────────────────────────────────────────────────
export const BASE_LAYOUT_OPTIONS: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.edgeRouting': 'UNDEFINED',

  // Spacing optimizations
  'elk.spacing.nodeNode': '60',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.spacing.edgeEdge': '40',
  'elk.spacing.edgeNode': '40',
  'elk.spacing.labelNode': '20',
  'elk.spacing.labelLabel': '20',
  'elk.padding': '[top=80,left=70,bottom=80,right=70]',
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
