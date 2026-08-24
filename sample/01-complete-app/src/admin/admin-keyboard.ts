import { Markup } from 'telegraf-hardened';
import type {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
} from 'telegraf-hardened/types';

import type { BusinessResponsesConfig } from '../business-responses/business-responses.types';
import type { Context } from '../interfaces/context.interface';

const customEmojiId = process.env.BUTTON_CUSTOM_EMOJI_ID?.trim();

const customEmoji = customEmojiId
  ? { icon_custom_emoji_id: customEmojiId }
  : {};

/** Создаёт Bot API 9.4 callback-кнопку с цветом и optional custom emoji. */
const button = (
  text: string,
  callbackData: string,
  style: InlineKeyboardButton.CallbackButton['style'],
): InlineKeyboardButton.CallbackButton => ({
  text,
  callback_data: callbackData,
  style,
  ...customEmoji,
});

const createAdminButtons = (enabled: boolean) =>
  [
    [
      button('Status', 'admin:status', 'primary'),
      button(
        enabled ? 'Automatic replies: ON' : 'Automatic replies: OFF',
        'admin:toggle',
        enabled ? 'success' : 'danger',
      ),
    ],
    [
      button('Add text', 'admin:add:text', 'primary'),
      button('Add sticker', 'admin:add:sticker', 'primary'),
    ],
    [
      button('Add reaction', 'admin:add:reaction', 'primary'),
      button('Show responses', 'admin:list', 'success'),
    ],
    [button('Send test reply', 'admin:test', 'danger')],
  ] satisfies InlineKeyboardButton.CallbackButton[][];

const responseConfirmationButtons = [
  [
    button('Save response', 'admin:response:save', 'success'),
    button('Cancel', 'admin:response:cancel', 'danger'),
  ],
] satisfies InlineKeyboardButton.CallbackButton[][];

const responseCancelButtons = [
  [button('Cancel editing', 'admin:response:cancel', 'danger')],
] satisfies InlineKeyboardButton.CallbackButton[][];

const responseListButtons = [
  [button('Back to controls', 'admin:back', 'primary')],
] satisfies InlineKeyboardButton.CallbackButton[][];

export const createAdminKeyboard = (enabled = true) =>
  Markup.inlineKeyboard(createAdminButtons(enabled));

export const createResponseConfirmationKeyboard = () =>
  Markup.inlineKeyboard(responseConfirmationButtons);

export const createResponseCancelKeyboard = () =>
  Markup.inlineKeyboard(responseCancelButtons);

const createResponseListKeyboard = () =>
  Markup.inlineKeyboard(responseListButtons);

/** Формирует краткое состояние панели перед следующим действием администратора. */
export const createAdminDashboardText = (
  config: BusinessResponsesConfig,
  notice?: string,
): string =>
  [
    notice,
    '<b>Business reply controls</b>',
    `Automatic replies: <b>${config.enabled ? 'enabled' : 'disabled'}</b>`,
    `Configured: ${config.textReplies.length} text, ${config.stickerReplies.length} sticker, ${config.reactionReplies.length} reaction.`,
    'Choose an action below.',
  ]
    .filter(Boolean)
    .join('\n\n');

export const createAdminResponsesText = (
  config: BusinessResponsesConfig,
): string => {
  const formatItems = (items: string[]): string =>
    items.length
      ? items.map((item, index) => `${index + 1}. ${item}`).join('\n')
      : '—';

  return [
    '<b>Configured automatic replies</b>',
    `<b>Automatic replies:</b> ${config.enabled ? 'enabled' : 'disabled'}`,
    `<b>Text</b>\n${formatItems(config.textReplies)}`,
    `<b>Stickers</b>\n${formatItems(config.stickerReplies)}`,
    `<b>Reactions</b>\n${formatItems(config.reactionReplies)}`,
    'Use /remove &lt;text|sticker|reaction&gt; &lt;number&gt; to delete an item.',
  ].join('\n\n');
};

/** Редактирует сообщение с inline-кнопкой или создаёт его для command/update. */
async function editOrReply(
  ctx: Context,
  text: string,
  keyboard: { reply_markup: InlineKeyboardMarkup },
  messageId?: number,
): Promise<void> {
  const extra = { parse_mode: 'HTML' as const, ...keyboard };

  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, extra);
      return;
    }

    if (messageId && ctx.chat) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        messageId,
        undefined,
        text,
        extra,
      );
      return;
    }
  } catch (error) {
    // Telegram не считает повторный показ того же экрана ошибкой для пользователя.
    if (String(error).includes('message is not modified')) {
      return;
    }
  }

  await ctx.reply(text, extra);
}

export const renderAdminDashboard = async (
  ctx: Context,
  config: BusinessResponsesConfig,
  notice?: string,
  messageId?: number,
): Promise<void> =>
  editOrReply(
    ctx,
    createAdminDashboardText(config, notice),
    createAdminKeyboard(config.enabled),
    messageId,
  );

export const renderAdminResponses = async (
  ctx: Context,
  config: BusinessResponsesConfig,
): Promise<void> =>
  editOrReply(
    ctx,
    createAdminResponsesText(config),
    createResponseListKeyboard(),
  );

export const renderResponseInputPrompt = async (
  ctx: Context,
  text: string,
): Promise<void> => editOrReply(ctx, text, createResponseCancelKeyboard());

export const renderResponseConfirmation = async (
  ctx: Context,
  text: string,
  messageId?: number,
): Promise<void> =>
  editOrReply(ctx, text, createResponseConfirmationKeyboard(), messageId);

/** Reply keyboard тоже поддерживает Bot API 9.4 style и custom emoji. */
export const createAdminReplyKeyboard = () =>
  Markup.keyboard([
    [
      { text: '/admin', style: 'primary', ...customEmoji },
      { text: '/format', style: 'success', ...customEmoji },
    ],
  ]).resize();
