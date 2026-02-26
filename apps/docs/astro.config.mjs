import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import { remarkUmlts } from './src/plugins/remark-umlts.mjs'

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [remarkUmlts],
  },
  integrations: [
    starlight({
      title: 'UMLTS Suite',
      customCss: ['./src/styles/custom.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/thotluna/umlts-suite' },
      ],
      sidebar: [
        {
          label: 'UMLTS DSL',
          items: [
            { label: '¿Qué es UMLTS?', slug: 'dsl/introduction' },
            { label: 'Guía del Lenguaje', slug: 'dsl/guide' },
            { label: 'Especificación UML', slug: 'dsl/spec' },
          ],
        },
        {
          label: 'Motor (Engine)',
          items: [
            { label: 'API Reference', slug: 'engine/api' },
            { label: 'Plugin TypeScript', slug: 'engine/typescript' },
          ],
        },
        {
          label: 'Renderizador',
          items: [{ label: 'API Reference', slug: 'renderer/api' }],
        },
        {
          label: 'Herramientas',
          items: [
            { label: 'Extensión VS Code', slug: 'ecosystem/vscode' },
            { label: 'Blueprint (Ingeniería Inversa)', slug: 'ecosystem/blueprint' },
          ],
        },
      ],
    }),
  ],
})
