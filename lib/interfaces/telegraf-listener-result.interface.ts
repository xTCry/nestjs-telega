import type { Types } from 'telegraf-hardened';

/** Дополнительные параметры, передаваемые Telegraf при отправке текста. */
export type TelegrafReplyExtra = Types.ExtraReplyMessage;

/** Объектный результат обработчика с текстом и параметрами отправки. */
export interface TelegrafListenerResponse {
  text: string;
  extra?: TelegrafReplyExtra;
}

/** Ответ на callback query, отображаемый Telegram после нажатия кнопки. */
export interface TelegrafCallbackQueryResponse {
  callbackQuery: {
    text?: string;
    extra?: Types.ExtraAnswerCbQuery;
  };
}

/** Результаты, возвращаемые Telegram для inline query. */
export interface TelegrafInlineQueryResponse {
  inlineQuery: {
    results: Parameters<
      import('telegraf-hardened').Context['answerInlineQuery']
    >[0];
    extra?: Parameters<
      import('telegraf-hardened').Context['answerInlineQuery']
    >[1];
  };
}

/** Допустимое значение, возвращаемое декорированным обработчиком. */
export type TelegrafListenerResult =
  | string
  | TelegrafListenerResponse
  | TelegrafCallbackQueryResponse
  | TelegrafInlineQueryResponse
  | false
  | null
  | undefined
  | void;
