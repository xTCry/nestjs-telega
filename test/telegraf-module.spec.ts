import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Scenes, Telegraf } from 'telegraf';

import { InjectBot, On, Update } from '../lib/decorators';
import type { TelegrafOptionsFactory } from '../lib/interfaces';
import { ListenersExplorerService } from '../lib/services';
import { allBotsMap } from '../lib/telegraf-all-bots.provider';
import { TelegrafModule } from '../lib/telegraf.module';
import {
  getBotToken,
  getTelegrafListenersExplorerToken,
  getTelegrafModuleOptionsToken,
  getTelegrafStageToken,
} from '../lib/utils';

describe('TelegrafModule', () => {
  afterEach(() => {
    allBotsMap.clear();
  });

  it('registers a named bot without launching it', async () => {
    const botName = 'reminder';
    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          botName,
          token: 'test-token',
          launchOptions: false,
        }),
      ],
    }).compile();
    const bot = moduleRef.get<Telegraf>(getBotToken(botName));
    expect(allBotsMap.get(getBotToken(botName))).toBe(bot);

    await moduleRef.close();

    expect(allBotsMap.has(getBotToken(botName))).toBe(false);
  });

  it('registers an asynchronously configured default bot', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRootAsync({
          useFactory: () => ({
            token: 'test-token',
            launchOptions: false,
          }),
        }),
      ],
    }).compile();
    const bot = moduleRef.get<Telegraf>(getBotToken());
    expect(allBotsMap.get(getBotToken())).toBe(bot);

    await moduleRef.close();

    expect(allBotsMap.has(getBotToken())).toBe(false);
  });

  it('isolates core providers for default and named bots', async () => {
    const botName = 'reminder';
    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: 'default-token',
          launchOptions: false,
        }),
        TelegrafModule.forRoot({
          botName,
          token: 'reminder-token',
          launchOptions: false,
        }),
      ],
    }).compile();
    const defaultBot = moduleRef.get<Telegraf>(getBotToken());
    const reminderBot = moduleRef.get<Telegraf>(getBotToken(botName));
    const defaultStage = moduleRef.get<Scenes.Stage<Scenes.WizardContext>>(
      getTelegrafStageToken(),
    );
    const reminderStage = moduleRef.get<Scenes.Stage<Scenes.WizardContext>>(
      getTelegrafStageToken(botName),
    );

    expect(defaultBot).not.toBe(reminderBot);
    expect(allBotsMap.get(getBotToken())).toBe(defaultBot);
    expect(allBotsMap.get(getBotToken(botName))).toBe(reminderBot);
    expect(defaultStage).not.toBe(reminderStage);
    expect(moduleRef.get(ListenersExplorerService)).toBe(
      moduleRef.get(getTelegrafListenersExplorerToken()),
    );
    expect(moduleRef.get(getTelegrafListenersExplorerToken())).not.toBe(
      moduleRef.get(getTelegrafListenersExplorerToken(botName)),
    );
    expect(moduleRef.get(getTelegrafModuleOptionsToken())).toEqual(
      expect.objectContaining({ token: 'default-token' }),
    );
    expect(moduleRef.get(getTelegrafModuleOptionsToken(botName))).toEqual(
      expect.objectContaining({ token: 'reminder-token' }),
    );

    const defaultStop = jest
      .spyOn(defaultBot, 'stop')
      .mockImplementation(() => undefined);
    const reminderStop = jest
      .spyOn(reminderBot, 'stop')
      .mockImplementation(() => undefined);

    await moduleRef.close();

    expect(defaultStop).toHaveBeenCalledTimes(1);
    expect(reminderStop).toHaveBeenCalledTimes(1);
    expect(allBotsMap.size).toBe(0);
  });

  it('keeps async options isolated for default and named bots', async () => {
    const botName = 'reminder';
    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRootAsync({
          useFactory: () => ({
            token: 'default-token',
            launchOptions: false,
          }),
        }),
        TelegrafModule.forRootAsync({
          botName,
          useFactory: () => ({
            token: 'reminder-token',
            launchOptions: false,
          }),
        }),
      ],
    }).compile();
    const defaultBot = moduleRef.get<Telegraf>(getBotToken());
    const reminderBot = moduleRef.get<Telegraf>(getBotToken(botName));
    jest.spyOn(defaultBot, 'stop').mockImplementation(() => undefined);
    jest.spyOn(reminderBot, 'stop').mockImplementation(() => undefined);

    expect(moduleRef.get(getTelegrafModuleOptionsToken())).toEqual(
      expect.objectContaining({ token: 'default-token' }),
    );
    expect(moduleRef.get(getTelegrafModuleOptionsToken(botName))).toEqual(
      expect.objectContaining({ token: 'reminder-token' }),
    );

    await moduleRef.close();
  });

  it('supports named useClass and default useExisting async options', async () => {
    const botName = 'reminder';

    @Injectable()
    class DefaultOptionsFactory implements TelegrafOptionsFactory {
      createTelegrafOptions() {
        return { token: 'default-token', launchOptions: false as const };
      }
    }

    @Injectable()
    class ReminderOptionsFactory implements TelegrafOptionsFactory {
      createTelegrafOptions() {
        return { token: 'reminder-token', launchOptions: false as const };
      }
    }

    @Module({
      providers: [DefaultOptionsFactory],
      exports: [DefaultOptionsFactory],
    })
    class DefaultOptionsModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        DefaultOptionsModule,
        TelegrafModule.forRootAsync({
          imports: [DefaultOptionsModule],
          useExisting: DefaultOptionsFactory,
        }),
        TelegrafModule.forRootAsync({
          botName,
          useClass: ReminderOptionsFactory,
        }),
      ],
    }).compile();
    const defaultBot = moduleRef.get<Telegraf>(getBotToken());
    const reminderBot = moduleRef.get<Telegraf>(getBotToken(botName));

    expect(moduleRef.get(getTelegrafModuleOptionsToken())).toEqual(
      expect.objectContaining({ token: 'default-token' }),
    );
    expect(moduleRef.get(getTelegrafModuleOptionsToken(botName))).toEqual(
      expect.objectContaining({ token: 'reminder-token' }),
    );
    expect(allBotsMap.get(getBotToken())).toBe(defaultBot);
    expect(allBotsMap.get(getBotToken(botName))).toBe(reminderBot);

    await moduleRef.close();
  });

  it('exports named bots for injection into application providers', async () => {
    const botName = 'reminder';

    @Injectable()
    class BotsConsumer {
      constructor(
        @InjectBot() readonly defaultBot: Telegraf,
        @InjectBot(botName) readonly reminderBot: Telegraf,
      ) {}
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: 'default-token',
          launchOptions: false,
        }),
        TelegrafModule.forRoot({
          botName,
          token: 'reminder-token',
          launchOptions: false,
        }),
      ],
      providers: [BotsConsumer],
    }).compile();
    const consumer = moduleRef.get(BotsConsumer);

    expect(consumer.defaultBot).toBe(moduleRef.get(getBotToken()));
    expect(consumer.reminderBot).toBe(moduleRef.get(getBotToken(botName)));

    await moduleRef.close();
  });

  it('registers a shared update module once for each named bot', async () => {
    const firstBotName = 'first';
    const secondBotName = 'second';
    const handler = jest.fn();

    @Update()
    class SharedUpdate {
      @On('message')
      onMessage(): void {
        handler();
      }
    }

    @Module({ providers: [SharedUpdate] })
    class SharedUpdatesModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        SharedUpdatesModule,
        TelegrafModule.forRoot({
          botName: firstBotName,
          token: 'first-token',
          launchOptions: false,
          include: [SharedUpdatesModule],
        }),
        TelegrafModule.forRoot({
          botName: secondBotName,
          token: 'second-token',
          launchOptions: false,
          include: [SharedUpdatesModule],
        }),
      ],
    }).compile();
    await moduleRef.init();

    const firstBot = moduleRef.get<Telegraf>(getBotToken(firstBotName));
    const secondBot = moduleRef.get<Telegraf>(getBotToken(secondBotName));
    const botInfo = {
      first_name: 'Test bot',
      id: 1,
      is_bot: true as const,
      username: 'test_bot',
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
    };
    firstBot.botInfo = botInfo;
    secondBot.botInfo = botInfo;
    const update = {
      update_id: 1,
      message: {
        chat: { first_name: 'Test', id: 1, type: 'private' as const },
        date: 0,
        from: { first_name: 'Test', id: 1, is_bot: false },
        message_id: 1,
        text: 'Hello',
      },
    };

    await firstBot.handleUpdate(update);
    await secondBot.handleUpdate(update);

    expect(handler).toHaveBeenCalledTimes(2);

    await moduleRef.close();
  });

  it('does not register a re-exported update provider twice for one bot', async () => {
    const handler = jest.fn();

    @Update()
    class SharedUpdate {
      @On('message')
      onMessage(): void {
        handler();
      }
    }

    @Module({
      providers: [SharedUpdate],
      exports: [SharedUpdate],
    })
    class SharedUpdatesModule {}

    @Module({
      imports: [SharedUpdatesModule],
      exports: [SharedUpdatesModule],
    })
    class ReExportedUpdatesModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        SharedUpdatesModule,
        ReExportedUpdatesModule,
        TelegrafModule.forRoot({
          token: 'test-token',
          launchOptions: false,
          include: [SharedUpdatesModule, ReExportedUpdatesModule],
        }),
      ],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    bot.botInfo = {
      first_name: 'Test bot',
      id: 1,
      is_bot: true,
      username: 'test_bot',
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
    };
    await bot.handleUpdate({
      update_id: 1,
      message: {
        chat: { first_name: 'Test', id: 1, type: 'private' },
        date: 0,
        from: { first_name: 'Test', id: 1, is_bot: false },
        message_id: 1,
        text: 'Hello',
      },
    });

    expect(handler).toHaveBeenCalledTimes(1);

    await moduleRef.close();
  });

  it('registers included update handlers only for their bot', async () => {
    const botName = 'reminder';
    const defaultHandler = jest.fn();
    const reminderHandler = jest.fn();

    @Update()
    class DefaultUpdate {
      @On('message')
      onMessage(): void {
        defaultHandler();
      }
    }

    @Update()
    class ReminderUpdate {
      @On('message')
      onMessage(): void {
        reminderHandler();
      }
    }

    @Module({ providers: [DefaultUpdate] })
    class DefaultUpdatesModule {}

    @Module({ providers: [ReminderUpdate] })
    class ReminderUpdatesModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        DefaultUpdatesModule,
        ReminderUpdatesModule,
        TelegrafModule.forRoot({
          token: 'default-token',
          launchOptions: false,
          include: [DefaultUpdatesModule],
        }),
        TelegrafModule.forRoot({
          botName,
          token: 'reminder-token',
          launchOptions: false,
          include: [ReminderUpdatesModule],
        }),
      ],
    }).compile();
    await moduleRef.init();

    const defaultBot = moduleRef.get<Telegraf>(getBotToken());
    const reminderBot = moduleRef.get<Telegraf>(getBotToken(botName));
    jest.spyOn(defaultBot, 'stop').mockImplementation(() => undefined);
    jest.spyOn(reminderBot, 'stop').mockImplementation(() => undefined);
    const botInfo = {
      first_name: 'Test bot',
      id: 1,
      is_bot: true as const,
      username: 'test_bot',
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
    };
    defaultBot.botInfo = botInfo;
    reminderBot.botInfo = botInfo;
    const update = {
      update_id: 1,
      message: {
        chat: { first_name: 'Test', id: 1, type: 'private' as const },
        date: 0,
        from: { first_name: 'Test', id: 1, is_bot: false },
        message_id: 1,
        text: 'Hello',
      },
    };

    await defaultBot.handleUpdate(update);

    expect(defaultHandler).toHaveBeenCalledTimes(1);
    expect(reminderHandler).not.toHaveBeenCalled();

    await reminderBot.handleUpdate(update);

    expect(defaultHandler).toHaveBeenCalledTimes(1);
    expect(reminderHandler).toHaveBeenCalledTimes(1);

    await moduleRef.close();
  });
});
