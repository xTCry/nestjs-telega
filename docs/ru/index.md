# NestJS Telega

`nestjs-telega` интегрирует
[telegraf-hardened](https://github.com/telegraf-hardened/telegraf-hardened) с
NestJS. Библиотека находит providers с декораторами, подключает их обработчики
к Telegraf bot и сохраняет NestJS guards, pipes, interceptors и exception
filters.

Поддерживаются обычные обработчики update-ов, сцены и wizard-ы, общие параметры
reply, результаты callback/inline query и несколько изолированных bot instance.

## Установка

Основная линия пакета использует `telegraf-hardened` и требует Node.js 18 или
новее:

```bash
npm install nestjs-telega telegraf-hardened
```

```bash
yarn add nestjs-telega telegraf-hardened
```

Прежняя линия на [Telegraf](https://github.com/telegraf/telegraf) находится в
[ветке telegraf](https://github.com/xTCry/nestjs-telega/tree/telegraf) и
устанавливается с npm-тегом `telegraf`:

```bash
npm install nestjs-telega@telegraf telegraf
```

```bash
yarn add nestjs-telega@telegraf telegraf
```

## Быстрый старт

Один раз импортируйте `TelegrafModule` в корневой модуль. Храните токен в
переменной окружения или configuration provider, а не в исходном коде.

```ts title="src/app.module.ts"
import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telega';

import { BotUpdate } from './bot.update';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN!,
    }),
  ],
  providers: [BotUpdate],
})
export class AppModule {}
```

Создайте provider обработчиков. Возвращённая строка будет отправлена как reply;
если нужен полный контекст Telegraf, используйте `@Ctx()`.

```ts title="src/bot.update.ts"
import { Command, Ctx, Start, Update } from 'nestjs-telega';
import type { Context } from 'telegraf-hardened';

@Update()
export class BotUpdate {
  @Start()
  onStart(): string {
    return 'Добро пожаловать!';
  }

  @Command('chatid')
  onChatId(@Ctx() ctx: Context): string {
    return `ID чата: ${ctx.chat?.id}`;
  }
}
```

Далее: [получение update-ов](/ru/getting-updates),
[декораторы и результаты обработчиков](/ru/telegraf-methods) или
[асинхронная конфигурация](/ru/async-configuration).
