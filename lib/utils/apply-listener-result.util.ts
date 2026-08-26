import type { Context, Types } from 'telegraf-hardened';

import type {
  TelegrafCallbackQueryResponse,
  TelegrafCallbackUiResult,
  TelegrafDeleteMessageResponse,
  TelegrafEditMessageCaptionResponse,
  TelegrafEditMessageMediaResponse,
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
  if (isTelegrafEditMessageResponse(result)) {
    await applyEditMessageResult(ctx, result);
    return;
  }

  if (isTelegrafEditMessageCaptionResponse(result)) {
    await applyEditMessageCaptionResult(ctx, result);
    return;
  }

  if (isTelegrafEditMessageMediaResponse(result)) {
    await applyEditMessageMediaResult(ctx, result);
    return;
  }

  if (isTelegrafEditReplyMarkupResponse(result)) {
    await applyEditReplyMarkupResult(ctx, result);
    return;
  }

  if (isTelegrafDeleteMessageResponse(result)) {
    await applyDeleteMessageResult(ctx, result);
    return;
  }

  if (isTelegrafCallbackQueryResponse(result)) {
    await applyCallbackQueryResult(ctx, result);
    return;
  }

  if (isTelegrafInlineQueryResponse(result)) {
    await applyInlineQueryResult(ctx, result);
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
  await answerCallbackQueryAfterUiAction(ctx, result);
}

async function applyEditMessageCaptionResult(
  ctx: Context,
  result: TelegrafEditMessageCaptionResponse,
): Promise<void> {
  if (!canEditCurrentMessage(ctx)) {
    return;
  }

  await ctx.editMessageCaption(
    result.editMessageCaption.caption,
    result.editMessageCaption.extra,
  );
  await answerCallbackQueryAfterUiAction(ctx, result);
}

async function applyEditMessageMediaResult(
  ctx: Context,
  result: TelegrafEditMessageMediaResponse,
): Promise<void> {
  if (!canEditCurrentMessage(ctx)) {
    return;
  }

  await ctx.editMessageMedia(
    result.editMessageMedia.media,
    result.editMessageMedia.extra,
  );
  await answerCallbackQueryAfterUiAction(ctx, result);
}

async function applyEditReplyMarkupResult(
  ctx: Context,
  result: TelegrafEditReplyMarkupResponse,
): Promise<void> {
  if (!canEditCurrentMessage(ctx)) {
    return;
  }

  await ctx.editMessageReplyMarkup(result.editReplyMarkup);
  await answerCallbackQueryAfterUiAction(ctx, result);
}

async function applyDeleteMessageResult(
  ctx: Context,
  result: TelegrafDeleteMessageResponse,
): Promise<void> {
  if (typeof ctx.msgId !== 'number' || !ctx.chat) {
    return;
  }

  await ctx.deleteMessage();
  await answerCallbackQueryAfterUiAction(ctx, result);
}

function canEditCurrentMessage(ctx: Context): boolean {
  return Boolean(ctx.callbackQuery || ctx.inlineMessageId);
}

/** Убирает индикатор загрузки либо показывает заданный обработчиком callback-ответ. */
async function answerCallbackQueryAfterUiAction(
  ctx: Context,
  result: TelegrafCallbackUiResult,
): Promise<void> {
  if (!ctx.callbackQuery) {
    return;
  }

  if (!result.callbackQuery) {
    await ctx.answerCbQuery();
    return;
  }

  await ctx.answerCbQuery(
    result.callbackQuery.text,
    result.callbackQuery.extra,
  );
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

function isTelegrafEditMessageCaptionResponse(
  value: TelegrafListenerResult,
): value is TelegrafEditMessageCaptionResponse {
  return (
    typeof value === 'object' && value !== null && 'editMessageCaption' in value
  );
}

function isTelegrafEditMessageMediaResponse(
  value: TelegrafListenerResult,
): value is TelegrafEditMessageMediaResponse {
  return (
    typeof value === 'object' && value !== null && 'editMessageMedia' in value
  );
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
