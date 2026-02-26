// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'UMLTS Suite',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/thotluna/umlts-suite' },
      ],
      sidebar: [
        {
          label: 'Introducción',
          autogenerate: { directory: 'introduction' },
        },
        {
          label: 'UMLTS DSL',
          autogenerate: { directory: 'dsl' },
        },
        {
          label: 'Arquitectura',
          autogenerate: { directory: 'architecture' },
        },
        {
          label: 'Ecosistema',
          autogenerate: { directory: 'ecosystem' },
        },
      ],
    }),
  ],
})
