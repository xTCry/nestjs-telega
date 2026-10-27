import { TelegramError } from 'telegraf-hardened';

import { EphemeralUpdate } from '../greeter/ephemeral.update';
import type { Context } from '../interfaces/context.interface';

describe('EphemeralUpdate', () => {
  it('explains that the example requires a group when invoked in private', async () => {
    const reply = jest.fn().mockResolvedValue(undefined);
    const ctx = {
      from: { id: 42 },
      chat: { type: 'private' },
      reply,
    } as unknown as Context;

    await new EphemeralUpdate().onEphemeral(ctx);

    expect(reply).toHaveBeenCalledTimes(1);
    expect(reply).toHaveBeenCalledWith(expect.stringContaining('group'));
  });

  it('explains the missing administrator role after BOT_NOT_ADMIN', async () => {
    const reply = jest
      .fn()
      .mockRejectedValueOnce(
        new TelegramError({
          error_code: 400,
          description: 'Bad Request: BOT_NOT_ADMIN',
        }),
      )
      .mockResolvedValueOnce(undefined);
    const ctx = {
      from: { id: 42 },
      chat: { type: 'supergroup' },
      reply,
    } as unknown as Context;

    await new EphemeralUpdate().onEphemeral(ctx);

    expect(reply).toHaveBeenCalledTimes(2);
    expect(reply).toHaveBeenLastCalledWith(
      expect.stringContaining('administrator'),
    );
    expect(reply.mock.calls[0][1]).toMatchObject({
      ephemeral_message_parameters: { receiver_user_id: 42 },
    });
  });

  it('propagates unrelated Telegram errors', async () => {
    const error = new TelegramError({
      error_code: 400,
      description: 'Bad Request: unrelated error',
    });
    const reply = jest.fn().mockRejectedValue(error);
    const ctx = {
      from: { id: 42 },
      chat: { type: 'group' },
      reply,
    } as unknown as Context;

    await expect(new EphemeralUpdate().onEphemeral(ctx)).rejects.toBe(error);
    expect(reply).toHaveBeenCalledTimes(1);
  });
});
