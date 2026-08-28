# Listener order

`@Update()` handlers are discovered from NestJS providers. In Telegraf, the
registration order is the middleware execution order. A matching earlier
handler that does not call `next()` stops later handlers.

Handlers without order decorators preserve the existing discovery order. Use
the following optional decorators only when an order must be explicit across
modules.

## Phase and priority

`@ListenerPhase()` assigns a phase. `normal` is the default; `fallback` is
always registered after every `normal` handler. `@ListenerPriority()` orders
handlers within a phase: smaller values are registered first; its default is
`0`. Equal values retain discovery order.

```ts
import {
  Ctx,
  ListenerPhase,
  ListenerPriority,
  Next,
  On,
  Update,
} from 'nestjs-telega';
import type { Context } from 'telegraf-hardened';

@Update()
export class PrivateMessagesUpdate {
  @ListenerPriority(-10)
  @On('text')
  async handleKnownText(
    @Ctx() ctx: Context,
    @Next() next: () => Promise<void>,
  ): Promise<void> {
    if (ctx.message.text === 'known') {
      await ctx.reply('Handled');
      return;
    }

    await next();
  }

  @ListenerPhase('fallback')
  @On('text')
  async handleUnhandledText(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply('I do not understand this message yet.');
  }
}
```

The effective registration order is phase → priority → discovery order.
`fallback` does not force prior handlers to call `next()`: a handler that ends
the chain still prevents the fallback from running.

This ordering applies only to `@Update()` handlers. `@Composer()` handlers run
before the scene stage, and `@WizardStep()` ordering remains controlled by its
numeric step.

## Registration diagnostics

Pass an optional callback to inspect the actual ordered registrations without
reading Telegraf internals:

```ts
TelegrafModule.forRoot({
  token: process.env.TELEGRAM_BOT_TOKEN!,
  listenerDiagnostics: {
    onRegistered(listener) {
      console.info(
        `#${listener.registrationIndex} ${listener.phase} ` +
          `${listener.moduleName}.${listener.providerName}.` +
          `${listener.methodName} -> ${listener.listenerMethod}`,
      );
    },
  },
});
```

The descriptor includes module, provider, method, decorator arguments and both
indices. It never includes a bot token, an update payload or middleware
callback.
