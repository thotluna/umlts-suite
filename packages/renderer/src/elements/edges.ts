
import { DiagramEdge, IRRelType } from '../core/types';
import { Theme } from '../core/theme';
import * as svg from '../utils/svg-helpers';

/**
 * Renders UML relationships with orthogonal paths and markers.
 */
export function renderEdge(edge: DiagramEdge, index: number, theme: Theme): string {
  if (!edge.waypoints || edge.waypoints.length < 2) return '';

  // 1. Build path data
  const d = edge.waypoints
    .map((wp, i) => `${i === 0 ? 'M' : 'L'} ${wp.x} ${wp.y}`)
    .join(' ');

  const isDashed = edge.type === 'Implementation' || edge.type === 'Dependency';

  const pathElement = svg.path({
    d,
    fill: 'none',
    stroke: theme.edgeStroke,
    'stroke-width': theme.edgeStrokeWidth,
    'stroke-dasharray': isDashed ? '5,5' : undefined,
    'marker-end': `url(#marker-${edge.type.toLowerCase()})`
  });

  // 2. Multiplicity labels (Place near start and end)
  const labels = [];
  if (edge.fromMultiplicity) {
    const start = edge.waypoints[0];
    labels.push(svg.text({
      x: start.x + 5,
      y: start.y - 5,
      fill: theme.multiplicityText,
      'font-size': theme.fontSizeSmall
    }, edge.fromMultiplicity));
  }

  if (edge.toMultiplicity) {
    const end = edge.waypoints[edge.waypoints.length - 1];
    labels.push(svg.text({
      x: end.x + 5,
      y: end.y - 5,
      fill: theme.multiplicityText,
      'font-size': theme.fontSizeSmall
    }, edge.toMultiplicity));
  }

  return svg.g({ class: 'edge', 'data-index': index }, pathElement + labels.join(''));
}

/**
 * Generates the SVG <defs> containing markers for all relationship types.
 */
export function renderMarkers(theme: Theme): string {
  return svg.tag('defs', {}, `
    <!-- Inheritance / Implementation -->
    <marker id="marker-inheritance" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 Z" fill="${theme.nodeBackground}" stroke="${theme.edgeStroke}" />
    </marker>
    <marker id="marker-implementation" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 Z" fill="${theme.nodeBackground}" stroke="${theme.edgeStroke}" />
    </marker>

    <!-- Composition -->
    <marker id="marker-composition" viewBox="0 0 12 10" refX="12" refY="5" markerWidth="10" markerHeight="8" orient="auto">
      <path d="M 0 5 L 6 0 L 12 5 L 6 10 Z" fill="${theme.edgeStroke}" stroke="${theme.edgeStroke}" />
    </marker>

    <!-- Aggregation -->
    <marker id="marker-aggregation" viewBox="0 0 12 10" refX="12" refY="5" markerWidth="10" markerHeight="8" orient="auto">
      <path d="M 0 5 L 6 0 L 12 5 L 6 10 Z" fill="${theme.nodeBackground}" stroke="${theme.edgeStroke}" />
    </marker>

    <!-- Association / Dependency -->
    <marker id="marker-association" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="${theme.edgeStroke}" stroke-width="1.5" />
    </marker>
    <marker id="marker-dependency" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="${theme.edgeStroke}" stroke-width="1.5" />
    </marker>
  `);
}
