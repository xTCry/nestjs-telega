import { Inject } from '@nestjs/common';

import { getBotToken } from '../../utils';

/**
 * Внедряет Telegraf instance для default или именованного bot.
 *
 * Тип параметра: {@link import('telegraf-hardened').Telegraf}. Для custom
 * context используйте `Telegraf<MyContext>`.
 */
export const TgInjectBot = (botName?: string): ReturnType<typeof Inject> =>
  Inject(getBotToken(botName));

/** Alias for {@link TgInjectBot}. */
export const InjectBot = TgInjectBot;
