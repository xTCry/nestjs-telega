# Telegram Bot API 10.3

`nestjs-telega` supplies NestJS integration; Telegram methods and types come
from [telegraf-hardened](https://github.com/telegraf-hardened/telegraf-hardened).
Version 6.1 adds Bot API 10.3, including rich messages, ephemeral messages,
live photos, guest queries and reaction moderation. See the
[6.1 release notes](https://github.com/telegraf-hardened/telegraf-hardened/releases/tag/v6.1.0)
for the complete list and the [official Bot API](https://core.telegram.org/bots/api)
for availability and limitations.

The package accepts `telegraf-hardened` `^6.0.0`; install **6.1 or newer** to
use the 10.3 methods and types below. Existing applications using 6.0 need
not update unless they use these features.

```bash
npm install telegraf-hardened@^6.1.0
```

```bash
yarn add telegraf-hardened@^6.1.0
```

## Rich messages

Use the hardened context directly in a Nest handler. Rich messages can use
HTML, Markdown or structured blocks. Rich drafts also support `thinking`
blocks; ordinary messages do not.

```ts
import { Action, Command, Ctx, Update } from 'nestjs-telega';
import { Markup } from 'telegraf-hardened';
import type { Context } from 'telegraf-hardened';

@Update()
export class RichUpdate {
  @Command('rich')
  async send(@Ctx() ctx: Context): Promise<void> {
    await ctx.replyWithRichMessage(
      { html: '<h1>Welcome</h1><p>A <b>rich</b> message.</p>' },
      Markup.inlineKeyboard([Markup.button.callback('Update', 'rich:update')]),
    );
  }

  @Action('rich:update')
  async edit(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery();
    await ctx.editMessageText(undefined, {
      rich_message: { html: '<h1>Updated</h1><p>New content.</p>' },
    });
  }
}
```

The declarative `TelegrafListenerResult.editMessage` currently accepts text
edits only. For rich edits use `ctx.editMessageText()` as above. Always escape
untrusted values before inserting them into HTML.

## Ephemeral messages

An ephemeral message is visible only to its specified recipient. This sample
uses a group where the bot is an administrator; it explains the restriction in
a private chat or when Telegram reports `BOT_NOT_ADMIN`:

```ts
import { TelegramError } from 'telegraf-hardened';

@Command('ephemeral')
async sendEphemeral(@Ctx() ctx: Context): Promise<void> {
  if (!ctx.from) return;
  if (ctx.chat?.type === 'private') {
    await ctx.reply('Try this in a group where the bot is an administrator.');
    return;
  }
  try {
    await ctx.reply('Only you can see this message.', {
      ephemeral_message_parameters: { receiver_user_id: ctx.from.id },
    });
  } catch (error) {
    if (error instanceof TelegramError && error.description.includes('BOT_NOT_ADMIN')) {
      await ctx.reply('Make the bot an administrator in this group and try again.');
      return;
    }
    throw error;
  }
}
```

Ephemeral messages report `message_id: 0`. Editing and deleting require the
`ephemeral_message_id` and the **recipient's** user ID, which need not be the
current update's sender. The context helpers can obtain the ephemeral ID from
the current update; pass the recipient explicitly. Replies to ephemeral messages
must themselves be ephemeral. Validate the target and follow Telegram's
documented time limits and permissions.

The sample offers `/rich` and `/ephemeral`, including edit/delete buttons.
Their automated tests use a fake API; live Telegram behaviour and client
rendering have not yet been confirmed.

## Type changes in 6.1

`editMessageText` accepts either text with text-edit options, or `undefined`
with `rich_message`, never both. For a variable with text-edit options, exclude
the rich field rather than using the broad union:

```ts
import type { Convenience, ReplyParameters } from 'telegraf-hardened/types';

const options: Omit<Convenience.ExtraEditMessageText, 'rich_message'> = {
  parse_mode: 'HTML',
};
await ctx.editMessageText('<b>Updated</b>', options);

const reply = { message_id: 42 } satisfies ReplyParameters;
await ctx.reply('Reply', { reply_parameters: reply });
```

`ReplyParameters` is a union requiring `message_id` or
`ephemeral_message_id`; `{}` is no longer valid. Use an intersection rather
than `interface extends` to add fields. These changes can surface when an
application upgrades from 6.0 even though both versions satisfy the peer range.
