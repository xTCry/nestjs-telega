# Receiving updates

`TelegrafModule.forRoot()` starts long polling by default. Set
`launchOptions: false` in tests or other environments where the bot must not
connect to Telegram.

## Long polling

Long polling needs no additional web server configuration.

### Recovery after a polling conflict

`telegraf-hardened` can retry long polling after an HTTP 409 conflict. This is
useful when an application restarts before Telegram has released the previous
polling connection:

```ts
TelegrafModule.forRoot({
  token: process.env.TELEGRAM_BOT_TOKEN!,
  launchOptions: {
    polling: {
      retryOnConflict: true,
    },
  },
});
```

## Webhooks

For webhooks, obtain the Telegraf instance in `main.ts` with `getBotToken()`:

```ts
import { getBotToken } from 'nestjs-telega';

const bot = app.get(getBotToken());
```

Attach Telegraf's webhook middleware to your HTTP adapter:

```ts
app.use(bot.webhookCallback('/secret-path'));
```

Configure the same path and public domain in `launchOptions`:

```ts
TelegrafModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    token: configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
    launchOptions: {
      webhook: {
        domain: 'https://example.com',
        path: '/secret-path',
      },
    },
  }),
  inject: [ConfigService],
});
```

Use HTTPS in production and ensure that Telegram can reach the configured
domain. For a named bot, pass the same name to `getBotToken('name')`.
