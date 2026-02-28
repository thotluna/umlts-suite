import * as vscode from 'vscode'
import { UMLEngine, type ParseResult } from '@umlts/engine'
import { render, darkTheme, lightTheme } from '@umlts/renderer'
import { TypeScriptPlugin } from '@umlts/plugin-ts'

export class UMLPreviewPanel {
  public static currentPanel: UMLPreviewPanel | undefined
  private readonly _panel: vscode.WebviewPanel
  private readonly _engine: UMLEngine
  private _documentUri: vscode.Uri | undefined
  private _lastResult: ParseResult | undefined
  private readonly _disposables: vscode.Disposable[] = []

  public static createOrShow(extensionUri: vscode.Uri) {
    const column =
      vscode.window.activeTextEditor != null ? vscode.window.activeTextEditor.viewColumn : undefined

    if (UMLPreviewPanel.currentPanel != null) {
      UMLPreviewPanel.currentPanel._panel.reveal(column)
      return
    }

    const panel = vscode.window.createWebviewPanel(
      'umltsPreview',
      'UMLTS Preview',
      column
        ? column === vscode.ViewColumn.One
          ? vscode.ViewColumn.Two
          : column
        : vscode.ViewColumn.Two,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
        retainContextWhenHidden: true,
      },
    )

    UMLPreviewPanel.currentPanel = new UMLPreviewPanel(panel, extensionUri)
  }

  private constructor(panel: vscode.WebviewPanel, _extensionUri: vscode.Uri) {
    this._panel = panel
    this._engine = new UMLEngine([new TypeScriptPlugin()])

    this._update()

    this._panel.onDidDispose(
      () => {
        this.dispose()
      },
      null,
      this._disposables,
    )

    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'exportSvg': {
            if (this._documentUri == null) {
              vscode.window.showErrorMessage(
                'No hay un documento activo asociado a esta previsualización.',
              )
              return
            }

            const svgContent = message.svg
            if (!svgContent) {
              vscode.window.showErrorMessage('No se pudo capturar el contenido del diagrama.')
              return
            }

            const defaultUri = vscode.Uri.file(this._documentUri.fsPath.replace('.umlts', '.svg'))

            const saveUri = await vscode.window.showSaveDialog({
              defaultUri,
              filters: { 'SVG files': ['svg'] },
            })

            if (saveUri != null) {
              await vscode.workspace.fs.writeFile(saveUri, Buffer.from(svgContent, 'utf8'))
              vscode.window.showInformationMessage('Diagrama exportado correctamente.')
            }
            return
          }
          case 'showAst': {
            if (this._lastResult == null) {
              vscode.window.showErrorMessage('No hay un AST disponible.')
              return
            }

            const astJson = JSON.stringify(this._lastResult, null, 2)

            const doc = await vscode.workspace.openTextDocument({
              content: astJson,
              language: 'json',
            })
            await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside })
            return
          }
          case 'alert':
            vscode.window.showErrorMessage(message.text)
        }
      },
      null,
      this._disposables,
    )

    vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document === vscode.window.activeTextEditor?.document) {
          this._update()
        }
      },
      null,
      this._disposables,
    )

    vscode.workspace.onDidChangeConfiguration(
      (e) => {
        if (e.affectsConfiguration('umlts.preview')) {
          this._update()
        }
      },
      null,
      this._disposables,
    )

    vscode.window.onDidChangeActiveTextEditor(
      () => {
        this._update()
      },
      null,
      this._disposables,
    )
  }

  public dispose() {
    UMLPreviewPanel.currentPanel = undefined
    this._panel.dispose()
    while (this._disposables.length > 0) {
      const x = this._disposables.pop()
      if (x != null) {
        x.dispose()
      }
    }
  }

  private async _update() {
    const editor = vscode.window.activeTextEditor
    if (editor?.document.languageId !== 'umlts') {
      return
    }

    this._documentUri = editor.document.uri

    try {
      const text = editor.document.getText()
      const result = await this._engine.parse(text)
      this._lastResult = result

      const config = vscode.workspace.getConfiguration('umlts')
      const preferredTheme = config.get<'auto' | 'light' | 'dark'>('preview.theme', 'auto')
      const fontFamily = config.get<string>('preview.fontFamily', 'monospace')
      const fontSize = config.get<number>('preview.fontSize', 13)
      const customColors = config.get<Record<string, unknown>>('preview.customColors', {})

      const isDark =
        vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ||
        vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast

      const themeName: 'light' | 'dark' =
        preferredTheme === 'auto' ? (isDark ? 'dark' : 'light') : preferredTheme

      // Importar temas base (asumiendo que están exportados o accesibles)
      // Como estamos en el mismo monorepo, podemos usar los objetos directamente si los importamos
      // Pero para simplicidad aquí, construiremos el objeto final.

      const svg = await render(result.diagram, {
        theme: {
          ...(themeName === 'dark' ? darkTheme : lightTheme),
          fontFamily,
          fontSizeBase: fontSize,
          ...customColors,
        },
        config: {
          render: {
            responsive: false, // Forzamos false para que el Webview maneje el zoom sobre píxeles reales
          },
        },
      })

      this._panel.webview.html = this._getHtmlForWebview(svg)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      this._panel.webview.html = this._getErrorHtml(message)
    }
  }

  private _getHtmlForWebview(svg: string) {
    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>UMLTS Preview</title>
                <style>
                    :root {
                        --bg-color: var(--vscode-editor-background);
                        --fg-color: var(--vscode-editor-foreground);
                        --accent: var(--vscode-button-background);
                        --accent-hover: var(--vscode-button-hoverBackground);
                        --border: var(--vscode-panel-border);
                        --toolbar-bg: var(--vscode-sideBar-background);
                    }
                    body {
                        background-color: var(--bg-color);
                        color: var(--fg-color);
                        padding: 0;
                        margin: 0;
                        font-family: var(--vscode-font-family);
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        height: 100vh;
                    }
                    .toolbar {
                        display: flex;
                        gap: 8px;
                        padding: 8px 16px;
                        background: var(--toolbar-bg);
                        border-bottom: 1px solid var(--border);
                        align-items: center;
                        z-index: 100;
                    }
                    .toolbar button {
                        background: var(--accent);
                        color: white;
                        border: none;
                        padding: 4px 10px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        transition: background 0.2s;
                        height: 28px;
                    }
                    .toolbar button:hover {
                        background: var(--accent-hover);
                    }
                    .toolbar .divider {
                        width: 1px;
                        height: 20px;
                        background: var(--border);
                        margin: 0 4px;
                    }
                    .viewer {
                        flex: 1;
                        position: relative;
                        overflow: hidden;
                        cursor: grab;
                        background-image: radial-gradient(var(--border) 1px, transparent 1px);
                        background-size: 20px 20px;
                    }
                    .viewer:active {
                        cursor: grabbing;
                    }
                    #diagram-wrapper {
                        position: absolute;
                        top: 0;
                        left: 0;
                        transform-origin: 0 0;
                        display: block;
                        min-width: 100%;
                        min-height: 100%;
                    }
                    .container {
                        background: rgba(255, 255, 255, 0.03);
                        border-radius: 12px;
                        padding: 40px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        display: inline-block;
                        pointer-events: auto;
                    }
                    svg {
                        display: block;
                    }
                </style>
            </head>
            <body>
                <div class="toolbar">
                    <button onclick="exportSvg()" title="Exportar a SVG">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        Export
                    </button>
                    <button onclick="showAst()" title="Ver AST">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        AST
                    </button>
                    <div class="divider"></div>
                    <button onclick="zoomIn()" title="Aumentar Zoom">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                    </button>
                    <button onclick="zoomOut()" title="Reducir Zoom">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                    </button>
                    <button onclick="resetZoom()" title="Restablecer Vista">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                            <path d="M3 3v5h5"/>
                        </svg>
                        Reset
                    </button>
                    <span id="zoom-label" style="font-size: 11px; opacity: 0.6; min-width: 40px; text-align: center;">100%</span>
                    
                    <span style="font-size: 11px; opacity: 0.4; margin-left: auto;">UMLTS v1.0 • Scroll para Zoom • Arrastrar para mover</span>
                </div>
                <div class="viewer" id="viewer">
                    <div id="diagram-wrapper">
                        <div id="diagram-container" class="container">
                            ${svg}
                        </div>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const viewer = document.getElementById('viewer');
                    const wrapper = document.getElementById('diagram-wrapper');
                    const zoomLabel = document.getElementById('zoom-label');

                    let scale = 1;
                    let translateX = 0;
                    let translateY = 0;
                    let isDragging = false;
                    let startX, startY;
                    let initialFitDone = false;

                    function autoFit() {
                        const svgElement = document.querySelector('#diagram-container svg');
                        if (!svgElement) return;

                        const containerWidth = viewer.clientWidth;
                        const containerHeight = viewer.clientHeight;
                        
                        if (containerWidth < 20 || containerHeight < 20) return;
                        
                        const viewBoxAttr = svgElement.getAttribute('viewBox');
                        if (!viewBoxAttr) return;
                        
                        const viewBox = viewBoxAttr.trim().split(/[\\s,]+/).map(Number);
                        if (viewBox.length < 4) return;
                        
                        const contentWidth = viewBox[2];
                        const contentHeight = viewBox[3];

                        const margin = 40;
                        const targetWidth = containerWidth - margin;
                        const targetHeight = containerHeight - margin;
                        
                        const scaleW = targetWidth / contentWidth;
                        const scaleH = targetHeight / contentHeight;
                        
                        scale = Math.min(scaleW, scaleH);
                        
                        if (scale > 2) scale = 2;
                        if (scale < 0.01) scale = 0.01;

                        translateX = (containerWidth - (contentWidth * scale)) / 2;
                        translateY = (containerHeight - (contentHeight * scale)) / 2;
                        
                        translateX -= viewBox[0] * scale;
                        translateY -= viewBox[1] * scale;

                        updateTransform();
                        initialFitDone = true;
                    }

                    function updateTransform() {
                        wrapper.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scale + ')';
                        // Actualizar indicador de zoom
                        zoomLabel.innerText = Math.round(scale * 100) + '%';
                    }

                    function exportSvg() {
                        const svgElement = document.querySelector('#diagram-container svg');
                        if (!svgElement) {
                            vscode.postMessage({ command: 'alert', text: 'Depuración: No se encontró <svg> en #diagram-container' });
                            return;
                        }
                        
                        const svgData = svgElement.outerHTML;
                        if (!svgData || svgData.length < 10) {
                            vscode.postMessage({ command: 'alert', text: 'Depuración: El SVG capturado está vacío o es demasiado corto.' });
                            return;
                        }

                        vscode.postMessage({
                            command: 'exportSvg',
                            svg: svgData
                        });
                    }

                    function showAst() {
                        vscode.postMessage({ command: 'showAst' });
                    }

                    // Zoom logic
                    function zoomIn() {
                        scale *= 1.2;
                        updateTransform();
                    }

                    function zoomOut() {
                        scale /= 1.2;
                        updateTransform();
                    }

                    function resetZoom() {
                        scale = 1;
                        translateX = 0;
                        translateY = 0;
                        updateTransform();
                    }

                    // Mouse Wheel Zoom
                    viewer.addEventListener('wheel', (e) => {
                        e.preventDefault();
                        const delta = e.deltaY;
                        const factor = delta > 0 ? 0.9 : 1.1;
                        
                        // Zoom hacia el puntero (opcional, por ahora simple)
                        scale *= factor;
                        if (scale < 0.1) scale = 0.1;
                        if (scale > 10) scale = 10;
                        
                        updateTransform();
                    }, { passive: false });

                    // Drag and Pan logic
                    viewer.addEventListener('mousedown', (e) => {
                        if (e.button !== 0) return; // Only left click
                        isDragging = true;
                        startX = e.clientX - translateX;
                        startY = e.clientY - translateY;
                    });

                    window.addEventListener('mousemove', (e) => {
                        if (!isDragging) return;
                        translateX = e.clientX - startX;
                        translateY = e.clientY - startY;
                        updateTransform();
                    });

                    window.addEventListener('mouseup', () => {
                        isDragging = false;
                    });

                    // Initial call
                    updateTransform();

                    // Ajuste automático al redimensionar usando ResizeObserver (más robusto)
                    const resizeObserver = new ResizeObserver(() => {
                        if (viewer.clientWidth > 0 && viewer.clientHeight > 0) {
                            autoFit();
                        }
                    });
                    resizeObserver.observe(viewer);
                    
                    // Ejecutar inmediatamente y con varios reintentos para asegurar que el SVG esté cargado
                    autoFit();
                    setTimeout(autoFit, 50);
                    setTimeout(autoFit, 200);
                    setTimeout(autoFit, 500);
                </script>
            </body>
            </html>`
  }

  private _getErrorHtml(error: string) {
    return `<!DOCTYPE html>
            <html>
            <body style="color: var(--vscode-errorForeground); padding: 20px;">
                <h3>Error de Renderizado</h3>
                <pre>${error}</pre>
            </body>
            </html>`
  }
}
