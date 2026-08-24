import type { Context, Types } from 'telegraf-hardened';

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

/** Необязательное подтверждение callback query после декларативного UI-действия. */
export interface TelegrafCallbackUiResult {
  callbackQuery?: TelegrafCallbackQueryResponse['callbackQuery'];
}

/** Результаты, возвращаемые Telegram для inline query. */
export interface TelegrafInlineQueryResponse {
  inlineQuery: {
    results: Parameters<Context['answerInlineQuery']>[0];
    extra?: Parameters<Context['answerInlineQuery']>[1];
  };
}

/** Результат, который изменяет сообщение, связанное с текущим callback update-ом. */
export interface TelegrafEditMessageResponse extends TelegrafCallbackUiResult {
  editMessage: {
    text: Parameters<Context['editMessageText']>[0];
    extra?: Parameters<Context['editMessageText']>[1];
  };
}

/** Результат, который изменяет inline keyboard текущего callback-сообщения. */
export interface TelegrafEditReplyMarkupResponse
  extends TelegrafCallbackUiResult {
  editReplyMarkup: Parameters<Context['editMessageReplyMarkup']>[0];
}

/** Результат, который удаляет сообщение, связанное с текущим update-ом. */
export interface TelegrafDeleteMessageResponse
  extends TelegrafCallbackUiResult {
  deleteMessage: true;
}

/** Допустимое значение, возвращаемое декорированным обработчиком. */
export type TelegrafListenerResult =
  | string
  | TelegrafListenerResponse
  | TelegrafCallbackQueryResponse
  | TelegrafInlineQueryResponse
  | TelegrafEditMessageResponse
  | TelegrafEditReplyMarkupResponse
  | TelegrafDeleteMessageResponse
  | false
  | null
  | undefined
  | void;
