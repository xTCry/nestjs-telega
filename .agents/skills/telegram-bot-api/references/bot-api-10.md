# Bot API 10.3 и telegraf-hardened 6.1

Проверено по исходникам `telegraf-hardened` v6.1.0 и `types` 10.3.1.
Уточняй актуальность в [Bot API](https://core.telegram.org/bots/api) и
[релизе 6.1.0](https://github.com/telegraf-hardened/telegraf-hardened/releases/tag/v6.1.0).

## Возможности

- Rich messages: `ctx.replyWithRichMessage({ html: '...' })`, структурированные
  блоки, `ctx.sendRichMessageDraft(...)` и rich-редактирование. Блок `thinking`
  допустим только в drafts, в том числе вложенных.
- Ephemeral messages: `ctx.reply(text, { ephemeral_message_parameters: { receiver_user_id } })`;
  видны одному получателю. Обычный `message_id` равен
  0; для edit/delete нужен `ephemeral_message_id` и ID получателя. Context
  helpers принимают `receiverUserId` явно; он не всегда равен текущему `from.id`.
  Ответ на ephemeral message тоже должен быть ephemeral.
- Live photo: `ctx.replyWithLivePhoto(photo, livePhoto)`; оба аргумента могут
  быть upload или file ID. В media group имена полей отличаются: `media` —
  видео, `photo` — изображение.
- Guest mode: `ctx.answerGuestQuery(result)` принимает `InlineQueryResult`,
  возвращает `SentGuestMessage`; `guest_message` не задаёт обычный `ctx.chat`.
- Управление managed bots, media в вариантах опросов, удаление реакций,
  `ctx.purchasedPaidMedia`, `ctx.answerChatJoinRequestQuery(...)` и
  `ctx.sendChatJoinRequestWebApp(...)`. Детали сигнатур и права сверяй с API.

## Типизация 6.1

`ctx.editMessageText` принимает либо текст с обычными options, либо `undefined`
и options с `rich_message`; оба варианта вместе недопустимы. Для обычных
параметров может понадобиться `Omit<Convenience.ExtraEditMessageText, 'rich_message'>`;
для rich-варианта сохраняй точный тип поля через `satisfies`.

`ReplyParameters` — union: нужен `message_id` или `ephemeral_message_id`,
пустой объект недопустим. Его нельзя расширить через `interface extends`;
используй пересечение. Учитывай, что в зависимостях потребителя может быть
версия 6.0 с прежними типами.

Сигнатуры смотри в исходниках
[telegraf-hardened](https://github.com/telegraf-hardened/telegraf-hardened),
структуры API — в [репозитории типов](https://github.com/telegraf-hardened/types).
