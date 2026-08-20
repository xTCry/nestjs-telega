import { Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';

import { createBotFactory } from '../lib/utils';

describe('createBotFactory', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers configured middlewares without launching the bot', async () => {
    const middleware = jest.fn();
    const use = jest.spyOn(Telegraf.prototype, 'use');
    const launch = jest.spyOn(Telegraf.prototype, 'launch');

    const bot = await createBotFactory({
      token: 'test-token',
      launchOptions: false,
      middlewares: [middleware],
    });

    expect(use).toHaveBeenCalledWith(middleware);
    expect(launch).not.toHaveBeenCalled();

    stopBot(bot);
  });

  it('prefers middlewaresBefore over the deprecated middlewares alias', async () => {
    const beforeMiddleware = jest.fn();
    const legacyMiddleware = jest.fn();
    const use = jest.spyOn(Telegraf.prototype, 'use');

    const bot = await createBotFactory({
      token: 'test-token',
      launchOptions: false,
      middlewaresBefore: [beforeMiddleware],
      middlewares: [legacyMiddleware],
    });

    expect(use).toHaveBeenCalledWith(beforeMiddleware);
    expect(use).not.toHaveBeenCalledWith(legacyMiddleware);

    stopBot(bot);
  });

  it('does not register an error handler when logging is disabled', async () => {
    const catchHandler = jest.spyOn(Telegraf.prototype, 'catch');

    const bot = await createBotFactory({
      token: 'test-token',
      launchOptions: false,
      useCatchLogger: false,
    });

    expect(catchHandler).not.toHaveBeenCalled();

    stopBot(bot);
  });

  it('passes normalized errors and context to a custom error handler', async () => {
    const useCatchLogger = jest.fn();
    const catchHandler = jest.spyOn(Telegraf.prototype, 'catch');
    const context = { updateType: 'message' };
    const bot = await createBotFactory({
      token: 'test-token',
      launchOptions: false,
      useCatchLogger,
    });
    const handler = catchHandler.mock.calls[0]?.[0];

    if (!handler) {
      throw new Error('Telegraf catch handler was not registered');
    }

    await handler('unexpected failure', context as never);

    expect(useCatchLogger).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'unexpected failure' }),
      context,
    );

    stopBot(bot);
  });

  it('logs normalized update errors through Nest logger by default', async () => {
    const logger = jest.spyOn(Logger, 'error').mockImplementation();
    const catchHandler = jest.spyOn(Telegraf.prototype, 'catch');
    const bot = await createBotFactory({
      token: 'test-token',
      launchOptions: false,
    });
    const handler = catchHandler.mock.calls[0]?.[0];

    if (!handler) {
      throw new Error('Telegraf catch handler was not registered');
    }

    await handler('unexpected failure', {
      botInfo: { username: 'test_bot' },
      updateType: 'message',
    } as never);

    expect(logger).toHaveBeenCalledWith(
      'OnUpdateType(message): unexpected failure',
      expect.anything(),
      'Telegraf: test_bot',
    );

    stopBot(bot);
  });

  it('launches with explicit options and handles launch failures', async () => {
    const launchError = new Error('launch failed');
    const useCatchLogger = jest.fn();
    const launch = jest
      .spyOn(Telegraf.prototype, 'launch')
      .mockRejectedValue(launchError);

    const bot = await createBotFactory({
      token: 'test-token',
      launchOptions: { dropPendingUpdates: true },
      useCatchLogger,
    });
    await waitForMicrotasks();

    expect(launch).toHaveBeenCalledWith({ dropPendingUpdates: true });
    expect(useCatchLogger).toHaveBeenCalledWith(launchError);

    stopBot(bot);
  });

  it('logs launch failures through Nest logger when no custom handler exists', async () => {
    const launchError = new Error('launch failed');
    const logger = jest.spyOn(Logger, 'error').mockImplementation();
    jest.spyOn(Telegraf.prototype, 'launch').mockRejectedValue(launchError);

    const bot = await createBotFactory({ token: 'test-token' });
    await waitForMicrotasks();

    expect(logger).toHaveBeenCalledWith(
      'Failed to launch bot: launch failed',
      launchError.stack,
      'Telegraf',
    );

    stopBot(bot);
  });

  it('launches without arguments when options are omitted', async () => {
    const launch = jest.spyOn(Telegraf.prototype, 'launch').mockResolvedValue();

    const bot = await createBotFactory({ token: 'test-token' });

    expect(launch).toHaveBeenCalledWith();

    stopBot(bot);
  });
});

function stopBot(bot: Telegraf): void {
  try {
    bot.stop();
  } catch (error) {
    if (!(error instanceof Error) || error.message !== 'Bot is not running!') {
      throw error;
    }
  }
}

async function waitForMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
