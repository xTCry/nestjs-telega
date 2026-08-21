import { Inject } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf-hardened';

import { getAllBotsToken } from '../../utils/get-all-bots-token.util';

export type AllBotsMap = Map<string, Telegraf<Context>>;

export const TgInjectAllBots = (): ReturnType<typeof Inject> =>
  Inject(getAllBotsToken());

/** Alias for {@link TgInjectAllBots}. */
export const InjectAllBots = TgInjectAllBots;
