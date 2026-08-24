# Несколько ботов

Регистрируйте каждый instance с уникальным `botName`. У каждого именованного
bot свой экземпляр Telegraf, параметры, stage сцен, listener explorer и
shutdown hook.

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telega';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      botName: 'cat',
      useFactory: (configService: ConfigService) => ({
        token: configService.getOrThrow<string>('CAT_BOT_TOKEN'),
      }),
      inject: [ConfigService],
    }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      botName: 'dog',
      useFactory: (configService: ConfigService) => ({
        token: configService.getOrThrow<string>('DOG_BOT_TOKEN'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

:::warning
Допускается только один default bot. У именованных bot не должны повторяться
имена.
:::

Внедрите именованный bot через `@InjectBot('name')`:

```ts
import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telega';
import { Context, Telegraf } from 'telegraf-hardened';

@Injectable()
export class EchoService {
  constructor(@InjectBot('cat') private readonly catBot: Telegraf<Context>) {}
}
```

В factory provider используйте `getBotToken('name')`:

```ts
{
  provide: CatsService,
  useFactory: (catBot: Telegraf<Context>) => new CatsService(catBot),
  inject: [getBotToken('cat')],
}
```

По умолчанию модуль находит handlers во всём приложении. Ограничить discovery
выбранными модулями позволяет `include`:

```ts
TelegrafModule.forRootAsync({
  imports: [ConfigModule],
  botName: 'cat',
  useFactory: (configService: ConfigService) => ({
    token: configService.getOrThrow<string>('CAT_BOT_TOKEN'),
    include: [CatsModule],
  }),
  inject: [ConfigService],
});
```
