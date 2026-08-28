# NestJS Telega

[![npm](https://img.shields.io/npm/v/nestjs-telega?style=flat-square)](https://www.npmjs.com/package/nestjs-telega)
[![npm downloads](https://img.shields.io/npm/dm/nestjs-telega?style=flat-square)](https://www.npmjs.com/package/nestjs-telega)
[![GitHub last commit](https://img.shields.io/github/last-commit/xtcry/nestjs-telega?style=flat-square)](https://github.com/xtcry/nestjs-telega)

<!-- [![license](https://img.shields.io/npm/l/nestjs-telega?style=flat-square)](LICENSE) -->

<img src="https://nestjs.com/img/logo-small.svg" title="NestJS logotype" align="right" width="95" height="148">

NestJS Telega integrates
[telegraf-hardened](https://github.com/telegraf-hardened/telegraf-hardened)
with [NestJS](https://github.com/nestjs/nest). It provides a NestJS module,
decorators for Telegram updates, scenes and wizards, plus integration with
guards, interceptors, filters and pipes.

> This `main` branch prepares the next default release line. The stable
> [Telegraf](https://github.com/telegraf/telegraf) implementation is maintained in the
> [telegraf branch](https://github.com/xTCry/nestjs-telega/tree/telegraf) and
> published under the npm dist-tag `telegraf`.

## Features

- Telegraf-hardened update handlers declared with NestJS decorators.
- Multiple independently configured bots in one application.
- Base scenes and wizard scenes.
- NestJS guards, interceptors, exception filters and pipes in handlers.
- Typed parameter decorators and listener return values.
- Telegraf-hardened middleware before and after discovered handlers.
- Explicit `@Update()` listener phases and priorities for reliable fallbacks.

## Install the stable Telegraf line

```bash
npm install nestjs-telega@telegraf telegraf
```

```bash
yarn add nestjs-telega@telegraf telegraf
```

Always include `@telegraf` for the current
[Telegraf](https://github.com/telegraf/telegraf)-based release line.
`telegraf` is a peer dependency and must be installed by the application.

## Install the next default line

The code in `main` uses
[telegraf-hardened](https://github.com/telegraf-hardened/telegraf-hardened)
and requires Node.js 18 or newer:

```bash
npm install nestjs-telega telegraf-hardened
```

```bash
yarn add nestjs-telega telegraf-hardened
```

## Quick start

The example below applies to the next telegraf-hardened release line.

Register the module in the root NestJS module. By default, the bot starts with
long polling when the application is initialized.

```ts
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

Create an update handler with `Tg*` decorators:

```ts
import { TgCommand, TgCtx, TgStart, TgUpdate } from 'nestjs-telega';
import type { Context } from 'telegraf-hardened';

@TgUpdate()
export class BotUpdate {
  @TgStart()
  onStart(): string {
    return 'Welcome!';
  }

  @TgCommand('chatid')
  onChatId(@TgCtx() ctx: Context): string {
    return `Your chat id is ${ctx.chat?.id}`;
  }
}
```

A string returned by a listener is sent as a reply. Handlers may also return a
`TelegrafListenerResult` when a reply needs extra options or when handling
callback and inline-query results.

The unprefixed names (`@Update()`, `@Command()`, `@Ctx()` and others) remain
available as aliases. Prefer `Tg*` names in applications that use decorators
from multiple bot transports.

## Configuration

`TelegrafModule.forRoot()` accepts a `TelegrafModuleOptions` object. Important
options include:

- `token` — Telegram bot token from BotFather.
- `botName` — unique name for a bot in a multi-bot application.
- `options` — options passed to the `Telegraf` constructor.
- `launchOptions` — telegraf-hardened launch configuration; use `false` in tests to
  avoid starting the bot.
- `include` — Nest modules containing handlers for this bot.
- `middlewaresBefore` and `middlewaresAfter` — telegraf-hardened middleware around
  discovered handlers.
- `replyOptions` — default reply options for listener return values.
- `listenerDiagnostics` — optional callback with the actual ordered update-listener
  registrations, suitable for safe startup diagnostics.

## Listener order and fallbacks

`@Update()` handlers without ordering decorators keep their discovery order.
For an explicit cross-module order, use `@TgListenerPriority()` (smaller values
are registered first) and `@TgListenerPhase('fallback')` (registered after all
normal handlers):

```ts
import {
  Next,
  On,
  TgListenerPhase,
  TgListenerPriority,
  TgUpdate,
} from 'nestjs-telega';

@TgUpdate()
export class PrivateMessagesUpdate {
  @TgListenerPriority(-10)
  @On('text')
  async handleKnownText(@Next() next: () => Promise<void>): Promise<void> {
    await next();
  }

  @TgListenerPhase('fallback')
  @On('text')
  onUnhandledText(): string {
    return 'I do not understand this message yet.';
  }
}
```

The phase and priority only control registration order; a matching earlier
handler must still call `next()` for a fallback to receive the update. The
unprefixed `@ListenerPhase()` and `@ListenerPriority()` aliases are available.
See the [listener order guide](https://xtcry.github.io/nestjs-telega/listener-order.html)
for diagnostics and full semantics.

Use `forRootAsync()` when configuration comes from another Nest provider:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telega';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
      }),
    }),
  ],
})
export class AppModule {}
```

## Multiple bots

Call `forRoot()` or `forRootAsync()` once for each bot and give every
additional bot a unique `botName`. Inject a specific instance with
`@TgInjectBot(botName)` or access the registry with `@TgInjectAllBots()`.

The [complete sample](sample/01-complete-app) demonstrates a default bot, two
named bots, scenes, a wizard, middleware and bot injection.

## Documentation and support

- [Documentation source](docs)
- [Complete sample](sample/01-complete-app)
