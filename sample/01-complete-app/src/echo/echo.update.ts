import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  Action,
  Command,
  Ctx,
  Help,
  InjectBot,
  InlineQuery,
  Message,
  On,
  ReplyOptions,
  Start,
  TelegrafListenerResult,
  Update,
} from 'nestjs-telega';
import { Format, Markup, Telegraf } from 'telegraf-hardened';
import type { Message as TelegramMessage } from 'telegraf-hardened/types';

import {
  createAdminKeyboard,
  createAdminReplyKeyboard,
  renderAdminDashboard,
  renderAdminResponses,
} from '../admin/admin-keyboard';
import { ADMIN_RESPONSE_WIZARD_SCENE_ID } from '../app.constants';
import {
  BusinessResponsesStore,
  isResponseCategory,
} from '../business-responses/business-responses.store';
import {
  BusinessResponseCategory,
  getCategoryLabel,
} from '../business-responses/business-responses.types';
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
    private readonly responsesStore: BusinessResponsesStore,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    const me = await this.bot.telegram.getMe();
    const config = await this.responsesStore.getConfig();
    await ctx.reply(
      `Hey, I'm <b>${me.first_name}</b>. This bot manages the optional Telegram Business bot.`,
      { parse_mode: 'HTML', ...createAdminKeyboard(config.enabled) },
    );
  }

  @Help()
  async onHelp(): Promise<TelegrafListenerResult> {
    return {
      text: [
        '<b>What this sample demonstrates</b>',
        '• Echo replies with Unicode-safe text reversal.',
        '• /admin opens controls for automatic Business replies: text, stickers and reactions.',
        '• /features, /format, /keyboard and /menu isolate individual telegraf-hardened APIs.',
        '• Set BUSINESS_BOT_TOKEN to activate the second bot for Telegram Business updates and /dialogue.',
        'Use /admin to start with the interactive flow.',
      ].join('\n\n'),
      extra: { parse_mode: 'HTML' },
    };
  }

  @Command('admin')
  @UseGuards(AdminGuard)
  async onAdminCommand(@Ctx() ctx: Context): Promise<void> {
    await this.replyAdminDashboard(ctx);
  }

  @Action('admin:status')
  @UseGuards(AdminGuard)
  async onAdminStatus(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery();
    await this.replyAdminDashboard(ctx);
  }

  @Action('admin:toggle')
  @UseGuards(AdminGuard)
  async onToggleReplies(@Ctx() ctx: Context): Promise<void> {
    const config = await this.responsesStore.getConfig();
    const updated = await this.responsesStore.setEnabled(!config.enabled);
    await ctx.answerCbQuery(
      `Automatic replies: ${updated.enabled ? 'enabled' : 'disabled'}.`,
    );
    await this.replyAdminDashboard(
      ctx,
      `Automatic replies ${updated.enabled ? 'enabled' : 'disabled'}.`,
    );
  }

  @Action(/^admin:add:(.+)$/)
  @UseGuards(AdminGuard)
  async onAddResponse(
    @Ctx() ctx: Context & { match: RegExpExecArray },
  ): Promise<void> {
    const category = ctx.match[1];
    if (!isResponseCategory(category)) {
      await ctx.answerCbQuery('Unknown response category.');
      return;
    }

    await ctx.answerCbQuery();
    await ctx.scene.enter(ADMIN_RESPONSE_WIZARD_SCENE_ID, {
      category: category as BusinessResponseCategory,
    });
  }

  @Action('admin:list')
  @UseGuards(AdminGuard)
  async onListResponses(@Ctx() ctx: Context): Promise<void> {
    const config = await this.responsesStore.getConfig();
    await ctx.answerCbQuery();
    await renderAdminResponses(ctx, config);
  }

  @Action('admin:remove')
  @UseGuards(AdminGuard)
  async onRemoveResponseHelp(@Ctx() ctx: Context): Promise<void> {
    const config = await this.responsesStore.getConfig();
    await ctx.answerCbQuery();
    await renderAdminResponses(
      ctx,
      config,
      'Send /remove &lt;text|sticker|reaction&gt; &lt;number&gt;.',
    );
  }

  @Action('admin:back')
  @UseGuards(AdminGuard)
  async onAdminBack(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery();
    await this.replyAdminDashboard(ctx);
  }

  @Action('admin:test')
  @UseGuards(AdminGuard)
  async onTestReply(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery();
    const reply = await this.responsesStore.pick('text');
    await ctx.reply(
      reply ?? 'Automatic replies are disabled or not configured.',
    );
    await this.replyAdminDashboard(ctx, 'Test text reply sent.');
  }

  @Command('remove')
  @UseGuards(AdminGuard)
  async onRemoveResponse(
    @Ctx() ctx: Context & { match: { args: string[] } },
  ): Promise<void> {
    const [category, rawIndex] = ctx.match.args;
    if (!isResponseCategory(category)) {
      await ctx.reply(
        `Usage: /remove <${['text', 'sticker', 'reaction'].join('|')}> <number>`,
      );
      return;
    }

    const index = Number(rawIndex) - 1;
    const config = await this.responsesStore.remove(category, index);
    await renderAdminResponses(
      ctx,
      config,
      `Removed ${getCategoryLabel(category)} response #${index + 1}.`,
    );
  }

  @Command('buttonemoji')
  @UseGuards(AdminGuard)
  async onButtonEmoji(
    @Ctx() ctx: Context,
    @Message() message: TelegramMessage,
  ): Promise<void> {
    const customEmojiId =
      'entities' in message
        ? message.entities?.find((entity) => entity.type === 'custom_emoji')
            ?.custom_emoji_id
        : undefined;
    if (!customEmojiId) {
      await ctx.reply(
        'Send /buttonemoji followed by one custom emoji from Telegram Premium.',
      );
      return;
    }

    await ctx.reply(
      `Add this to .env and restart the sample:\nBUTTON_CUSTOM_EMOJI_ID=${customEmojiId}`,
    );
  }

  @Command('format')
  async onFormat(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      Format.join(
        Format.bold('Formatted'),
        ' replies are provided by telegraf-hardened.',
      ),
    );
  }

  @Command('menu')
  async onMenu(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      'This is a Bot API 9.4 reply keyboard with colored buttons and an optional custom emoji.',
      createAdminReplyKeyboard(),
    );
  }

  @Command('keyboard')
  async onKeyboard(@Ctx() ctx: Context): Promise<TelegrafListenerResult> {
    return {
      text: 'This inline keyboard is created with telegraf-hardened Markup helpers. It also demonstrates declarative callback UI results.',
      extra: Markup.inlineKeyboard([
        Markup.button.callback('Acknowledge', 'echo:acknowledge'),
        Markup.button.callback('Edit message', 'echo:edit'),
      ]),
    };
  }

  @Action('echo:acknowledge')
  onAcknowledge(): TelegrafListenerResult {
    return {
      callbackQuery: {
        text: 'Acknowledged',
      },
    };
  }

  @Action('echo:edit')
  onEdit(): TelegrafListenerResult {
    return {
      editMessage: {
        text: 'This message was edited by a declarative listener result.',
        extra: Markup.inlineKeyboard([
          Markup.button.callback('Remove keyboard', 'echo:remove-keyboard'),
          Markup.button.callback('Delete message', 'echo:delete'),
        ]),
      },
      callbackQuery: {
        text: 'Message updated.',
      },
    };
  }

  @Action('echo:remove-keyboard')
  onRemoveKeyboard(): TelegrafListenerResult {
    return {
      editReplyMarkup: undefined,
    };
  }

  @Action('echo:delete')
  onDelete(): TelegrafListenerResult {
    return { deleteMessage: true };
  }

  @InlineQuery(/.*/)
  onInlineQuery(@Ctx() ctx: Context): TelegrafListenerResult {
    const inlineQuery = ctx.inlineQuery;
    if (!inlineQuery) {
      return;
    }

    const page = getInlineQueryPage(inlineQuery.offset);
    const query = inlineQuery.query.trim();
    const pageSize = 3;
    const totalPages = 3;
    const results = Array.from(
      { length: page < totalPages ? pageSize : 0 },
      (_, index) => {
        const number = page * pageSize + index + 1;
        const title = query
          ? `Result ${number} for “${query}”`
          : `Sample inline result ${number}`;

        return {
          type: 'article' as const,
          id: `echo:${page}:${index}`,
          title,
          description: 'Paginated result from the NestJS Telega sample.',
          input_message_content: {
            message_text: `${title}\n\nSent from inline mode.`,
          },
        };
      },
    );

    return {
      inlineQuery: {
        results,
        extra: {
          // Пустой каталог не меняется и может кэшироваться дольше.
          cache_time: query ? 30 : 300,
          // В этом демо результат зависит только от query, а не от пользователя.
          is_personal: false,
          // Пустой offset останавливает pagination после последней страницы.
          next_offset: page + 1 < totalPages ? String(page + 1) : '',
        },
      },
    };
  }

  @On('text')
  onMessage(
    @Message('text', new ReverseTextPipe()) reversedText: string,
  ): TelegrafListenerResult {
    return this.echoService.echo(reversedText);
  }

  private async replyAdminDashboard(
    ctx: Context,
    notice?: string,
  ): Promise<void> {
    const config = await this.responsesStore.getConfig();
    await renderAdminDashboard(ctx, config, notice);
  }
}

/** Преобразует Telegram offset в номер страницы и не допускает некорректных значений. */
function getInlineQueryPage(offset: string): number {
  const page = Number(offset);

  return Number.isSafeInteger(page) && page >= 0 ? page : 0;
}
