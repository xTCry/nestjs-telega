# Decorators and listener results

`nestjs-telega` exposes class decorators for update providers and method
decorators that correspond to [telegraf-hardened](https://github.com/telegraf-hardened/telegraf-hardened)
Composer methods: `@Command`, `@On`, `@Hears`, `@Action`, `@InlineQuery` and
others. Both unprefixed names and `Tg*` aliases are available. Prefer `Tg*`
when an application combines decorators from several bot transports.

```ts title="src/app.update.ts"
import {
  Ctx,
  Help,
  On,
  Hears,
  Start,
  Update,
} from 'nestjs-telega';
import type { Context } from 'telegraf-hardened';

@Update()
export class AppUpdate {
  @Start()
  async start(@Ctx() ctx: Context) {
    await ctx.reply('Welcome');
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await ctx.reply('Send me a sticker');
  }

  @On('sticker')
  async on(@Ctx() ctx: Context) {
    await ctx.reply('👍');
  }

  @Hears('hi')
  async hears(@Ctx() ctx: Context) {
    await ctx.reply('Hey there');
  }
}
```

## Parameter decorators

Nest parameter decorators do not change TypeScript's inferred type. Annotate
the parameter explicitly with a public type from `telegraf-hardened`; each
decorator's JSDoc also links to the appropriate type.

| Decorator | Suggested parameter type |
| --- | --- |
| `@Ctx()` | `Context` or your extended context interface |
| `@Message()` | `Message` from `telegraf-hardened/types` |
| `@Sender()` | `User` from `telegraf-hardened/types` |
| `@Next()` | `MiddlewareFn<Context>` next callback from `telegraf-hardened` |

## Reply results

A listener may return a string or `TelegrafListenerResult`. Strings are sent
as replies. Use the object form to provide Telegraf reply options; class-level
and method-level `@ReplyOptions()` values are merged with the result.

```ts
import { Command, ReplyOptions, TelegrafListenerResult, Update } from 'nestjs-telega';

@Update()
@ReplyOptions({ parse_mode: 'HTML' })
export class HelpUpdate {
  @Command('help')
  onHelp(): TelegrafListenerResult {
    return {
      text: '<b>Commands</b>\n/start — open the bot',
      extra: { disable_notification: true },
    };
  }
}
```

## Callback listener results

`TelegrafListenerResult` can update the message associated with the current
callback query without injecting `Context`. The library answers that callback
query with an empty response after a successful UI action, so Telegram stops
showing its loading indicator.

```ts
import { Action, TelegrafListenerResult, Update } from 'nestjs-telega';
import { Markup } from 'telegraf-hardened';

@Update()
export class SettingsUpdate {
  @Action('settings:enable')
  onEnable(): TelegrafListenerResult {
    return {
      editMessage: {
        text: '<b>Notifications enabled</b>',
        extra: {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            Markup.button.callback('Remove controls', 'settings:clear'),
          ]),
        },
      },
      callbackQuery: { text: 'Enabled' },
    };
  }

  @Action('settings:clear')
  onClear(): TelegrafListenerResult {
    return { editReplyMarkup: undefined };
  }

  @Action('settings:delete')
  onDelete(): TelegrafListenerResult {
    return { deleteMessage: true };
  }
}
```

`editMessage` and `editReplyMarkup` work for callback and inline-query
messages. `deleteMessage` works only where the context identifies both a chat
and a message. A UI result automatically acknowledges the callback query; add
the optional `callbackQuery` property, as in the example, to show a custom
toast or alert. The library silently ignores these result variants for an
incompatible update, just like callback and inline-query response results.

For callback buttons attached to a media message, the same result contract also
supports its caption and media:

```ts
return {
  editMessageCaption: {
    caption: '<b>Updated caption</b>',
    extra: { parse_mode: 'HTML' },
  },
};

return {
  editMessageMedia: {
    media: {
      type: 'photo',
      media: 'FILE_ID_OR_URL',
      caption: 'Replacement photo',
    },
  },
};
```

These actions use Telegraf's context-aware edit methods, so they only target
the message associated with the current callback or inline query. To edit an
arbitrary message, call `ctx.telegram.editMessageCaption()` or
`ctx.telegram.editMessageMedia()` directly with its chat and message IDs.
