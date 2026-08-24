import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectAllBots } from 'nestjs-telega';
import type { Telegraf } from 'telegraf-hardened';
import type { BotCommand } from 'telegraf-hardened/types';

const defaultBotCommands = [
  { command: 'start', description: 'Open the sample and its controls' },
  { command: 'help', description: 'Show a short guide' },
  { command: 'admin', description: 'Open automatic reply controls' },
  { command: 'features', description: 'Show telegraf-hardened features' },
  { command: 'format', description: 'Send a formatted message' },
  { command: 'keyboard', description: 'Show an inline keyboard' },
  { command: 'menu', description: 'Show a reply keyboard' },
  { command: 'stars', description: 'Read the bot Stars balance' },
  { command: 'gifts', description: 'Read your Telegram gifts' },
  { command: 'paidmedia', description: 'Send configured paid media' },
  { command: 'scene', description: 'Enter the basic scene' },
  { command: 'wizard', description: 'Enter the basic wizard' },
  { command: 'dialogue', description: 'Enter the Business dialogue scene' },
  { command: 'leave', description: 'Leave the Business dialogue scene' },
  { command: 'remove', description: 'Remove a configured automatic reply' },
  {
    command: 'buttonemoji',
    description: 'Get ID from a custom emoji for keyboard buttons',
  },
] satisfies BotCommand[];

/** Синхронизирует видимое Telegram-меню с командами, реализованными в sample. */
@Injectable()
export class BotCommandsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BotCommandsService.name);

  constructor(
    @InjectAllBots()
    private readonly bots: Map<string, Telegraf>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await Promise.all(
      [...this.bots.entries()].map(async ([name, bot]) => {
        try {
          await bot.telegram.setMyCommands(defaultBotCommands);
        } catch (error) {
          this.logger.warn(
            `Unable to set commands for ${name}: ${String(error)}`,
          );
        }
      }),
    );
  }
}
