import { Ctx, Message, On, Reaction, Update } from 'nestjs-telega';
import { Format } from 'telegraf-hardened';
import type { Message as TelegramMessage } from 'telegraf-hardened/types';

import { BUSINESS_DIALOGUE_SCENE_ID } from '../app.constants';
import { BusinessResponsesStore } from '../business-responses/business-responses.store';
import type { BusinessReactionEmoji } from '../business-responses/business-responses.types';
import { Context } from '../interfaces/context.interface';

@Update()
export class BusinessUpdate {
  constructor(private readonly responsesStore: BusinessResponsesStore) {}

  @On('business_connection')
  onBusinessConnection(@Ctx() ctx: Context): void {
    const connection = ctx.businessConnection;
    if (connection) {
      console.log(
        `Business connection ${connection.id} is ${connection.is_enabled ? 'enabled' : 'disabled'}.`,
      );
    }
  }

  @On('business_message')
  async onBusinessMessage(
    @Ctx() ctx: Context,
    @Message() message: TelegramMessage,
  ): Promise<void> {
    if (ctx.scene.current) {
      return;
    }

    if (ctx.text?.startsWith('/dialogue')) {
      await ctx.scene.enter(BUSINESS_DIALOGUE_SCENE_ID);
      return;
    }

    if (ctx.text?.startsWith('/')) {
      return;
    }

    await this.markAsRead(ctx);
    const connection = await ctx.getBusinessConnection();
    console.log(`Business message received for connection ${connection.id}.`);

    if (ctx.text) {
      const entityTypes = ctx
        .entities()
        .map((entity) => entity.type)
        .join(', ');
      const reply = await this.responsesStore.pick('text');
      const reaction = await this.responsesStore.pick('reaction');
      if (reply) {
        await ctx.sendChatAction('typing');
        await ctx.reply(
          Format.join(
            reply,
            entityTypes ? `\n\nDetected entities: ${entityTypes}.` : '',
          ),
        );
      }
      if (reaction) {
        await ctx.react(reaction as BusinessReactionEmoji);
      }
      return;
    }

    if ('sticker' in message) {
      const stickerReply = await this.responsesStore.pick('sticker');
      if (stickerReply) {
        await ctx.replyWithSticker(stickerReply);
      } else {
        await ctx.react('👍');
      }
    }
  }

  @On('edited_business_message')
  onEditedBusinessMessage(@Ctx() ctx: Context): void {
    console.log(`Business message ${ctx.msgId ?? 'unknown'} was edited.`);
  }

  @On('deleted_business_messages')
  onDeletedBusinessMessages(@Ctx() ctx: Context): void {
    const deleted = ctx.deletedBusinessMessages;
    if (deleted) {
      console.log(
        `Business connection ${deleted.business_connection_id} deleted ${deleted.message_ids.length} message(s).`,
      );
    }
  }

  @Reaction('👍')
  onThumbsUpReaction(@Ctx() ctx: Context & { match: string }): void {
    const reaction = ctx.reactions.added.toArray()[0];
    console.log(`Reaction ${ctx.match}: ${JSON.stringify(reaction)}`);
  }

  @On('message_reaction_count')
  onReactionCount(@Ctx() ctx: Context): void {
    const update = ctx.messageReactionCount;
    if (update) {
      console.log(
        `Message ${update.message_id} has ${update.reactions.length} reaction type(s).`,
      );
    }
  }

  private async markAsRead(ctx: Context): Promise<void> {
    const businessConnectionId = ctx.bizConnId;
    const chatId = ctx.chat?.id;
    const messageId = ctx.msgId;
    if (!businessConnectionId || !chatId || !messageId) {
      return;
    }

    try {
      await ctx.telegram.readBusinessMessage({
        business_connection_id: businessConnectionId,
        chat_id: chatId,
        message_id: messageId,
      });
    } catch (error) {
      // Право can_read_messages может отсутствовать у подключённого bot.
      console.warn(`Unable to mark business message as read: ${String(error)}`);
    }
  }
}
