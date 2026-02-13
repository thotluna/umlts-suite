import {
  createConnection,
  TextDocuments,
  type Diagnostic as LSPDiagnostic,
  DiagnosticSeverity as LSPDiagnosticSeverity,
  ProposedFeatures,
  type InitializeParams,
  TextDocumentSyncKind,
  type CompletionItem,
  CompletionItemKind,
  MarkupKind,
} from 'vscode-languageserver/node'

import { TextDocument } from 'vscode-languageserver-textdocument'

import { UMLEngine, type ParseResult, type IREntity, type IRDiagram } from '@umlts/engine'
// Importamos el diccionario de documentación de operadores
import { OPERATOR_DOCS } from './docs_data'

// Creamos la conexión para el servidor
const connection = createConnection(ProposedFeatures.all)

// Gestor de documentos abiertos
const documents = new TextDocuments<TextDocument>(TextDocument)

// Motor de UMLTS (Fachada principal)
const engine = new UMLEngine()

// Mapas para persistencia de análisis resumido para hover/completion
const documentsDiagram = new Map<string, IRDiagram>()
const documentsEntities = new Map<string, string[]>()

connection.onInitialize((_params: InitializeParams) => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: ['.', ' ', '>'],
      },
      hoverProvider: true,
    },
  }
})

documents.onDidChangeContent((change) => {
  validateTextDocument(change.document)
})

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText()
  const diagnostics: LSPDiagnostic[] = []

  try {
    const result: ParseResult = engine.parse(text)

    for (const issue of result.diagnostics) {
      const severity =
        (issue.severity as string) === 'Error'
          ? LSPDiagnosticSeverity.Error
          : LSPDiagnosticSeverity.Warning

      diagnostics.push({
        severity,
        range: {
          start: {
            line: issue.line ? issue.line - 1 : 0,
            character: issue.column ? issue.column - 1 : 0,
          },
          end: {
            line: issue.line ? issue.line - 1 : 0,
            character: issue.column ? issue.column - 1 + (issue.length || 1) : 1000,
          },
        },
        message: issue.message,
        source: 'UMLTS',
      })
    }

    // Persistir resultados
    const entitiesLabels = result.diagram.entities.map((e) => e.name)
    documentsEntities.set(textDocument.uri, entitiesLabels)
    documentsDiagram.set(textDocument.uri, result.diagram)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    diagnostics.push({
      severity: LSPDiagnosticSeverity.Error,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 1000 },
      },
      message: message || 'Error crítico en el motor UMLTS',
      source: 'UMLTS',
    })
  }

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics })
}

connection.onCompletion((params) => {
  const doc = documents.get(params.textDocument.uri)
  if (doc == null) return []

  const text = doc.getText()
  const offset = doc.offsetAt(params.position)
  const textBefore = text.substring(0, offset)

  // Check if we are inside a config block
  // A simple way: find the last occurrence of '{' and check if it's preceded by 'config'
  const lastOpenBrace = textBefore.lastIndexOf('{')
  const lastCloseBrace = textBefore.lastIndexOf('}')

  if (lastOpenBrace > lastCloseBrace) {
    const textBeforeBrace = textBefore.substring(0, lastOpenBrace).trim()
    // Heurística robusta: eliminamos comentarios de línea y de bloque para encontrar la keyword
    const cleanTextBeforeBrace = textBeforeBrace
      .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Elimina /* ... */ y // ...
      .trim()

    if (cleanTextBeforeBrace.endsWith('config')) {
      const properties = [
        { label: 'direction', detail: 'UP | DOWN | LEFT | RIGHT' },
        { label: 'spacing', detail: 'Distance between nodes (number)' },
        { label: 'theme', detail: 'light | dark' },
        { label: 'routing', detail: 'ORTHOGONAL | POLYLINE | SPLINES' },
        { label: 'showVisibility', detail: 'true | false' },
        { label: 'showIcons', detail: 'true | false' },
        { label: 'nodePadding', detail: 'Internal padding (number)' },
        { label: 'responsive', detail: 'true | false (SVG takes 100%)' },
        { label: 'zoomLevel', detail: '1.0 = 100% (zoom adjustment)' },
        { label: 'width', detail: 'Custom width (number or %)' },
        { label: 'height', detail: 'Custom height (number or %)' },
      ]

      // Check if we just typed 'property:' to offer values
      const lineTextBefore = textBefore.split('\n').pop() || ''

      if (lineTextBefore.includes('direction:')) {
        return ['UP', 'DOWN', 'LEFT', 'RIGHT'].map((v) => ({
          label: v,
          kind: CompletionItemKind.EnumMember,
        }))
      }

      if (
        lineTextBefore.includes('showVisibility:') ||
        lineTextBefore.includes('showIcons:') ||
        lineTextBefore.includes('responsive:')
      ) {
        return ['true', 'false'].map((v) => ({
          label: v,
          kind: CompletionItemKind.Keyword,
        }))
      }

      if (lineTextBefore.includes('theme:')) {
        return ['light', 'dark'].map((v) => ({
          label: v,
          kind: CompletionItemKind.Color,
        }))
      }

      if (lineTextBefore.includes('routing:')) {
        return ['ORTHOGONAL', 'POLYLINE', 'SPLINES'].map((v) => ({
          label: v,
          kind: CompletionItemKind.EnumMember,
        }))
      }

      return properties.map((p) => ({
        label: p.label,
        kind: CompletionItemKind.Property,
        detail: p.detail,
      }))
    }

    // Si estamos dentro de un bloque pero NO es config, por ahora no devolvemos nada o el flujo normal
    // (Podríamos añadir otros bloques aquí en el futuro)
  }

  const keywords = [
    'class',
    'interface',
    'enum',
    'package',
    'config',
    'extends',
    'implements',
    'public',
    'private',
    'protected',
    'abstract',
    'static',
  ]

  const items: CompletionItem[] = keywords.map((kw) => ({
    label: kw,
    kind: CompletionItemKind.Keyword,
  }))

  const primitives = ['string', 'number', 'boolean', 'void', 'any']
  primitives.forEach((p) => {
    items.push({
      label: p,
      kind: CompletionItemKind.TypeParameter,
    })
  })

  const entities = documentsEntities.get(params.textDocument.uri)
  if (entities != null) {
    entities.forEach((e) => {
      items.push({
        label: e,
        kind: CompletionItemKind.Class,
      })
    })
  }

  return items
})

connection.onHover((params) => {
  const doc = documents.get(params.textDocument.uri)
  if (doc == null) return null

  const diagram = documentsDiagram.get(params.textDocument.uri)
  if (diagram == null) return null

  const line = params.position.line
  const text = doc.getText({
    start: { line, character: 0 },
    end: { line, character: Number.MAX_VALUE },
  })

  const textBefore = text.substring(0, params.position.character)
  const textAfter = text.substring(params.position.character)

  const prefixMatch = textBefore.match(/[a-zA-Z0-9_.>+*\-$#~]+$/)
  const suffixMatch = textAfter.match(/^[a-zA-Z0-9_.>+*\-$#~]*/)

  if (prefixMatch == null && suffixMatch == null) return null

  const word =
    (prefixMatch != null ? prefixMatch[0] : '') + (suffixMatch != null ? suffixMatch[0] : '')
  if (!word) return null

  const entity = diagram.entities.find((e) => e.name === word || e.id === word)

  if (entity != null) {
    let markdown = `**${entity.type}:** \`${entity.id}\``

    if (entity.docs) {
      markdown += `\n\n---\n${entity.docs}`
    }

    if (entity.members && entity.members.length > 0) {
      markdown += '\n\n**Miembros:**\n'
      entity.members.slice(0, 5).forEach((m: IREntity['members'][number]) => {
        const sign = m.parameters != null ? '()' : ''
        markdown += `- \`${m.visibility}${m.name}${sign}: ${m.type || 'any'}\`\n`
      })
      if (entity.members.length > 5) markdown += `- *... y ${entity.members.length - 5} más*`
    }

    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: markdown,
      },
    }
  }

  // 2. Si no es una entidad, ¿es un operador o símbolo conocido?
  const operatorDoc = OPERATOR_DOCS[word]
  if (operatorDoc) {
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: operatorDoc,
      },
    }
  }

  return null
})

documents.listen(connection)
connection.listen()
