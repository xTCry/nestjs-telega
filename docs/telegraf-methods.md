# Telegraf methods
Each [telegraf-hardened](https://github.com/telegraf-hardened/telegraf-hardened)
instance method has own decorator in `nestjs-telega` package. The name of the
decorator corresponds to the name of the framework method. For example
`@Hears`, `@On`, `@Action` and so on.

Now let's try simple example:

```typescript title="src/app.update.ts"
import {
  BusinessConnection,
  BusinessMessage,
  Update,
  Ctx,
  Start,
  Help,
  On,
  Hears,
} from 'nestjs-telega';
import type { Context } from 'telegraf-hardened';
import type { Update as TelegramUpdate } from 'telegraf-hardened/types';

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
| `@BusinessConnection()` | `BusinessConnection` from `telegraf-hardened/types` |
| `@BusinessMessage()` | `Update.BusinessMessageUpdate['business_message']` |
| `@EditedBusinessMessage()` | `Update.EditedBusinessMessageUpdate['edited_business_message']` |
| `@DeletedBusinessMessages()` | `BusinessMessagesDeleted` from `telegraf-hardened/types` |
| `@MessageReaction()` | `MessageReactionUpdated` from `telegraf-hardened/types` |
| `@MessageReactionCount()` | `MessageReactionCountUpdated` from `telegraf-hardened/types` |

For example, a Telegram Business handler can avoid manually reading fields from
`ctx`:

```ts
import { BusinessMessage, On, Update } from 'nestjs-telega';
import type { Update as TelegramUpdate } from 'telegraf-hardened/types';

@Update()
export class BusinessUpdate {
  @On('business_message')
  onMessage(
    @BusinessMessage()
    message: TelegramUpdate.BusinessMessageUpdate['business_message'],
  ): void {
    console.log(message.business_connection_id);
  }
}
```
