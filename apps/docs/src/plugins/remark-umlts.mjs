import { visit } from 'unist-util-visit'
import { UMLEngine } from '@umlts/engine'
import { render } from '@umlts/renderer'
import { TypeScriptPlugin } from '@umlts/plugin-ts'

export function remarkUmlts() {
  const engine = new UMLEngine([new TypeScriptPlugin()])

  return async (tree) => {
    const nodesToProcess = []

    visit(tree, 'code', (node) => {
      if (node.lang === 'umlts') {
        nodesToProcess.push(node)
      }
    })

    for (const node of nodesToProcess) {
      try {
        const result = engine.parse(node.value)
        if (result.isValid) {
          const svg = await render(result.diagram, {
            theme: 'dark', // Default to dark as per user rules for "premium" look
          })

          node.type = 'html'
          node.value = `<div class="umlts-diagram">${svg}</div>`
        } else {
          const errors = result.diagnostics
            .map((d) => {
              const line = d.range?.start?.line ?? '?'
              return `Line ${line}: ${d.message}`
            })
            .join('\n')

          node.type = 'html'
          node.value = `<div class="umlts-error" style="border: 1px solid red; padding: 1rem; color: #ff5555; background: #220000;">
            <strong>UMLTS Error:</strong>
            <pre style="margin-top: 0.5rem;">${errors}</pre>
          </div>`
        }
      } catch (e) {
        node.type = 'html'
        node.value = `<div class="umlts-error" style="border: 1px solid red; padding: 1rem; color: #ff5555; background: #220000;">
          <strong>Renderer Exception:</strong>
          <pre style="margin-top: 0.5rem;">${e.message}\n${e.stack}</pre>
        </div>`
      }
    }
  }
}
