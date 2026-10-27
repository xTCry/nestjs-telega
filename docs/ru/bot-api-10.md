# Telegram Bot API 10.3

`nestjs-telega` предоставляет интеграцию с NestJS, а методы и типы Telegram —
[telegraf-hardened](https://github.com/telegraf-hardened/telegraf-hardened).
Версия 6.1 поддерживает Bot API 10.3: rich и ephemeral messages, live photos,
guest queries и управление реакциями. Полный список — в
[описании релиза 6.1](https://github.com/telegraf-hardened/telegraf-hardened/releases/tag/v6.1.0),
ограничения и доступность — в [официальном Bot API](https://core.telegram.org/bots/api).

Peer dependency допускает `telegraf-hardened` `^6.0.0`, но для примеров ниже
нужна версия **6.1 или новее**. Если приложение использует 6.0 и не нуждается
в этих возможностях, обязательного обновления нет.

```bash
npm install telegraf-hardened@^6.1.0
```

```bash
yarn add telegraf-hardened@^6.1.0
```

## Rich messages

Методы hardened доступны прямо через context в Nest-обработчике. Rich message
поддерживает HTML, Markdown и структурированные блоки; блоки `thinking`
допустимы только в rich drafts.

```ts
import { Action, Command, Ctx, Update } from 'nestjs-telega';
import { Markup } from 'telegraf-hardened';
import type { Context } from 'telegraf-hardened';

@Update()
export class RichUpdate {
  @Command('rich')
  async send(@Ctx() ctx: Context): Promise<void> {
    await ctx.replyWithRichMessage(
      { html: '<h1>Привет!</h1><p>Это <b>rich</b> message.</p>' },
      Markup.inlineKeyboard([
        Markup.button.callback('Обновить', 'rich:update'),
      ]),
    );
  }

  @Action('rich:update')
  async edit(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery();
    await ctx.editMessageText(undefined, {
      rich_message: { html: '<h1>Обновлено</h1><p>Новый текст.</p>' },
    });
  }
}
```

Декларативный `TelegrafListenerResult.editMessage` сейчас принимает только
текст. Для rich-редактирования используйте `ctx.editMessageText()`. Перед
вставкой внешних значений в HTML обязательно экранируйте их.

## Ephemeral messages

Временное сообщение видно только указанному получателю. В примере команда
используется в группе, где бот является администратором; для личного чата и
ошибки Telegram `BOT_NOT_ADMIN` выводится подсказка:

```ts
import { TelegramError } from 'telegraf-hardened';

@Command('ephemeral')
async sendEphemeral(@Ctx() ctx: Context): Promise<void> {
  if (!ctx.from) return;
  if (ctx.chat?.type === 'private') {
    await ctx.reply('Попробуйте в группе, где бот является администратором.');
    return;
  }
  try {
    await ctx.reply('Это сообщение видно только вам.', {
      ephemeral_message_parameters: { receiver_user_id: ctx.from.id },
    });
  } catch (error) {
    if (error instanceof TelegramError && error.description.includes('BOT_NOT_ADMIN')) {
      await ctx.reply('Назначьте бота администратором группы и повторите.');
      return;
    }
    throw error;
  }
}
```

У такого сообщения `message_id: 0`. Для редактирования и удаления нужны
`ephemeral_message_id` и ID **получателя**: он не обязательно совпадает с
отправителем текущего update. Context helpers могут взять ephemeral ID из
update, а получателя нужно передать явно. Ответ на ephemeral message тоже
должен быть ephemeral. Проверяйте адресата, временные ограничения и права
по документации Telegram.

В sample доступны `/rich` и `/ephemeral` с кнопками редактирования и удаления.
Автотесты используют fake API; работа и отображение в реальном Telegram пока
не подтверждены.

## Изменения типов в 6.1

`editMessageText` принимает либо текст с текстовыми options, либо `undefined`
и `rich_message`, но не оба значения одновременно. Для переменной с обычными
options исключите rich-поле из широкого union-типа:

```ts
import type { Convenience, ReplyParameters } from 'telegraf-hardened/types';

const options: Omit<Convenience.ExtraEditMessageText, 'rich_message'> = {
  parse_mode: 'HTML',
};
await ctx.editMessageText('<b>Обновлено</b>', options);

const reply = { message_id: 42 } satisfies ReplyParameters;
await ctx.reply('Ответ', { reply_parameters: reply });
```

`ReplyParameters` — union с обязательным `message_id` или
`ephemeral_message_id`; `{}` больше не подходит. Для добавления полей
используйте пересечение типов вместо `interface extends`. Эти изменения могут
проявиться при обновлении с 6.0, хотя обе версии входят в peer range.
