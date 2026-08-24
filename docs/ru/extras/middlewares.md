# Middleware

`nestjs-telega` поддерживает middleware из
[`telegraf-hardened`](https://github.com/telegraf-hardened/telegraf-hardened).
Они выполняются в следующем порядке:

1. `middlewaresBefore` (или устаревший alias `middlewares`);
2. stage сцен и composer handlers;
3. найденные update handlers;
4. `middlewaresAfter`.

Используйте `middlewaresBefore` для middleware, которые готовят context до
обработчиков — например, для session storage:

```ts
import { session } from 'telegraf-hardened';

TelegrafModule.forRoot({
  token: process.env.TELEGRAM_BOT_TOKEN!,
  middlewaresBefore: [session()],
});
```

`middlewaresAfter` предназначен для логики после найденных обработчиков.
Вызывайте `next()`, когда update должен дойти до последующего middleware.
