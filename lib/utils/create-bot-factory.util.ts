import { Telegraf } from 'telegraf';
import { TelegrafModuleOptions } from '../interfaces';
import { Logger } from '@nestjs/common';

export async function createBotFactory(
  options: TelegrafModuleOptions,
): Promise<Telegraf<any>> {
  const bot = new Telegraf<any>(options.token, options.options);

  bot.use(...(options.middlewares ?? []));
  if (options.useCatchLogger !== false) {
    bot.catch((err: Error, ctx) =>
      (options.useCatchLogger || Logger.error)(
        `OnUpdateType(${ctx?.updateType}): ${err}`,
        err.stack,
        `Telegraf: ${ctx.botInfo.username}`,
      ),
    );
  }

  if (options.launchOptions !== false) {
    bot.launch(options.launchOptions);
  }

  return bot;
}
