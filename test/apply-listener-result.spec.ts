import { Context } from 'telegraf';

import type { TelegrafListenerResult } from '../lib/interfaces';
import { applyListenerResult } from '../lib/utils';

describe('applyListenerResult', () => {
  it('replies with a string result and merged module options', async () => {
    const reply = jest.fn().mockResolvedValue(undefined);

    await applyListenerResult({ reply } as unknown as Context, 'Hello', {
      parse_mode: 'HTML',
    });

    expect(reply).toHaveBeenCalledWith('Hello', { parse_mode: 'HTML' });
  });

  it('allows an object result to override reply options', async () => {
    const reply = jest.fn().mockResolvedValue(undefined);

    await applyListenerResult(
      { reply } as unknown as Context,
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
      { reply } as unknown as Context,
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

  it.each<TelegrafListenerResult>([undefined, null, false])(
    'does not reply for an empty result: %p',
    async (result) => {
      const reply = jest.fn();

      await applyListenerResult({ reply } as unknown as Context, result, {});

      expect(reply).not.toHaveBeenCalled();
    },
  );
});
