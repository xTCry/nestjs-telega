import { Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';

import { TelegrafModuleOptions } from '../interfaces';

export function createBotFactory(
  options: TelegrafModuleOptions,
): Promise<Telegraf<any>> {
  const bot = new Telegraf<any>(options.token, options.options);

  bot.use(...(options.middlewares ?? []));
  if (options.useCatchLogger !== false) {
    bot.catch((err, ctx) => {
      const error = err instanceof Error ? err : new Error(String(err));

      (options.useCatchLogger || Logger.error)(
        `OnUpdateType(${ctx?.updateType}): ${error.message}`,
        error.stack,
        `Telegraf: ${ctx.botInfo?.username ?? ''}`,
      );
    });
  }

  if (options.launchOptions !== false) {
    const launchPromise = options.launchOptions
      ? bot.launch(options.launchOptions)
      : bot.launch();

    void launchPromise.catch((error: unknown) => {
      const launchError =
        error instanceof Error ? error : new Error(String(error));

      (options.useCatchLogger || Logger.error)(
        `Failed to launch bot: ${launchError.message}`,
        launchError.stack,
        'Telegraf',
      );
    });
  }

  return Promise.resolve(bot);
}
