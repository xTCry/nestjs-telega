export type BusinessResponseCategory = 'text' | 'sticker' | 'reaction';

/** Список поддерживаемых реакций из текущей типизации telegraf-hardened. */
export type BusinessReactionEmoji =
  import('telegraf-hardened/types').TelegramEmoji;

export interface BusinessResponsesConfig {
  enabled: boolean;
  textReplies: string[];
  stickerReplies: string[];
  reactionReplies: BusinessReactionEmoji[];
}

export const DEFAULT_BUSINESS_RESPONSES: Readonly<BusinessResponsesConfig> = {
  enabled: true,
  textReplies: [
    'Thanks for your message! We will get back to you shortly.',
    'Got it — a manager will reply as soon as possible.',
    'Thank you! Your message has been received.',
  ],
  stickerReplies: [],
  reactionReplies: ['👍', '❤'],
};

export const BUSINESS_RESPONSE_CATEGORIES: readonly BusinessResponseCategory[] =
  ['text', 'sticker', 'reaction'];

export const getCategoryLabel = (category: BusinessResponseCategory): string =>
  ({
    text: 'text reply',
    sticker: 'sticker',
    reaction: 'reaction emoji',
  })[category];
