import type { Types } from 'telegraf';

/** Дополнительные параметры, передаваемые Telegraf при отправке текста. */
export type TelegrafReplyExtra = Types.ExtraReplyMessage;

/** Объектный результат обработчика с текстом и параметрами отправки. */
export interface TelegrafListenerResponse {
  text: string;
  extra?: TelegrafReplyExtra;
}

/** Допустимое значение, возвращаемое декорированным обработчиком. */
export type TelegrafListenerResult =
  | string
  | TelegrafListenerResponse
  | false
  | null
  | undefined
  | void;
