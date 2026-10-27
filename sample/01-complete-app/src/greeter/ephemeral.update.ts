import { Action, Command, Ctx, Update } from 'nestjs-telega';
import { Markup } from 'telegraf-hardened';

import { Context } from '../interfaces/context.interface';

/** Callback должен исходить от получателя временного сообщения. */
function getRecipientId(ctx: Context): number | undefined {
  const message = ctx.msg;
  const receiver =
    message && 'receiver_user' in message ? message.receiver_user : undefined;
  return ctx.ephemeralMessageId && receiver && receiver.id === ctx.from?.id
    ? receiver.id
    : undefined;
}

/** Пример временного сообщения, видимого только выбранному получателю. */
@Update()
export class EphemeralUpdate {
  @Command('ephemeral')
  async onEphemeral(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.from) return;

    await ctx.reply(
      'Only you can see this temporary message. Use the buttons to edit or delete it.',
      {
        ephemeral_message_parameters: { receiver_user_id: ctx.from.id },
        ...Markup.inlineKeyboard([
          Markup.button.callback('Update', 'ephemeral:update'),
          Markup.button.callback('Delete', 'ephemeral:delete'),
        ]),
      },
    );
  }

  @Action('ephemeral:update')
  async onUpdate(@Ctx() ctx: Context): Promise<void> {
    const recipientId = getRecipientId(ctx);
    if (!recipientId) {
      await ctx.answerCbQuery('This temporary message is no longer available.');
      return;
    }

    await ctx.editEphemeralMessageText(
      recipientId,
      'Updated! This temporary message is still visible only to you.',
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback('Delete', 'ephemeral:delete'),
        ]).reply_markup,
      },
    );
    await ctx.answerCbQuery('Updated');
  }

  @Action('ephemeral:delete')
  async onDelete(@Ctx() ctx: Context): Promise<void> {
    const recipientId = getRecipientId(ctx);
    if (!recipientId) {
      await ctx.answerCbQuery('This temporary message is no longer available.');
      return;
    }

    await ctx.deleteEphemeralMessage(recipientId);
    await ctx.answerCbQuery('Deleted');
  }
}
