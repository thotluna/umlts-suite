import { type UMLNote } from '../../core/model/index'
import { type Theme } from '../../core/theme'
import { SVGBuilder as svg } from '../svg-helpers'
import { DrawingRegistry } from '../drawable'

/**
 * Renders a UML Note (dog-ear paper) into an SVG group.
 */
export function renderNote(note: UMLNote, theme: Theme): string {
  const { x = 0, y = 0, width = 120, height = 50 } = note
  const foldSize = 10

  // Points for the "dog-ear" folded paper look
  const points = [
    { x, y },
    { x: x + width - foldSize, y },
    { x: x + width, y: y + foldSize },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ]

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  const body = svg.path({
    d,
    fill: theme.noteBackground,
    stroke: theme.noteBorder,
    'stroke-width': 1.2,
  })

  // The small triangle for the fold
  const fold = svg.path({
    d: `M ${x + width - foldSize} ${y} L ${x + width - foldSize} ${y + foldSize} L ${x + width} ${y + foldSize}`,
    fill: 'none',
    stroke: theme.noteBorder,
    'stroke-width': 1.2,
  })

  // Multi-line text handling with wrapping
  const MAX_CHARS = 40
  const textBody = note.content?.text || ''
  const rawLines = textBody.split('\n')
  const lines: string[] = []

  for (const line of rawLines) {
    if (line.length <= MAX_CHARS) {
      lines.push(line)
    } else {
      const words = line.split(/\s+/)
      let currentLine = ''
      for (const word of words) {
        if ((currentLine + ' ' + word).length <= MAX_CHARS) {
          currentLine += (currentLine ? ' ' : '') + word
        } else {
          if (currentLine) lines.push(currentLine)
          currentLine = word
        }
      }
      if (currentLine) lines.push(currentLine)
    }
  }

  const textContent = lines
    .map((line: string, i: number) =>
      svg.text(
        {
          x: x + 10,
          y: y + 25 + i * 18,
          fill: theme.nodeMemberText,
          'font-size': '12.5px',
          'font-family': theme.fontFamily,
        },
        svg.escape(line),
      ),
    )
    .join('')

  return svg.g({ class: 'note', 'data-id': note.id }, body + fold + textContent)
}

// Register as Note renderer
DrawingRegistry.register('Note', (note: unknown, theme: Theme) =>
  renderNote(note as UMLNote, theme),
)
