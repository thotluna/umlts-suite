
import { DiagramNode } from '../core/types';

/**
 * Approximate constants for text measurement without a real DOM.
 * These values are calibrated for a standard monospace font at 13px.
 */
const CHAR_WIDTH = 7.8; // Average width of a character in pixels
const LINE_HEIGHT = 24; // Height of each member line
const HEADER_HEIGHT = 32; // Height of the entity header
const PADDING_BOTTOM = 8;
const MIN_WIDTH = 160;

/**
 * Calculates the dimensions of a DiagramNode based on its content.
 */
export function measureNode(node: DiagramNode): { width: number, height: number } {
  // 1. Calculate max width based on the longest string
  let maxChars = node.name.length;

  // Sterotypes like «interface» or «enum» add to width
  if (node.type !== 'Class') maxChars = Math.max(maxChars, node.type.length + 4);

  // Generics like <T, K>
  if (node.typeParameters.length > 0) {
    const genericsStr = `<${node.typeParameters.join(', ')}>`;
    maxChars = Math.max(maxChars, genericsStr.length);
  }

  // Members
  const allMembers = [...node.attributes, ...node.methods];
  for (const m of allMembers) {
    // Basic representation: visibility + name + : + type + multiplicity
    let memberChars = 2 + m.name.length + 3 + (m.type?.length || 0);
    if (m.multiplicity) memberChars += m.multiplicity.length + 2;
    if (m.parameters) {
      // Methods also have parameters (name: type)
      const paramsChars = m.parameters.reduce((acc, p) => acc + p.name.length + (p.type?.length || 0) + 3, 0);
      memberChars += paramsChars + 2; // +2 for ()
    }
    maxChars = Math.max(maxChars, memberChars);
  }

  const width = Math.max(MIN_WIDTH, Math.ceil(maxChars * CHAR_WIDTH + 20)); // +20 for padding

  // 2. Calculate height
  // Header + Attributes Section + Methods Section
  const memberCount = allMembers.length;
  // We add some extra height if we have both attributes and methods for the divider
  const sectionDividerHeight = (node.attributes.length > 0 && node.methods.length > 0) ? 8 : 0;

  const height = HEADER_HEIGHT + (memberCount * LINE_HEIGHT) + sectionDividerHeight + PADDING_BOTTOM;

  return { width, height };
}
