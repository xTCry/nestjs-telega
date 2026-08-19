import { Inject } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';

import { getAllBotsToken } from '../../utils/get-all-bots-token.util';

export type AllBotsMap = Map<string, Telegraf<Context>>;

export const InjectAllBots = (): ReturnType<typeof Inject> =>
  Inject(getAllBotsToken());
