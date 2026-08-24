# Декораторы и результаты обработчиков

`nestjs-telega` предоставляет class decorators для providers обработчиков и
method decorators, соответствующие методам `Composer` из
[telegraf-hardened](https://github.com/telegraf-hardened/telegraf-hardened):
`@Command`, `@On`, `@Hears`, `@Action`, `@InlineQuery` и другие.

Доступны обычные имена и alias-ы с префиксом `Tg`. Если приложение сочетает
декораторы нескольких bot transport-ов, предпочтительнее `Tg*`-имена.

```ts title="src/app.update.ts"
import { Ctx, Hears, Help, On, Start, Update } from 'nestjs-telega';
import type { Context } from 'telegraf-hardened';

@Update()
export class AppUpdate {
  @Start()
  async start(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply('Добро пожаловать');
  }

  @Help()
  async help(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply('Отправьте мне sticker');
  }

  @On('sticker')
  async onSticker(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply('👍');
  }

  @Hears('привет')
  async onGreeting(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply('Привет!');
  }
}
```

## Параметрические декораторы

Nest parameter decorators не меняют вывод типов TypeScript. Указывайте тип
параметра явно, используя публичные типы `telegraf-hardened`; JSDoc каждого
декоратора также содержит ссылку на подходящий тип.

| Декоратор | Рекомендуемый тип параметра |
| --- | --- |
| `@Ctx()` | `Context` или собственный расширенный context interface |
| `@Message()` | `Message` из `telegraf-hardened/types` |
| `@Sender()` | `User` из `telegraf-hardened/types` |
| `@Next()` | next callback `MiddlewareFn<Context>` из `telegraf-hardened` |

## Результаты reply

Обработчик может вернуть строку или `TelegrafListenerResult`. Строка
отправляется как reply. Объектная форма позволяет передать параметры Telegraf;
значения `@ReplyOptions()` на классе и методе объединяются с результатом.

```ts
import {
  Command,
  ReplyOptions,
  TelegrafListenerResult,
  Update,
} from 'nestjs-telega';

@Update()
@ReplyOptions({ parse_mode: 'HTML' })
export class HelpUpdate {
  @Command('help')
  onHelp(): TelegrafListenerResult {
    return {
      text: '<b>Команды</b>\n/start — открыть bot',
      extra: { disable_notification: true },
    };
  }
}
```

## Результаты callback-обработчика

`TelegrafListenerResult` может изменить сообщение, связанное с текущим
callback query, без внедрения `Context`. После успешного UI-действия библиотека
автоматически подтверждает callback query, чтобы Telegram убрал индикатор
загрузки у кнопки.

```ts
import { Action, TelegrafListenerResult, Update } from 'nestjs-telega';
import { Markup } from 'telegraf-hardened';

@Update()
export class SettingsUpdate {
  @Action('settings:enable')
  onEnable(): TelegrafListenerResult {
    return {
      editMessage: {
        text: '<b>Уведомления включены</b>',
        extra: {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            Markup.button.callback('Убрать кнопки', 'settings:clear'),
          ]),
        },
      },
      callbackQuery: { text: 'Включено' },
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

`editMessage` и `editReplyMarkup` работают с callback и inline-query
сообщениями. `deleteMessage` работает, когда context содержит и chat, и
message. Чтобы показать собственный toast или alert, добавьте необязательное
поле `callbackQuery`, как в примере. Для несовместимого update библиотека
безопасно пропускает такой результат.
