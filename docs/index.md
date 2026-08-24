# NestJS Telega

`nestjs-telega` integrates
[telegraf-hardened](https://github.com/telegraf-hardened/telegraf-hardened)
with NestJS. It discovers decorated providers, connects their handlers to a
Telegraf bot, and preserves NestJS guards, pipes, interceptors and exception
filters.

It supports ordinary update handlers, scenes and wizards, default reply
options, callback/inline-query results, and multiple isolated bot instances.

## Installation

The default package line uses `telegraf-hardened` and requires Node.js 18 or
newer:

```bash
npm install nestjs-telega telegraf-hardened
```

```bash
yarn add nestjs-telega telegraf-hardened
```

The legacy [Telegraf](https://github.com/telegraf/telegraf)-based line lives in
the [telegraf branch](https://github.com/xTCry/nestjs-telega/tree/telegraf)
and is installed explicitly with the `telegraf` dist-tag:

```bash
npm install nestjs-telega@telegraf telegraf
```

```bash
yarn add nestjs-telega@telegraf telegraf
```

## Quick start

Import `TelegrafModule` once in the root module. Keep the token in an
environment variable or configuration provider rather than source code.

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

Create an update provider. A returned string is sent as a reply; use `@Ctx()`
when the handler needs the full Telegraf context.

```ts title="src/bot.update.ts"
import { Command, Ctx, Start, Update } from 'nestjs-telega';
import type { Context } from 'telegraf-hardened';

@Update()
export class BotUpdate {
  @Start()
  onStart(): string {
    return 'Welcome!';
  }

  @Command('chatid')
  onChatId(@Ctx() ctx: Context): string {
    return `Your chat id is ${ctx.chat?.id}`;
  }
}
```

Continue with [receiving updates](/getting-updates),
[decorators and listener results](/telegraf-methods), or
[asynchronous configuration](/async-configuration).
