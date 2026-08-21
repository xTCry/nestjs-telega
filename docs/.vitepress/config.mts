import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'NestJS Telega',
  description: 'Telegraf integration for NestJS',
  base: '/nestjs-telega/',
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/' },
      {
        text: 'GitHub',
        link: 'https://github.com/xTCry/nestjs-telega',
      },
    ],
    sidebar: [
      {
        text: 'Getting started',
        items: [
          { text: 'Installation', link: '/' },
          { text: 'Getting updates', link: '/getting-updates' },
          { text: 'Telegraf methods', link: '/telegraf-methods' },
          { text: 'Async configuration', link: '/async-configuration' },
        ],
      },
      {
        text: 'Extras',
        items: [
          { text: 'Bot injection', link: '/extras/bot-injection' },
          { text: 'Middlewares', link: '/extras/middlewares' },
          { text: 'Multiple bots', link: '/extras/multiple-bots' },
          {
            text: 'Standalone applications',
            link: '/extras/standalone-applications',
          },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/xTCry/nestjs-telega' },
    ],
    editLink: {
      pattern: 'https://github.com/xTCry/nestjs-telega/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 xTCry',
    },
  },
});
