import {
  Command,
  Ctx,
  Hears,
  InlineQuery,
  On,
  Reaction,
  Sender,
  Start,
  TelegrafListenerResult,
  Update,
} from 'nestjs-telega';
import { Format, Markup } from 'telegraf-hardened';
import type { Types } from 'telegraf-hardened';

import { HELLO_SCENE_ID, WIZARD_SCENE_ID } from '../app.constants';
import { UpdateType } from '../common/decorators/update-type.decorator';
import { Context } from '../interfaces/context.interface';

@Update()
export class GreeterUpdate {
  @Start()
  onStart(): string {
    return 'Say hello to me';
  }

  @Hears(['hi', 'hello', 'hey', 'qq'])
  onGreetings(
    @UpdateType() updateType: Types.UpdateType,
    @Sender('first_name') firstName: string,
  ): TelegrafListenerResult {
    return `Hey ${firstName}`;
  }

  @Command('scene')
  async onSceneCommand(@Ctx() ctx: Context): Promise<TelegrafListenerResult> {
    await ctx.scene.enter(HELLO_SCENE_ID);
  }

  @Command('wizard')
  async onWizardCommand(@Ctx() ctx: Context): Promise<TelegrafListenerResult> {
    await ctx.scene.enter(WIZARD_SCENE_ID);
  }

  @Command('features')
  async onFeatures(@Ctx() ctx: Context): Promise<void> {
    await ctx.reply(
      Format.join(
        Format.bold('telegraf-hardened sample'),
        '\n• reactions\n• business updates\n• Stars and gifts API via /stars and /gifts\n\nUse /help for the full guide.',
      ),
      Markup.inlineKeyboard([
        Markup.button.switchToCurrentChat('Try inline mode', 'hello'),
      ]),
    );
  }

  @Command('stars')
  async onStars(@Ctx() ctx: Context): Promise<void> {
    const balance = await ctx.telegram.getMyStarBalance();
    const transactions = await ctx.telegram.getStarTransactions(0, 5);

    await ctx.reply(
      `Stars balance: ${balance.amount}. Recent transactions: ${transactions.transactions.length}.`,
    );
  }

  @Command('gifts')
  async onGifts(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.from) {
      return;
    }

    const gifts = await ctx.telegram.getUserGifts({
      user_id: ctx.from.id,
      limit: 5,
    });
    await ctx.reply(`Your gifts: ${gifts.total_count}.`);
  }

  @Command('paidmedia')
  async onPaidMedia(@Ctx() ctx: Context): Promise<void> {
    const chatId = ctx.chat?.id;
    const mediaFileId = process.env.PAID_MEDIA_FILE_ID;
    if (!chatId || !mediaFileId) {
      await ctx.reply(
        'Set PAID_MEDIA_FILE_ID to a Telegram photo file_id before testing paid media.',
      );
      return;
    }

    await ctx.telegram.sendPaidMedia(
      chatId,
      [{ type: 'photo', media: mediaFileId }],
      1,
      { payload: 'nestjs-telega-sample-paid-media' },
    );
  }

  @Reaction('👍')
  async onThumbsUpReaction(@Ctx() ctx: Context & { match: string }) {
    const reaction = ctx.reactions.added.toArray()[0];
    await ctx.reply(
      `Thanks for the ${ctx.match} reaction: ${JSON.stringify(reaction)}`,
    );
  }

  @On('business_message')
  async onBusinessMessage(@Ctx() ctx: Context): Promise<void> {
    const connection = await ctx.getBusinessConnection();
    console.log(`Business message received for connection ${connection.id}`);
    await ctx.reply('Business message received by the NestJS handler.');
  }

  @InlineQuery(/.*/)
  onInlineQuery(): TelegrafListenerResult {
    return {
      inlineQuery: {
        results: [
          {
            id: 'greeter',
            type: 'article',
            title: 'Send greeting',
            input_message_content: {
              message_text: 'Hello from nestjs-telega!',
            },
          },
        ],
      },
    };
  }
}
