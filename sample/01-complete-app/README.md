# Complete app sample

Пример запускает два независимых Telegraf-бота:

- default bot: echo, `@ReplyOptions` и object listener result;
- named `greeter` bot: session middleware, scenes, wizard и inline query.

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
