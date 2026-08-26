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

Для callback-кнопок на media-сообщении этот же контракт поддерживает изменение
caption и самого media:

```ts
return {
  editMessageCaption: {
    caption: '<b>Обновлённый caption</b>',
    extra: { parse_mode: 'HTML' },
  },
};

return {
  editMessageMedia: {
    media: {
      type: 'photo',
      media: 'FILE_ID_OR_URL',
      caption: 'Новое фото',
    },
  },
};
```

Эти действия используют context-aware методы Telegraf и поэтому затрагивают
только сообщение текущего callback или inline query. Чтобы изменить произвольное
сообщение, вызовите `ctx.telegram.editMessageCaption()` или
`ctx.telegram.editMessageMedia()` напрямую с его chat и message ID.

## Pagination и cache inline query

`inlineQuery.extra` без изменений передаётся в `answerInlineQuery()` Telegraf.
Для pagination используйте Telegram-поле `next_offset`, а cache-политику
выбирайте исходя из того, публичен результат или зависит от пользователя:

```ts
@InlineQuery(/.*/)
onInlineQuery(@Ctx() ctx: Context): TelegrafListenerResult {
  const page = Number(ctx.inlineQuery?.offset || '0') || 0;
  const query = ctx.inlineQuery?.query.trim() || '';

  return {
    inlineQuery: {
      results: createSearchResults(query, page),
      extra: {
        next_offset: String(page + 1),
        // Для неизменяемого каталога без query допустим более долгий cache.
        cache_time: query ? 30 : 300,
        // Укажите true, если результат зависит от Telegram-пользователя.
        is_personal: false,
      },
    },
  };
}
```

Намеренно нет library-level режима «auto cache»: только приложение знает,
насколько изменчивы его данные и можно ли делиться результатом между
пользователями. Telegram принимает не больше 50 результатов за ответ;
используйте стабильный формат offset и верните пустой `next_offset`, когда
страницы закончились.
