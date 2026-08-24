import { defineConfig } from 'vitepress';
import type { DefaultTheme } from 'vitepress';

const repositoryUrl = 'https://github.com/xTCry/nestjs-telega';

const englishSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Guide',
    items: [
      { text: 'Introduction and installation', link: '/' },
      { text: 'Receiving updates', link: '/getting-updates' },
      { text: 'Decorators and listener results', link: '/telegraf-methods' },
      { text: 'Scenes and wizards', link: '/scenes' },
      { text: 'Async configuration', link: '/async-configuration' },
    ],
  },
  {
    text: 'Advanced',
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
];

const russianSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Руководство',
    items: [
      { text: 'Введение и установка', link: '/ru/' },
      { text: 'Получение update-ов', link: '/ru/getting-updates' },
      {
        text: 'Декораторы и результаты обработчиков',
        link: '/ru/telegraf-methods',
      },
      { text: 'Сцены и wizard-ы', link: '/ru/scenes' },
      { text: 'Асинхронная конфигурация', link: '/ru/async-configuration' },
    ],
  },
  {
    text: 'Дополнительно',
    items: [
      { text: 'Внедрение bot instance', link: '/ru/extras/bot-injection' },
      { text: 'Middleware', link: '/ru/extras/middlewares' },
      { text: 'Несколько ботов', link: '/ru/extras/multiple-bots' },
      {
        text: 'Standalone-приложения',
        link: '/ru/extras/standalone-applications',
      },
    ],
  },
];

export default defineConfig({
  title: 'NestJS Telega',
  description: 'telegraf-hardened integration for NestJS',
  base: '/nestjs-telega/',
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/' },
      { text: 'GitHub', link: repositoryUrl },
    ],
    sidebar: englishSidebar,
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: repositoryUrl }],
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/' },
          { text: 'GitHub', link: repositoryUrl },
        ],
        sidebar: englishSidebar,
        editLink: {
          pattern: `${repositoryUrl}/edit/main/docs/:path`,
          text: 'Edit this page on GitHub',
        },
        footer: {
          message: 'Released under the MIT License.',
          copyright: 'Copyright © 2026 xTCry',
        },
        outlineTitle: 'On this page',
        returnToTopLabel: 'Return to top',
        sidebarMenuLabel: 'Menu',
        langMenuLabel: 'Change language',
      },
    },
    ru: {
      label: 'Русский',
      lang: 'ru',
      link: '/ru/',
      title: 'NestJS Telega',
      description: 'Интеграция telegraf-hardened для NestJS',
      themeConfig: {
        nav: [
          { text: 'Руководство', link: '/ru/' },
          { text: 'GitHub', link: repositoryUrl },
        ],
        sidebar: russianSidebar,
        editLink: {
          pattern: `${repositoryUrl}/edit/main/docs/:path`,
          text: 'Редактировать страницу на GitHub',
        },
        footer: {
          message: 'Опубликовано по лицензии MIT.',
          copyright: 'Copyright © 2026 xTCry',
        },
        outlineTitle: 'На этой странице',
        returnToTopLabel: 'Наверх',
        sidebarMenuLabel: 'Меню',
        langMenuLabel: 'Сменить язык',
      },
    },
  },
});
