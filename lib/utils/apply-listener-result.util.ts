import type { Context, Types } from 'telegraf-hardened';

import type {
  TelegrafCallbackQueryResponse,
  TelegrafDeleteMessageResponse,
  TelegrafEditMessageResponse,
  TelegrafEditReplyMarkupResponse,
  TelegrafInlineQueryResponse,
  TelegrafListenerResponse,
  TelegrafListenerResult,
  TelegrafReplyExtra,
} from '../interfaces';

/** Применяет return value listener-а, только когда context поддерживает reply. */
export async function applyListenerResult(
  ctx: Context,
  result: TelegrafListenerResult,
  replyOptions: TelegrafReplyExtra,
): Promise<void> {
  if (isTelegrafCallbackQueryResponse(result)) {
    await applyCallbackQueryResult(ctx, result);
    return;
  }

  if (isTelegrafInlineQueryResponse(result)) {
    await applyInlineQueryResult(ctx, result);
    return;
  }

  if (isTelegrafEditMessageResponse(result)) {
    await applyEditMessageResult(ctx, result);
    return;
  }

  if (isTelegrafEditReplyMarkupResponse(result)) {
    await applyEditReplyMarkupResult(ctx, result);
    return;
  }

  if (isTelegrafDeleteMessageResponse(result)) {
    await applyDeleteMessageResult(ctx);
    return;
  }

  if (typeof result === 'string') {
    await replyIfPossible(ctx, result, replyOptions);
    return;
  }

  if (!isTelegrafListenerResponse(result)) {
    return;
  }

  await replyIfPossible(
    ctx,
    result.text,
    mergeReplyOptions(replyOptions, result.extra),
  );
}

/** Не пытается отправить message response из update-а без доступного чата. */
async function replyIfPossible(
  ctx: Context,
  text: string,
  extra: TelegrafReplyExtra,
): Promise<void> {
  if (!ctx.chat) {
    return;
  }

  await ctx.reply(text, extra);
}

async function applyCallbackQueryResult(
  ctx: Context,
  result: TelegrafCallbackQueryResponse,
): Promise<void> {
  if (!ctx.callbackQuery) {
    return;
  }

  await ctx.answerCbQuery(
    result.callbackQuery.text,
    result.callbackQuery.extra,
  );
}

async function applyInlineQueryResult(
  ctx: Context,
  result: TelegrafInlineQueryResponse,
): Promise<void> {
  if (!ctx.inlineQuery) {
    return;
  }

  await ctx.answerInlineQuery(
    result.inlineQuery.results,
    result.inlineQuery.extra,
  );
}

/** Изменение возможно лишь для сообщения, связанного с callback или inline query. */
async function applyEditMessageResult(
  ctx: Context,
  result: TelegrafEditMessageResponse,
): Promise<void> {
  if (!canEditCurrentMessage(ctx)) {
    return;
  }

  await ctx.editMessageText(result.editMessage.text, result.editMessage.extra);
  await answerCallbackQueryIfPresent(ctx);
}

async function applyEditReplyMarkupResult(
  ctx: Context,
  result: TelegrafEditReplyMarkupResponse,
): Promise<void> {
  if (!canEditCurrentMessage(ctx)) {
    return;
  }

  await ctx.editMessageReplyMarkup(result.editReplyMarkup);
  await answerCallbackQueryIfPresent(ctx);
}

async function applyDeleteMessageResult(ctx: Context): Promise<void> {
  if (typeof ctx.msgId !== 'number' || !ctx.chat) {
    return;
  }

  await ctx.deleteMessage();
  await answerCallbackQueryIfPresent(ctx);
}

function canEditCurrentMessage(ctx: Context): boolean {
  return Boolean(ctx.callbackQuery || ctx.inlineMessageId);
}

/** Убирает индикатор загрузки у callback-кнопки после декларативного UI-действия. */
async function answerCallbackQueryIfPresent(ctx: Context): Promise<void> {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery();
  }
}

/** Объект `reply_parameters` объединяется отдельно, чтобы не терять module defaults. */
function mergeReplyOptions(
  defaults: TelegrafReplyExtra,
  overrides: TelegrafReplyExtra | undefined,
): TelegrafReplyExtra {
  const replyParameters = mergeReplyParameters(
    defaults.reply_parameters,
    overrides?.reply_parameters,
  );

  return {
    ...defaults,
    ...overrides,
    ...(replyParameters ? { reply_parameters: replyParameters } : {}),
  };
}

function mergeReplyParameters(
  defaults: Types.ExtraReplyMessage['reply_parameters'],
  overrides: Types.ExtraReplyMessage['reply_parameters'],
): Types.ExtraReplyMessage['reply_parameters'] {
  if (!defaults && !overrides) {
    return undefined;
  }

  const merged = { ...defaults, ...overrides };
  if (typeof merged.message_id !== 'number') {
    return undefined;
  }

  return {
    ...merged,
    message_id: merged.message_id,
  };
}

function isTelegrafListenerResponse(
  value: TelegrafListenerResult,
): value is TelegrafListenerResponse {
  return typeof value === 'object' && value !== null && 'text' in value;
}

function isTelegrafCallbackQueryResponse(
  value: TelegrafListenerResult,
): value is TelegrafCallbackQueryResponse {
  return (
    typeof value === 'object' && value !== null && 'callbackQuery' in value
  );
}

function isTelegrafInlineQueryResponse(
  value: TelegrafListenerResult,
): value is TelegrafInlineQueryResponse {
  return typeof value === 'object' && value !== null && 'inlineQuery' in value;
}

function isTelegrafEditMessageResponse(
  value: TelegrafListenerResult,
): value is TelegrafEditMessageResponse {
  return typeof value === 'object' && value !== null && 'editMessage' in value;
}

function isTelegrafEditReplyMarkupResponse(
  value: TelegrafListenerResult,
): value is TelegrafEditReplyMarkupResponse {
  return (
    typeof value === 'object' && value !== null && 'editReplyMarkup' in value
  );
}

function isTelegrafDeleteMessageResponse(
  value: TelegrafListenerResult,
): value is TelegrafDeleteMessageResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'deleteMessage' in value &&
    value.deleteMessage === true
  );
}
