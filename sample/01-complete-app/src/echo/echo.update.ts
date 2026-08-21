import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  Command,
  Help,
  InjectBot,
  Message,
  On,
  ReplyOptions,
  Start,
  TelegrafListenerResult,
  Update,
} from 'nestjs-telega';
import { Telegraf } from 'telegraf-hardened';

import { TelegrafExceptionFilter } from '../common/filters/telegraf-exception.filter';
import { AdminGuard } from '../common/guards/admin.guard';
import { ResponseTimeInterceptor } from '../common/interceptors/response-time.interceptor';
import { ReverseTextPipe } from '../common/pipes/reverse-text.pipe';
import { Context } from '../interfaces/context.interface';
import { EchoService } from './echo.service';

@Update()
@ReplyOptions({
  link_preview_options: { is_disabled: true },
})
@UseInterceptors(ResponseTimeInterceptor)
@UseFilters(TelegrafExceptionFilter)
export class EchoUpdate {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf<Context>,
    private readonly echoService: EchoService,
  ) {}

  @Start()
  async onStart(): Promise<TelegrafListenerResult> {
    const me = await this.bot.telegram.getMe();
    return {
      text: `Hey, I'm <b>${me.first_name}</b>`,
      extra: { parse_mode: 'HTML' },
    };
  }

  @Help()
  async onHelp(): Promise<TelegrafListenerResult> {
    return 'Send me any text';
  }

  @Command('admin')
  @UseGuards(AdminGuard)
  onAdminCommand(): TelegrafListenerResult {
    return 'Welcome judge';
  }

  @On('text')
  onMessage(
    @Message('text', new ReverseTextPipe()) reversedText: string,
  ): TelegrafListenerResult {
    return this.echoService.echo(reversedText);
  }
}
