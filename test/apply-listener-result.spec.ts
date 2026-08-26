import { Context } from 'telegraf-hardened';

import type { TelegrafListenerResult } from '../lib/interfaces';
import { applyListenerResult } from '../lib/utils';

describe('applyListenerResult', () => {
  it('replies with a string result and merged module options', async () => {
    const reply = jest.fn().mockResolvedValue(undefined);

    await applyListenerResult(
      { reply, chat: { id: 1 } } as unknown as Context,
      'Hello',
      { parse_mode: 'HTML' },
    );

    expect(reply).toHaveBeenCalledWith('Hello', { parse_mode: 'HTML' });
  });

  it('allows an object result to override reply options', async () => {
    const reply = jest.fn().mockResolvedValue(undefined);

    await applyListenerResult(
      { reply, chat: { id: 1 } } as unknown as Context,
      {
        text: 'Hello',
        extra: { parse_mode: 'MarkdownV2' },
      },
      { parse_mode: 'HTML', disable_notification: true },
    );

    expect(reply).toHaveBeenCalledWith('Hello', {
      parse_mode: 'MarkdownV2',
      disable_notification: true,
    });
  });

  it('merges reply parameters instead of replacing module defaults', async () => {
    const reply = jest.fn().mockResolvedValue(undefined);

    await applyListenerResult(
      { reply, chat: { id: 1 } } as unknown as Context,
      {
        text: 'Hello',
        extra: {
          reply_parameters: {
            message_id: 2,
            allow_sending_without_reply: true,
          },
        },
      },
      { reply_parameters: { message_id: 1 } },
    );

    expect(reply).toHaveBeenCalledWith('Hello', {
      reply_parameters: {
        message_id: 2,
        allow_sending_without_reply: true,
      },
    });
  });

  it('answers a callback query only for a callback update', async () => {
    const answerCbQuery = jest.fn().mockResolvedValue(undefined);

    await applyListenerResult(
      {
        callbackQuery: { id: 'callback-id' },
        answerCbQuery,
      } as unknown as Context,
      {
        callbackQuery: {
          text: 'Done',
          extra: { show_alert: true },
        },
      },
      {},
    );

    expect(answerCbQuery).toHaveBeenCalledWith('Done', { show_alert: true });
  });

  it('answers an inline query only for an inline update', async () => {
    const answerInlineQuery = jest.fn().mockResolvedValue(undefined);
    const results = [
      {
        type: 'article' as const,
        id: 'result-id',
        title: 'Result',
        input_message_content: { message_text: 'Hello' },
      },
    ];

    await applyListenerResult(
      {
        inlineQuery: { id: 'inline-id' },
        answerInlineQuery,
      } as unknown as Context,
      { inlineQuery: { results, extra: { cache_time: 10 } } },
      {},
    );

    expect(answerInlineQuery).toHaveBeenCalledWith(results, {
      cache_time: 10,
    });
  });

  it('edits the message associated with a callback result', async () => {
    const editMessageText = jest.fn().mockResolvedValue(true);
    const answerCbQuery = jest.fn().mockResolvedValue(undefined);

    await applyListenerResult(
      {
        callbackQuery: { id: 'callback-id' },
        editMessageText,
        answerCbQuery,
      } as unknown as Context,
      {
        editMessage: {
          text: '<b>Updated</b>',
          extra: { parse_mode: 'HTML' },
        },
        callbackQuery: {
          text: 'Updated',
          extra: { show_alert: true },
        },
      },
      {},
    );

    expect(editMessageText).toHaveBeenCalledWith('<b>Updated</b>', {
      parse_mode: 'HTML',
    });
    expect(answerCbQuery).toHaveBeenCalledWith('Updated', {
      show_alert: true,
    });
  });

  it('edits the inline keyboard associated with a callback result', async () => {
    const editMessageReplyMarkup = jest.fn().mockResolvedValue(true);
    const answerCbQuery = jest.fn().mockResolvedValue(undefined);
    const markup = { inline_keyboard: [] };

    await applyListenerResult(
      {
        callbackQuery: { id: 'callback-id' },
        editMessageReplyMarkup,
        answerCbQuery,
      } as unknown as Context,
      { editReplyMarkup: markup },
      {},
    );

    expect(editMessageReplyMarkup).toHaveBeenCalledWith(markup);
    expect(answerCbQuery).toHaveBeenCalledWith();
  });

  it('edits a caption associated with a callback result', async () => {
    const editMessageCaption = jest.fn().mockResolvedValue(true);
    const answerCbQuery = jest.fn().mockResolvedValue(undefined);

    await applyListenerResult(
      {
        callbackQuery: { id: 'callback-id' },
        editMessageCaption,
        answerCbQuery,
      } as unknown as Context,
      {
        editMessageCaption: {
          caption: '<b>Updated caption</b>',
          extra: { parse_mode: 'HTML' },
        },
      },
      {},
    );

    expect(editMessageCaption).toHaveBeenCalledWith('<b>Updated caption</b>', {
      parse_mode: 'HTML',
    });
    expect(answerCbQuery).toHaveBeenCalledWith();
  });

  it('edits media associated with a callback result', async () => {
    const editMessageMedia = jest.fn().mockResolvedValue(true);
    const answerCbQuery = jest.fn().mockResolvedValue(undefined);
    const media = {
      type: 'photo' as const,
      media: 'https://example.com/updated.jpg',
    };

    await applyListenerResult(
      {
        callbackQuery: { id: 'callback-id' },
        editMessageMedia,
        answerCbQuery,
      } as unknown as Context,
      {
        editMessageMedia: {
          media,
          extra: { reply_markup: { inline_keyboard: [] } },
        },
      },
      {},
    );

    expect(editMessageMedia).toHaveBeenCalledWith(media, {
      reply_markup: { inline_keyboard: [] },
    });
    expect(answerCbQuery).toHaveBeenCalledWith();
  });

  it('deletes the message associated with a callback result', async () => {
    const deleteMessage = jest.fn().mockResolvedValue(true);
    const answerCbQuery = jest.fn().mockResolvedValue(undefined);

    await applyListenerResult(
      {
        callbackQuery: { id: 'callback-id' },
        chat: { id: 1 },
        msgId: 10,
        deleteMessage,
        answerCbQuery,
      } as unknown as Context,
      { deleteMessage: true },
      {},
    );

    expect(deleteMessage).toHaveBeenCalledWith();
    expect(answerCbQuery).toHaveBeenCalledWith();
  });

  it('does not apply a message UI result outside a compatible update', async () => {
    const editMessageText = jest.fn();
    const editMessageCaption = jest.fn();
    const editMessageMedia = jest.fn();
    const editMessageReplyMarkup = jest.fn();
    const deleteMessage = jest.fn();

    await applyListenerResult(
      { editMessageText } as unknown as Context,
      { editMessage: { text: 'Updated' } },
      {},
    );
    await applyListenerResult(
      { editMessageReplyMarkup } as unknown as Context,
      { editReplyMarkup: undefined },
      {},
    );
    await applyListenerResult(
      { editMessageCaption } as unknown as Context,
      { editMessageCaption: { caption: 'Updated' } },
      {},
    );
    await applyListenerResult(
      { editMessageMedia } as unknown as Context,
      { editMessageMedia: { media: { type: 'photo', media: 'file-id' } } },
      {},
    );
    await applyListenerResult(
      { deleteMessage, msgId: undefined } as unknown as Context,
      { deleteMessage: true },
      {},
    );

    expect(editMessageText).not.toHaveBeenCalled();
    expect(editMessageCaption).not.toHaveBeenCalled();
    expect(editMessageMedia).not.toHaveBeenCalled();
    expect(editMessageReplyMarkup).not.toHaveBeenCalled();
    expect(deleteMessage).not.toHaveBeenCalled();
  });

  it('ignores a message result when the update has no chat', async () => {
    const reply = jest.fn();

    await applyListenerResult(
      { reply, chat: undefined } as unknown as Context,
      'Hello',
      {},
    );

    expect(reply).not.toHaveBeenCalled();
  });

  it.each<TelegrafListenerResult>([undefined, null, false])(
    'does not reply for an empty result: %p',
    async (result) => {
      const reply = jest.fn();

      await applyListenerResult({ reply } as unknown as Context, result, {});

      expect(reply).not.toHaveBeenCalled();
    },
  );
});
