import { Inject } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf-hardened';

import { getAllBotsToken } from '../../utils/get-all-bots-token.util';

export type AllBotsMap = Map<string, Telegraf<Context>>;

/**
 * Внедряет registry всех активных bot instances.
 *
 * Тип параметра: {@link AllBotsMap}; для custom context используйте
 * `Map<string, Telegraf<MyContext>>`.
 */
export const TgInjectAllBots = (): ReturnType<typeof Inject> =>
  Inject(getAllBotsToken());

/** Alias for {@link TgInjectAllBots}. */
export const InjectAllBots = TgInjectAllBots;
