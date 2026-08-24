# Получение update-ов

`TelegrafModule.forRoot()` по умолчанию запускает long polling. В тестах и
других окружениях, где bot не должен подключаться к Telegram, укажите
`launchOptions: false`.

## Long polling

Для long polling не нужна дополнительная настройка веб-сервера.

### Восстановление после конфликта polling

`telegraf-hardened` может повторить long polling после HTTP 409. Это полезно,
когда приложение перезапускается до освобождения предыдущего подключения:

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

## Webhook

Для webhook получите экземпляр Telegraf в `main.ts` через `getBotToken()`:

```ts
import { getBotToken } from 'nestjs-telega';

const bot = app.get(getBotToken());
```

Подключите middleware Telegraf к HTTP adapter:

```ts
app.use(bot.webhookCallback('/secret-path'));
```

Укажите тот же путь и публичный домен в `launchOptions`:

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

В production используйте HTTPS и убедитесь, что Telegram может обратиться к
указанному домену. Для именованного bot передайте такое же имя в
`getBotToken('name')`.
