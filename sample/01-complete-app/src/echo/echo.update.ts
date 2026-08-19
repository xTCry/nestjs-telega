import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  Command,
  Help,
  InjectBot,
  Message,
  On,
  Start,
  Update,
} from 'nestjs-telega';
import { Telegraf } from 'telegraf';

import { GreeterBotName } from '../app.constants';
import { TelegrafExceptionFilter } from '../common/filters/telegraf-exception.filter';
import { AdminGuard } from '../common/guards/admin.guard';
import { ResponseTimeInterceptor } from '../common/interceptors/response-time.interceptor';
import { ReverseTextPipe } from '../common/pipes/reverse-text.pipe';
import { Context } from '../interfaces/context.interface';
import { EchoService } from './echo.service';

@Update()
@UseInterceptors(ResponseTimeInterceptor)
@UseFilters(TelegrafExceptionFilter)
export class EchoUpdate {
  constructor(
    @InjectBot(GreeterBotName)
    private readonly bot: Telegraf<Context>,
    private readonly echoService: EchoService,
  ) {}

  @Start()
  async onStart(): Promise<string> {
    const me = await this.bot.telegram.getMe();
    return `Hey, I'm ${me.first_name}`;
  }

  @Help()
  async onHelp(): Promise<string> {
    return 'Send me any text';
  }

  @Command('admin')
  @UseGuards(AdminGuard)
  onAdminCommand(): string {
    return 'Welcome judge';
  }

  @On('text')
  onMessage(
    @Message('text', new ReverseTextPipe()) reversedText: string,
  ): string {
    return this.echoService.echo(reversedText);
  }
}
