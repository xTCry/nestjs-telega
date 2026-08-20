import type { Context, Types } from 'telegraf';

import type {
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
  if (typeof result === 'string') {
    await ctx.reply(result, replyOptions);
    return;
  }

  if (!isTelegrafListenerResponse(result)) {
    return;
  }

  await ctx.reply(result.text, mergeReplyOptions(replyOptions, result.extra));
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
