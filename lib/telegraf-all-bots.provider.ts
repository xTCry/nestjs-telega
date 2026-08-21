import { Provider } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf-hardened';

import { TELEGRAF_ALL_BOTS } from './telegraf.constants';

export const allBotsMap: Map<string, Telegraf<Context>> = new Map();

export const telegrafAllBotsProvider: Provider = {
  provide: TELEGRAF_ALL_BOTS,
  useValue: allBotsMap,
};
