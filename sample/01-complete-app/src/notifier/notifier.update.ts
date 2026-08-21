import {
  Command,
  InjectAllBots,
  InjectBot,
  Start,
  TelegrafListenerResult,
  Update,
} from 'nestjs-telega';
import type { Telegraf } from 'telegraf-hardened';

import { GreeterBotName, NotifierBotName } from '../app.constants';

@Update()
export class NotifierUpdate {
  public constructor(
    @InjectBot(NotifierBotName)
    private readonly notifierBot: Telegraf,
    @InjectAllBots()
    private readonly bots: Map<string, Telegraf>,
  ) {}

  @Start()
  onStart(): TelegrafListenerResult {
    return 'Notifier bot is ready. Use /bots to inspect registered bot names.';
  }

  @Command('bots')
  onBots(): TelegrafListenerResult {
    const botNames = [...this.bots.keys()].sort().join(', ');
    const hasGreeter = this.bots.has(`${GreeterBotName}Bot`);

    return {
      text: `Registered bot tokens: ${botNames}. Greeter available: ${hasGreeter}.`,
      extra: {
        disable_notification: true,
      },
    };
  }

  @Command('me')
  onMe(): TelegrafListenerResult {
    return `Notifier username: ${this.notifierBot.botInfo?.username ?? 'unknown'}`;
  }
}
