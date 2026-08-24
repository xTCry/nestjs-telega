# Middlewares

`nestjs-telega` supports
[`telegraf-hardened`](https://github.com/telegraf-hardened/telegraf-hardened)
middleware. Middleware run in this order:

1. `middlewaresBefore` (or the legacy `middlewares` alias);
2. scene stage and composer handlers;
3. discovered update handlers;
4. `middlewaresAfter`.

Use `middlewaresBefore` for middleware that must prepare context before the
handlers, such as session storage:

```ts
import { session } from 'telegraf-hardened';

TelegrafModule.forRoot({
  token: process.env.TELEGRAM_BOT_TOKEN!,
  middlewaresBefore: [session()],
});
```

Use `middlewaresAfter` for work that must run after discovered handlers.
Middleware must call `next()` when later middleware should receive the update.
