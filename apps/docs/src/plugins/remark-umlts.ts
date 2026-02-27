import { visit } from 'unist-util-visit'
import { UMLEngine, type IRDiagram } from '@umlts/engine'
import { render } from '@umlts/renderer'
import { TypeScriptPlugin } from '@umlts/plugin-ts'
import type { Root, Code } from 'mdast'
import type { Plugin } from 'unified'

/**
 * Remark plugin to transform UMLTS code blocks into SVG diagrams.
 */
export const remarkUmlts: Plugin<[], Root> = () => {
  const engine = new UMLEngine([new TypeScriptPlugin()])

  return async (tree) => {
    const nodesToProcess: Code[] = []

    visit(tree, 'code', (node: Code) => {
      if (node.lang === 'umlts') {
        nodesToProcess.push(node)
      }
    })

    for (const node of nodesToProcess) {
      try {
        const result = engine.parse(node.value)
        if (result.isValid && result.diagram) {
          const svg = await render(result.diagram as IRDiagram, {
            theme: 'dark',
          })

          // We check if the node has a "meta" string containing 'show-code'
          // Example: ```umlts show-code
          const showCode = node.meta?.includes('show-code')

          const diagramHtml = `<div class="umlts-diagram">${svg}</div>`

          if (showCode) {
            const htmlNode = node as unknown as Record<string, unknown>
            htmlNode.type = 'html'
            htmlNode.value = `
              <div class="umlts-container">
                <div class="umlts-code-preview">
                  <pre><code>${node.value}</code></pre>
                </div>
                ${diagramHtml}
              </div>
            `
          } else {
            const htmlNode = node as unknown as Record<string, unknown>
            htmlNode.type = 'html'
            htmlNode.value = diagramHtml
          }
        } else {
          const errors = (result.diagnostics || [])
            .map((d) => {
              const line = d.line ?? '?'
              return `Line ${line}: ${d.message}`
            })
            .join('\n')

          const htmlNode = node as unknown as Record<string, unknown>
          htmlNode.type = 'html'
          htmlNode.value = `<div class="umlts-error" style="border: 1px solid red; padding: 1rem; color: #ff5555; background: #220000;">
            <strong>UMLTS Error:</strong>
            <pre style="margin-top: 0.5rem;">${errors}</pre>
          </div>`
        }
      } catch (e) {
        console.error('[UMLTS Remark Error]', e)
        const htmlNode = node as unknown as Record<string, unknown>
        htmlNode.type = 'html'
        htmlNode.value = `<div class="umlts-error" style="border: 1px solid red; padding: 1rem; color: #ff5555; background: #220000;">
          <strong>Critical UMLTS Error:</strong>
          <pre style="margin-top: 0.5rem;">${(e as Error).message}</pre>
        </div>`
      }
    }
  }
}
