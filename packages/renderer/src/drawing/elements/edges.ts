import { UMLEdge } from '../../core/types';
import { Theme } from '../../core/theme';
import { SVGBuilder as svg } from '../svg-helpers';
import { DrawingRegistry } from '../drawable';

// ─── Constants ────────────────────────────────────────────────────────────────

// Offset for multiplicity labels relative to the waypoint
const LABEL_OFFSET = 12;

/**
 * How many px to retract each end of the path so the marker
 * sits fully outside the node border.
 *
 * Diamonds (Composition/Aggregation) go at the SOURCE end via marker-start.
 * Triangles (Inheritance/Implementation) and arrows go at the TARGET end via marker-end.
 *
 * Values are tuned to match the markerWidth defined in renderMarkers():
 *   triangle → markerWidth 12 → clearance 13
 *   diamond  → markerWidth 18 → clearance 20
 *   arrow    → markerWidth 10 → clearance 11
 */
const END_CLEARANCE: Record<string, number> = {
  Inheritance: 13,
  Implementation: 13,
  Association: 11,
  Dependency: 11,
  Composition: 2,  // diamond is at source → target end is a plain line
  Aggregation: 2,
};

const START_CLEARANCE: Record<string, number> = {
  Composition: 20,  // diamond marker sits at source node
  Aggregation: 20,
  Inheritance: 2,
  Implementation: 2,
  Association: 2,
  Dependency: 2,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Renders a single UML relationship edge (path + markers + labels).
 */
export function renderEdge(edge: UMLEdge, index: number, theme: Theme, options?: any): string {
  if (!edge.waypoints || edge.waypoints.length < 2) return '';

  const wps = edge.waypoints;
  const type = edge.type as string;

  const endClear = END_CLEARANCE[type] ?? 13;
  const startClear = START_CLEARANCE[type] ?? 2;

  // Retract both ends so markers sit outside node borders
  const trimmed = trimStart(trimEnd(wps, endClear), startClear);

  const d = trimmed
    .map((wp, i) => `${i === 0 ? 'M' : 'L'} ${wp.x} ${wp.y}`)
    .join(' ');

  const isDashed = type === 'Implementation' || type === 'Dependency';
  const isDiamond = type === 'Composition' || type === 'Aggregation';

  const pathEl = svg.path({
    d,
    fill: 'none',
    stroke: theme.edgeStroke,
    'stroke-width': theme.edgeStrokeWidth,
    ...(isDashed ? { 'stroke-dasharray': '6,4' } : {}),
    // Diamonds go at source, everything else goes at target
    ...(isDiamond
      ? { 'marker-start': `url(#marker-${type.toLowerCase()})` }
      : { 'marker-end': `url(#marker-${type.toLowerCase()})` }),
  });

  // ── Multiplicity labels ──────────────────────────────────────────────────
  // Positioned with a direction-aware offset so they never overlap
  // the line or land on top of a node border.
  const labels: string[] = [];

  if (edge.fromMultiplicity) {
    const pos = labelPos(wps[0], wps[1], LABEL_OFFSET);
    labels.push(svg.text({
      x: pos.x,
      y: pos.y,
      fill: theme.multiplicityText,
      'font-size': theme.fontSizeSmall,
      'text-anchor': pos.anchor,
    }, edge.fromMultiplicity));
  }

  if (edge.toMultiplicity) {
    const n = wps.length;
    const pos = labelPos(wps[n - 1], wps[n - 2], LABEL_OFFSET);
    labels.push(svg.text({
      x: pos.x,
      y: pos.y,
      fill: theme.multiplicityText,
      'font-size': theme.fontSizeSmall,
      'text-anchor': pos.anchor,
    }, edge.toMultiplicity));
  }

  if (edge.label) {
    const showVisibility = options?.showVisibility !== false;
    const visibility = showVisibility && edge.visibility ? `${edge.visibility} ` : '';
    const displayText = `${visibility}${edge.label}`;

    let x: number, y: number;
    let textAnchor: string = 'middle';

    if (edge.labelPos) {
      // ELK coordinates are for the top-left of the label box.
      // We center the text within that box.
      x = edge.labelPos.x + (edge.labelWidth ? edge.labelWidth / 2 : 0);
      y = edge.labelPos.y + (edge.labelHeight ? edge.labelHeight / 2 : 0);
    } else {
      const mid = midpoint(wps);
      x = mid.x + 4;
      y = mid.y - 4;
      textAnchor = 'start';
    }

    labels.push(svg.text({
      x,
      y,
      fill: theme.multiplicityText,
      'font-size': theme.fontSizeSmall,
      'font-style': 'italic',
      'text-anchor': textAnchor,
      'dominant-baseline': 'central',
    }, displayText));
  }

  return svg.g(
    { class: 'edge', 'data-from': edge.from, 'data-to': edge.to, 'data-index': index },
    pathEl + labels.join('')
  );
}

/**
 * Generates the SVG <defs> block with all UML arrow markers.
 *
 * Rules:
 *  - refX/refY must point to the VISUAL TIP of the shape.
 *  - markerUnits="userSpaceOnUse" → markerWidth/Height are canvas px (not strokeWidth multiples).
 *  - For diamonds: orient="auto-start-reverse" so marker-start draws the diamond
 *    pointing away from the node (correct UML convention: open end toward source).
 */
export function renderMarkers(theme: Theme): string {
  const bg = theme.nodeBackground;
  const stroke = theme.edgeStroke;

  return svg.tag('defs', {}, `
    <!-- ── Inheritance: hollow triangle, tip at right ── -->
    <marker id="marker-inheritance"
            viewBox="0 0 14 14" refX="13" refY="7"
            markerWidth="12" markerHeight="12"
            orient="auto" markerUnits="userSpaceOnUse">
      <path d="M 1 1 L 13 7 L 1 13 Z"
            fill="${bg}" stroke="${stroke}" stroke-linejoin="round" stroke-width="1.5"/>
    </marker>

    <!-- ── Implementation: same hollow triangle, used with dashed line ── -->
    <marker id="marker-implementation"
            viewBox="0 0 14 14" refX="13" refY="7"
            markerWidth="12" markerHeight="12"
            orient="auto" markerUnits="userSpaceOnUse">
      <path d="M 1 1 L 13 7 L 1 13 Z"
            fill="${bg}" stroke="${stroke}" stroke-linejoin="round" stroke-width="1.5"/>
    </marker>

    <!-- ── Composition: filled diamond at SOURCE (marker-start) ──
         orient="auto-start-reverse" flips the marker when used as marker-start
         so the tip still points toward the line (away from the node).         -->
    <marker id="marker-composition"
            viewBox="0 0 20 14" refX="1" refY="7"
            markerWidth="18" markerHeight="12"
            orient="auto-start-reverse" markerUnits="userSpaceOnUse">
      <path d="M 1 7 L 10 1 L 19 7 L 10 13 Z"
            fill="${stroke}" stroke="${stroke}" stroke-linejoin="round" stroke-width="1"/>
    </marker>

    <!-- ── Aggregation: hollow diamond at SOURCE ── -->
    <marker id="marker-aggregation"
            viewBox="0 0 20 14" refX="1" refY="7"
            markerWidth="18" markerHeight="12"
            orient="auto-start-reverse" markerUnits="userSpaceOnUse">
      <path d="M 1 7 L 10 1 L 19 7 L 10 13 Z"
            fill="${bg}" stroke="${stroke}" stroke-linejoin="round" stroke-width="1.5"/>
    </marker>

    <!-- ── Association: open arrowhead at TARGET ── -->
    <marker id="marker-association"
            viewBox="0 0 12 12" refX="10" refY="6"
            markerWidth="10" markerHeight="10"
            orient="auto" markerUnits="userSpaceOnUse">
      <path d="M 1 1 L 10 6 L 1 11"
            fill="none" stroke="${stroke}" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round"/>
    </marker>

    <!-- ── Dependency: same open arrowhead, used with dashed line ── -->
    <marker id="marker-dependency"
            viewBox="0 0 12 12" refX="10" refY="6"
            markerWidth="10" markerHeight="10"
            orient="auto" markerUnits="userSpaceOnUse">
      <path d="M 1 1 L 10 6 L 1 11"
            fill="none" stroke="${stroke}" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  `);
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

type Point = { x: number; y: number };

/**
 * Shortens the LAST segment of a polyline by `dist` px.
 * Moves the path endpoint away from the target node border so the
 * marker head is not obscured by the rectangle.
 */
function trimEnd(wps: Point[], dist: number): Point[] {
  if (wps.length < 2 || dist <= 0) return wps;

  const result = wps.slice(0, -1);
  const a = wps[wps.length - 2];
  const b = wps[wps.length - 1];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len <= dist) return result; // segment too short, drop it

  result.push({
    x: b.x - (dx / len) * dist,
    y: b.y - (dy / len) * dist,
  });
  return result;
}

/**
 * Shortens the FIRST segment of a polyline by `dist` px.
 * Used for diamond markers so the path starts after the marker tip.
 */
function trimStart(wps: Point[], dist: number): Point[] {
  if (wps.length < 2 || dist <= 0) return wps;

  const a = wps[0];
  const b = wps[1];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len <= dist) return wps.slice(1); // segment too short, drop it

  return [
    { x: a.x + (dx / len) * dist, y: a.y + (dy / len) * dist },
    ...wps.slice(1),
  ];
}

/**
 * Computes a direction-aware label position near `anchor`,
 * offset both along the edge and perpendicular to it so labels
 * never overlap the line or the node border.
 */
function labelPos(
  anchor: Point,
  next: Point,
  offset: number,
): { x: number; y: number; anchor: string } {
  const dx = next.x - anchor.x;
  const dy = next.y - anchor.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  // Unit vector along the edge (pointing away from anchor)
  const ux = dx / len;
  const uy = dy / len;

  // Perpendicular unit vector (90° CCW)
  const px = -uy;
  const py = ux;

  const x = anchor.x + ux * offset + px * (offset * 0.8);
  const y = anchor.y + uy * offset + py * (offset * 0.8);

  // text-anchor: label goes to the right of the line → 'start', left → 'end'
  const textAnchor = px >= 0 ? 'start' : 'end';

  return { x, y, anchor: textAnchor };
}

/** Returns the midpoint of a polyline (for edge labels). */
function midpoint(wps: Point[]): Point {
  const mid = Math.floor(wps.length / 2);
  if (wps.length % 2 === 1) return wps[mid];
  const a = wps[mid - 1];
  const b = wps[mid];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Register as Edge renderer
DrawingRegistry.register('Edge', (edge: UMLEdge, theme: Theme, options?: any) => renderEdge(edge, 0, theme, options));