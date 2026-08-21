# Complete app sample

Пример запускает два независимых Telegraf-бота:

- default bot: echo, `@ReplyOptions` и object listener result;
- named `greeter` bot: session middleware, scenes, wizard, inline query и
  `@Reaction()` из telegraf-hardened;
- named `notifier` bot: `@InjectBot()` и `@InjectAllBots()` в
  multi-bot configuration.

## Локальная проверка

1. Скопируйте `.env.example` в `.env` и задайте test token-ы.
2. Из корня репозитория соберите библиотеку:

   ```bash
   rtk npm run build
   ```

3. Запустите sample:

   ```bash
   rtk npm exec --prefix sample/01-complete-app -- nest start
   ```

Для compile-only проверки без запуска Telegram-ботов используйте из корня:

```bash
rtk npm run build:sample
```

## Проверка telegraf-hardened

В `GreeterUpdate` обработчик `@Reaction('👍')` проверяет, что NestJS-декоратор
корректно регистрирует новый `Composer.reaction` API из telegraf-hardened.
Чтобы Telegram доставлял такие update-ы, бот должен быть администратором чата,
а `message_reaction` — присутствовать в `launchOptions.allowedUpdates`.

Sample также принимает `business_message` и использует `ctx.bizConnId` — новое
поле контекста для Business API. В `launchOptions.polling` включён
`retryOnConflict`, чтобы telegraf-hardened повторял long-polling после HTTP 409
при быстром перезапуске приложения.
