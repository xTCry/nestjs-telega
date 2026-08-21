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
