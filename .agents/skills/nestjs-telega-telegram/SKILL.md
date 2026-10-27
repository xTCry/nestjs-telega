---
name: nestjs-telega-telegram
description: Develop nestjs-telega or applications using it with telegraf-hardened and Telegram Bot API.
---

# Telegram Bot API и nestjs-telega

Используй при разработке `nestjs-telega` и приложений на этой библиотеке.
Возможности Bot API, telegraf-hardened и Nest-интеграции могут различаться.

## Источники

- [nestjs-telega](https://github.com/xTCry/nestjs-telega) — API и примеры;
  в репозитории библиотеки также смотри `lib/`, `test/`, `sample/` и `docs/`.
- [Telegram Bot API](https://core.telegram.org/bots/api) и
  [telegraf-hardened](https://github.com/telegraf-hardened/telegraf-hardened) —
  контракт и исходники зависимости.

Для возможностей Bot API 10.3 в telegraf-hardened 6.1 используй
[справку](../telegram-bot-api/references/bot-api-10.md).

## Работа в проекте

- Различай возможности Bot API, методы telegraf-hardened и публичный API
  nestjs-telega. Многие методы доступны через `ctx` без нового декоратора.
- Перед добавлением декоратора проверь существующие и `@On(...)`. Учитывай
  peer-range: новый метод может отсутствовать в поддерживаемой старой версии.
- При доработке библиотеки проверяй регистрацию и типы новых обработчиков,
  соответствующие тесты, sample и документацию согласно задаче.
- В автоматических тестах библиотеки используй mocks или `launchOptions: false`,
  без реальных токенов и запуска бота. Mock-тест не подтверждает работу в Telegram.
- В приложении следуй его соглашениям и предпочтениям пользователя по тестам;
  в sample библиотеки переиспользуй существующие Nest-модули и меню.
