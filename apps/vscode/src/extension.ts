import * as vscode from 'vscode'
import { UMLEngine, type ParseResult, type IRProperty, type IROperation } from '@umlts/engine'
import { UMLPreviewPanel } from './preview'

export function activate(context: vscode.ExtensionContext) {
  const engine = new UMLEngine()
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('umlts')

  // Caché simple para evitar re-parseos innecesarios en hovers/completions rápidos
  let lastParseResult: ParseResult | null = null
  let lastDocumentUri = ''

  const getParseResult = async (document: vscode.TextDocument) => {
    if (lastDocumentUri === document.uri.toString() && lastParseResult != null) {
      return lastParseResult
    }
    lastParseResult = await engine.parse(document.getText())
    lastDocumentUri = document.uri.toString()
    return lastParseResult
  }

  const validateDocument = async (document: vscode.TextDocument) => {
    if (document.languageId !== 'umlts') return

    const result = await engine.parse(document.getText())
    lastParseResult = result
    lastDocumentUri = document.uri.toString()

    const vsDiagnostics: vscode.Diagnostic[] = result.diagnostics.map((diag: any) => {
      const range = new vscode.Range(
        (diag.line || 1) - 1,
        Math.max(0, (diag.column || 1) - 1),
        (diag.line || 1) - 1,
        Math.max(0, (diag.column || 1) - 1) + (diag.length || 1),
      )
      const severity =
        diag.severity === 'Warning'
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Error
      return new vscode.Diagnostic(range, diag.message, severity)
    })

    diagnosticCollection.set(document.uri, vsDiagnostics)
  }

  // --- Autocompletado ---
  const completionProvider = vscode.languages.registerCompletionItemProvider('umlts', {
    provideCompletionItems(document, position) {
      const completions: vscode.CompletionItem[] = []
      const textBefore = document.getText(new vscode.Range(new vscode.Position(0, 0), position))
      const lastOpenBrace = textBefore.lastIndexOf('{')
      const lastCloseBrace = textBefore.lastIndexOf('}')

      // --- 1. Lógica de Bloques Contextuales (Exclusiva) ---
      if (lastOpenBrace > lastCloseBrace) {
        const textBeforeBrace = textBefore.substring(0, lastOpenBrace).trim()
        // Heurística robusta: eliminamos comentarios para encontrar la keyword
        const cleanTextBeforeBrace = textBeforeBrace.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim()

        if (cleanTextBeforeBrace.endsWith('config')) {
          const configProps = [
            { label: 'direction', detail: 'UP | DOWN | LEFT | RIGHT' },
            { label: 'spacing', detail: 'Distancia entre nodos (número)' },
            { label: 'theme', detail: 'light | dark' },
            { label: 'routing', detail: 'ORTHOGONAL | POLYLINE | SPLINES' },
            { label: 'showVisibility', detail: 'true | false' },
            { label: 'showIcons', detail: 'true | false' },
            { label: 'nodePadding', detail: 'Padding interno de paquetes (número)' },
            { label: 'responsive', detail: 'true | false (SVG takes 100%)' },
            { label: 'zoomLevel', detail: '1.0 = 100% (zoom level)' },
            { label: 'width', detail: 'Canvas width (number or %)' },
            { label: 'height', detail: 'Canvas height (number or %)' },
          ]

          configProps.forEach((p) => {
            const item = new vscode.CompletionItem(p.label, vscode.CompletionItemKind.Property)
            item.detail = p.detail
            completions.push(item)
          })

          // Sugerencias de valores específicos basándonos en la palabra antes del cursor
          const lineTextBefore = document
            .lineAt(position.line)
            .text.substring(0, position.character)

          if (lineTextBefore.includes('direction:')) {
            ;['UP', 'DOWN', 'LEFT', 'RIGHT'].forEach((v) =>
              completions.push(new vscode.CompletionItem(v, vscode.CompletionItemKind.EnumMember)),
            )
          } else if (lineTextBefore.includes('routing:')) {
            ;['ORTHOGONAL', 'POLYLINE', 'SPLINES'].forEach((v) =>
              completions.push(new vscode.CompletionItem(v, vscode.CompletionItemKind.EnumMember)),
            )
          } else if (lineTextBefore.includes('theme:')) {
            ;['light', 'dark'].forEach((v) =>
              completions.push(new vscode.CompletionItem(v, vscode.CompletionItemKind.Color)),
            )
          } else if (
            lineTextBefore.includes('visibility:') ||
            lineTextBefore.includes('Icons:') ||
            lineTextBefore.includes('responsive:')
          ) {
            ;['true', 'false'].forEach((v) =>
              completions.push(new vscode.CompletionItem(v, vscode.CompletionItemKind.Keyword)),
            )
          }

          return completions // RETORNO EXCLUSIVO: Solo cosas de config
        }
      }

      // --- 2. Sugerencias Globales (Fuera de bloques o bloques genéricos) ---

      // Keywords Básicas
      const keywords = [
        'class',
        'interface',
        'enum',
        'package',
        'config',
        'public',
        'private',
        'protected',
        'internal',
        'static',
        'abstract',
      ]
      keywords.forEach((kw) => {
        completions.push(new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword))
      })

      // Entidades del diagrama actual
      return getParseResult(document).then((result) => {
        if (result && result.diagram && result.diagram.entities) {
          result.diagram.entities.forEach((entity: any) => {
            const item = new vscode.CompletionItem(entity.name, vscode.CompletionItemKind.Class)
            item.detail = entity.namespace ? `(in ${entity.namespace})` : ''
            item.documentation = new vscode.MarkdownString(
              `FQN: \`${entity.id}\`\n\nType: ${entity.type}`,
            )
            completions.push(item)
          })
        }
        return completions
      })
    },
  })

  // --- Catálogo de Ayuda del Lenguaje ---
  const languageHelp: Record<string, { desc: string; example: string }> = {
    class: {
      desc: 'Define una Clase: Representa un concepto u objeto del sistema.',
      example: 'class Usuario {\n  nombre: string\n}',
    },
    interface: {
      desc: 'Define una Interfaz: Contrato que deben seguir las clases.',
      example: 'interface IRepositorio {\n  save(): void\n}',
    },
    enum: {
      desc: 'Define un Enumerado: Conjunto de constantes con nombre.',
      example: 'enum Estado {\n  ACTIVO\n  INACTIVO\n}',
    },
    package: {
      desc: 'Define un Paquete: Agrupa entidades en un espacio de nombres.',
      example: 'package "Dominio" {\n  class Entidad\n}',
    },
    abstract: {
      desc: 'Marca un elemento como abstracto (no instanciable).',
      example: 'abstract class Base {}\n*Base >> Hijo',
    },
    static: {
      desc: 'Define un miembro que pertenece a la clase, no a la instancia.',
      example: 'static contador: number',
    },
    public: {
      desc: 'Visibilidad Pública (+): Accesible desde cualquier lugar.',
      example: 'public nombre: string',
    },
    private: {
      desc: 'Visibilidad Privada (-): Solo accesible dentro de la entidad.',
      example: 'private id: number',
    },
    protected: {
      desc: 'Visibilidad Protegida (#): Accesible en la entidad y sus hijos.',
      example: 'protected clave: string',
    },
    internal: {
      desc: 'Visibilidad Interna (~): Accesible dentro del mismo paquete.',
      example: '~config: any',
    },
    '>>': {
      desc: 'Asociación / Herencia: Define una relación entre entidades.',
      example: 'Hijo >> Padre',
    },
    '>E': {
      desc: 'Herencia / Extensión: Indica que una clase hereda de otra.',
      example: 'Gato >E Animal',
    },
    '>I': {
      desc: 'Implementación: Una clase implementa una interfaz.',
      example: 'Servicio >I IServicio',
    },
    '>*': {
      desc: 'Composición: Relación de "pertenencia fuerte". Si el padre muere, el hijo también.',
      example: 'Coche >* Motor',
    },
    '>+': {
      desc: 'Agregación: Relación de "pertenencia débil". El hijo puede existir sin el padre.',
      example: 'Aula >+ Estudiante',
    },
    '>-': {
      desc: 'Dependencia / Uso: Una entidad usa a otra temporalmente.',
      example: 'Componente >- Servicio',
    },
    '*': {
      desc: 'Descriptor de Entidad Abstracta.',
      example: 'A >> *B // B es tratada como abstracta',
    },
    '..': {
      desc: 'Rango / Multiplicidad: Define el número de instancias participantes.',
      example: 'A [0..*] >> B',
    },
    '[]': { desc: 'Multiplicidad opcional o por defecto (0..* o 1).', example: 'Clase []' },
    '[+]': { desc: 'Multiplicidad de uno o más (1..*).', example: 'Clase [+]' },
    '[0..*]': { desc: 'Multiplicidad de cero a muchos.', example: 'Clase [0..*]' },
    '[1..*]': { desc: 'Multiplicidad de uno a muchos.', example: 'Clase [1..*]' },
    '[': {
      desc: 'Inicio de Multiplicidad: Define el rango de instancias.',
      example: 'Clase [0..1]',
    },
    ']': { desc: 'Fin de Multiplicidad.', example: 'Clase [1..*]' },
    config: {
      desc: 'Bloque de Configuración: Define ajustes del diagrama (tema, dirección, espaciado, enrutamiento).',
      example: 'config {\n  direction: RIGHT\n  routing: ORTHOGONAL\n}',
    },
    routing: {
      desc: 'Enrutamiento de Líneas: Define cómo se dibujan las relaciones. ORTHOGONAL | POLYLINE | SPLINES.',
      example: 'routing: ORTHOGONAL',
    },
    ':': { desc: 'Separador de tipo para atributos y métodos.', example: 'nombre: string' },
  }

  // --- Hovers ---
  const hoverProvider = vscode.languages.registerHoverProvider('umlts', {
    async provideHover(document, position) {
      const range = document.getWordRangeAtPosition(
        position,
        /\[[^\]]*\]|[a-zA-Z0-9_*>-]+|[><=:. [\]+*]+/,
      )
      if (range == null) return null

      const word = document.getText(range)
      const result = await getParseResult(document)

      // 1. Ayuda del Lenguaje (Keywords/Operadores)
      let helpKey = word
      if (!languageHelp[helpKey]) {
        // Detectar si es una variante de multiplicidad (números, *, rangos o cualquier contenido entre [])
        if (/^[0-9*.]+$/.test(word) || /^\[.*\]$/.test(word) || word === '[' || word === ']') {
          helpKey = '..'
        }
      }

      if (languageHelp[helpKey]) {
        const help = languageHelp[helpKey]
        const markdown = new vscode.MarkdownString()
        markdown.appendMarkdown(`**Ayuda UMLTS**\n\n${help.desc}\n\n`)
        markdown.appendCodeblock(help.example, 'umlts')
        return new vscode.Hover(markdown, range)
      }

      // 2. Documentación de Usuario (AST/IR Analysis)
      if (result && result.diagram) {
        const line = position.line + 1

        // Buscar en Entidades
        const entity = result.diagram.entities.find(
          (e: any) =>
            (e.name === word || e.id === word) &&
            (e.line === line ||
              e.properties.some((m: any) => m.name === word && m.line === line) ||
              e.operations.some((m: any) => m.name === word && m.line === line)),
        )

        if (entity != null) {
          const markdown = new vscode.MarkdownString()

          // Caso: Es un miembro de la entidad
          const prop = entity.properties.find((p: any) => p.name === word && p.line === line)
          const op = entity.operations.find((o: any) => o.name === word && o.line === line)
          const member = prop || op

          if (member != null) {
            const isOp = 'parameters' in member
            markdown.appendMarkdown(
              `### ${member.isStatic ? 'Static ' : ''}${isOp ? 'Method' : 'Attribute'}: **${member.name}**\n`,
            )
            if (member.docs) markdown.appendMarkdown(`---\n${member.docs}\n`)

            const typeInfo = isOp ? (member as IROperation).returnType : (member as IRProperty).type
            markdown.appendMarkdown(`\n**Type:** \`${typeInfo || 'any'}\``)
            return new vscode.Hover(markdown, range)
          }

          // Caso: Es la entidad misma
          markdown.appendMarkdown(`### ${entity.type}: **${entity.name}**\n`)
          if (entity.docs) markdown.appendMarkdown(`---\n${entity.docs}\n`)
          if (entity.namespace) markdown.appendMarkdown(`\n*Namespace: ${entity.namespace}*`)

          return new vscode.Hover(markdown, range)
        }

        // Buscar en Relaciones
        const rel = result.diagram.relationships.find((r: any) => r.line === line)
        if (word === rel?.type) {
          // Simplificación: si el ratón está en la línea de la relación
          const markdown = new vscode.MarkdownString()
          markdown.appendMarkdown(`### Relación: **${rel.type}**\n`)
          if (rel.docs) markdown.appendMarkdown(`---\n${rel.docs}\n`)
          markdown.appendMarkdown(`\n\`${rel.from}\` -> \`${rel.to}\``)
          return new vscode.Hover(markdown, range)
        }
      }

      return null
    },
  })

  // Suscripciones y eventos
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(validateDocument),
    vscode.workspace.onDidChangeTextDocument((e) => {
      lastParseResult = null // Invalida caché
      validateDocument(e.document)
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      diagnosticCollection.delete(doc.uri)
      if (lastDocumentUri === doc.uri.toString()) {
        lastParseResult = null
        lastDocumentUri = ''
      }
    }),
    diagnosticCollection,
    completionProvider,
    hoverProvider,
    vscode.commands.registerCommand('umlts.showPreview', () => {
      UMLPreviewPanel.createOrShow(context.extensionUri)
    }),
  )

  // Validar archivos abiertos al inicio
  vscode.workspace.textDocuments.forEach(validateDocument)
}

export function deactivate() {
  // Logic to cleanup resources
}
