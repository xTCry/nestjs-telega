import {
  CanActivate,
  Catch,
  ExceptionFilter,
  ExecutionContext,
  Injectable,
  Module,
  PipeTransform,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { CallHandler, NestInterceptor } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  Scenes,
  session,
  Telegraf,
  Composer as TelegrafComposer,
  Context as TelegrafContext,
  Telegram,
} from 'telegraf-hardened';

import {
  Composer as ComposerDecorator,
  Ctx,
  Hears,
  Message,
  Next,
  On,
  ReplyOptions,
  Scene,
  SceneEnter,
  SceneLeave,
  Sender,
  Update,
  Wizard,
  WizardStep,
} from '../lib/decorators';
import { TELEGRAF_STAGE } from '../lib/telegraf.constants';
import { TelegrafModule } from '../lib/telegraf.module';
import { getBotToken } from '../lib/utils';

describe('ListenersExplorerService', () => {
  it('applies module, class and method reply options to listener results', async () => {
    @ReplyOptions({ parse_mode: 'HTML', disable_notification: true })
    @Update()
    class UpdateHandler {
      @ReplyOptions({ disable_notification: false })
      @On('message')
      onMessage() {
        return {
          text: 'Hello',
          extra: { parse_mode: 'MarkdownV2' },
        };
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
          replyOptions: { link_preview_options: { is_disabled: true } },
        }),
      ],
      providers: [UpdateHandler],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
    const callApi = jest
      .spyOn(Telegram.prototype, 'callApi')
      .mockResolvedValue({ message_id: 1 } as never);
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

    expect(callApi).toHaveBeenCalledWith('sendMessage', {
      chat_id: 1,
      text: 'Hello',
      parse_mode: 'MarkdownV2',
      disable_notification: false,
      link_preview_options: { is_disabled: true },
    });

    await moduleRef.close();
  });

  it('discovers and registers an update listener', async () => {
    const handleMessage = jest.fn();

    @Update()
    class UpdateHandler {
      @On('message')
      onMessage(): void {
        handleMessage();
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
        }),
      ],
      providers: [UpdateHandler],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
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

    expect(handleMessage).toHaveBeenCalledTimes(1);

    await moduleRef.close();
  });

  it('registers base and wizard scenes in the stage', async () => {
    @Scene('base-scene')
    class BaseSceneHandler {}

    @Wizard('wizard-scene')
    class WizardSceneHandler {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
          useCatchLogger: false,
        }),
      ],
      providers: [BaseSceneHandler, WizardSceneHandler],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
    const stage =
      moduleRef.get<Scenes.Stage<Scenes.WizardContext>>(TELEGRAF_STAGE);

    expect(stage.scenes).toEqual(
      expect.objectContaining({
        size: 2,
      }),
    );
    expect(stage.scenes.has('base-scene')).toBe(true);
    expect(stage.scenes.has('wizard-scene')).toBe(true);

    await moduleRef.close();
  });

  it('runs composer listeners before update listeners', async () => {
    const calls: string[] = [];

    @ComposerDecorator()
    class ComposerHandler {
      @On('message')
      async onMessage(@Next() next: () => Promise<void>): Promise<void> {
        calls.push('composer');
        await next();
      }
    }

    @Update()
    class UpdateHandler {
      @On('message')
      onMessage(): void {
        calls.push('update');
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
          middlewares: [session()],
        }),
      ],
      providers: [ComposerHandler, UpdateHandler],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
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

    expect(calls).toEqual(['composer', 'update']);

    await moduleRef.close();
  });

  it('runs before, stage, update and after middlewares in order', async () => {
    const calls: string[] = [];

    @ComposerDecorator()
    class ComposerHandler {
      @On('message')
      async onMessage(@Next() next: () => Promise<void>): Promise<void> {
        calls.push('composer');
        await next();
      }
    }

    @Update()
    class UpdateHandler {
      @On('message')
      async onMessage(@Next() next: () => Promise<void>): Promise<void> {
        calls.push('update');
        await next();
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
          middlewaresBefore: [
            async (_context, next): Promise<void> => {
              calls.push('before');
              await next();
            },
            session(),
          ],
          middlewaresAfter: [
            async (_context, next): Promise<void> => {
              calls.push('after');
              await next();
            },
          ],
        }),
      ],
      providers: [ComposerHandler, UpdateHandler],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
    bot.botInfo = getTestBotInfo();
    await bot.handleUpdate(createTextMessageUpdate(1, 'Hello'));

    expect(calls).toEqual(['before', 'composer', 'update', 'after']);

    await moduleRef.close();
  });

  it('registers wizard steps in their numeric order', async () => {
    const calls: string[] = [];

    @Wizard('wizard-scene')
    class WizardSceneHandler {
      @WizardStep(1)
      @On('message')
      secondStep(): void {
        calls.push('second');
      }

      @WizardStep(0)
      @On('message')
      firstStep(): void {
        calls.push('first');
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
        }),
      ],
      providers: [WizardSceneHandler],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
    const stage =
      moduleRef.get<Scenes.Stage<Scenes.WizardContext>>(TELEGRAF_STAGE);
    const scene = stage.scenes.get('wizard-scene');

    expect(scene).toBeInstanceOf(Scenes.WizardScene);
    if (!(scene instanceof Scenes.WizardScene)) {
      throw new Error('Wizard scene was not registered');
    }
    expect(scene.steps).toHaveLength(2);

    const context = new TelegrafContext(
      {
        update_id: 1,
        message: {
          chat: { first_name: 'Test', id: 1, type: 'private' },
          date: 0,
          from: { first_name: 'Test', id: 1, is_bot: false },
          message_id: 1,
          text: 'Hello',
        },
      },
      bot.telegram,
      {
        first_name: 'Test bot',
        id: 1,
        is_bot: true,
        username: 'test_bot',
        can_join_groups: true,
        can_read_all_group_messages: false,
        supports_inline_queries: false,
      },
    );
    await TelegrafComposer.unwrap(scene.steps[0])(
      context,
      (): Promise<void> => Promise.resolve(),
    );
    await TelegrafComposer.unwrap(scene.steps[1])(
      context,
      (): Promise<void> => Promise.resolve(),
    );

    expect(calls).toEqual(['first', 'second']);

    await moduleRef.close();
  });

  it('registers scene enter and leave listeners', async () => {
    const calls: string[] = [];

    @Scene('base-scene')
    class BaseSceneHandler {
      @SceneEnter()
      onEnter(): void {
        calls.push('enter');
      }

      @SceneLeave()
      onLeave(): void {
        calls.push('leave');
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
        }),
      ],
      providers: [BaseSceneHandler],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
    const stage =
      moduleRef.get<Scenes.Stage<Scenes.WizardContext>>(TELEGRAF_STAGE);
    const scene = stage.scenes.get('base-scene');

    expect(scene).toBeInstanceOf(Scenes.BaseScene);
    if (!(scene instanceof Scenes.BaseScene)) {
      throw new Error('Base scene was not registered');
    }

    const context = new TelegrafContext(
      {
        update_id: 1,
        message: {
          chat: { first_name: 'Test', id: 1, type: 'private' },
          date: 0,
          from: { first_name: 'Test', id: 1, is_bot: false },
          message_id: 1,
          text: 'Hello',
        },
      },
      bot.telegram,
      {
        first_name: 'Test bot',
        id: 1,
        is_bot: true,
        username: 'test_bot',
        can_join_groups: true,
        can_read_all_group_messages: false,
        supports_inline_queries: false,
      },
    );
    const sceneContext = context as unknown as Scenes.WizardContext;
    await scene.enterHandler(
      sceneContext,
      (): Promise<void> => Promise.resolve(),
    );
    await scene.leaveHandler(
      sceneContext,
      (): Promise<void> => Promise.resolve(),
    );

    expect(calls).toEqual(['enter', 'leave']);

    await moduleRef.close();
  });

  it('applies Nest guards, pipes, and interceptors to update listeners', async () => {
    const calls: string[] = [];

    @Injectable()
    class AllowGuard implements CanActivate {
      canActivate(context: ExecutionContext): boolean {
        calls.push(`guard:${context.getType<string>()}`);
        return true;
      }
    }

    @Injectable()
    class UpperCasePipe implements PipeTransform<string, string> {
      transform(value: string): string {
        calls.push('pipe');
        return value.toUpperCase();
      }
    }

    @Injectable()
    class TrackingInterceptor implements NestInterceptor {
      intercept(
        context: ExecutionContext,
        next: CallHandler,
      ): ReturnType<CallHandler['handle']> {
        calls.push(`interceptor:${context.getType<string>()}`);
        return next.handle();
      }
    }

    @Update()
    class UpdateHandler {
      @On('message')
      @UseGuards(AllowGuard)
      @UseInterceptors(TrackingInterceptor)
      onMessage(@Message('text', UpperCasePipe) text: string): void {
        calls.push(`listener:${text}`);
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
        }),
      ],
      providers: [
        AllowGuard,
        TrackingInterceptor,
        UpdateHandler,
        UpperCasePipe,
      ],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
    bot.botInfo = getTestBotInfo();
    await bot.handleUpdate(createTextMessageUpdate(1, 'Hello'));

    expect(calls).toEqual([
      'guard:telegraf',
      'interceptor:telegraf',
      'pipe',
      'listener:HELLO',
    ]);

    await moduleRef.close();
  });

  it('limits discovery to explicitly included modules', async () => {
    const calls: string[] = [];

    @Update()
    class IncludedUpdateHandler {
      @On('message')
      onMessage(): void {
        calls.push('included');
      }
    }

    @Update()
    class ExcludedUpdateHandler {
      @On('message')
      onMessage(): void {
        calls.push('excluded');
      }
    }

    @Module({ providers: [IncludedUpdateHandler] })
    class IncludedModule {}

    @Module({ providers: [ExcludedUpdateHandler] })
    class ExcludedModule {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
          include: [IncludedModule],
        }),
        IncludedModule,
        ExcludedModule,
      ],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
    bot.botInfo = getTestBotInfo();
    await bot.handleUpdate(createTextMessageUpdate(1, 'Hello'));

    expect(calls).toEqual(['included']);

    await moduleRef.close();
  });

  it('rejects duplicate scene identifiers during discovery', async () => {
    @Scene('duplicate-scene')
    class FirstSceneHandler {}

    @Scene('duplicate-scene')
    class SecondSceneHandler {}

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
        }),
      ],
      providers: [FirstSceneHandler, SecondSceneHandler],
    }).compile();
    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);

    await expect(moduleRef.init()).rejects.toThrow(
      'Duplicate scene id "duplicate-scene" for bot "DEFAULT_BOT_NAME": ' +
        'FirstSceneHandler conflicts with SecondSceneHandler',
    );
  });

  it('does not register wizard lifecycle methods as wizard steps', async () => {
    const calls: string[] = [];

    @Wizard('lifecycle-wizard')
    class WizardSceneHandler {
      @SceneEnter()
      @WizardStep(0)
      onEnter(): void {
        calls.push('enter');
      }

      @WizardStep(0)
      @On('message')
      firstStep(): void {
        calls.push('step');
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
        }),
      ],
      providers: [WizardSceneHandler],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
    const stage =
      moduleRef.get<Scenes.Stage<Scenes.WizardContext>>(TELEGRAF_STAGE);
    const scene = stage.scenes.get('lifecycle-wizard');

    expect(scene).toBeInstanceOf(Scenes.WizardScene);
    if (!(scene instanceof Scenes.WizardScene)) {
      throw new Error('Wizard scene was not registered');
    }
    expect(scene.steps).toHaveLength(1);

    const context = createTelegrafContext(bot);
    await scene.enterHandler(
      context as unknown as Scenes.WizardContext,
      (): Promise<void> => Promise.resolve(),
    );
    await TelegrafComposer.unwrap(scene.steps[0])(
      context,
      (): Promise<void> => Promise.resolve(),
    );

    expect(calls).toEqual(['enter', 'step']);

    await moduleRef.close();
  });

  it('registers every chained listener decorator in declaration order', async () => {
    const calls: string[] = [];

    @Update()
    class UpdateHandler {
      @On('message')
      @Hears('Hello')
      async onMessage(@Next() next: () => Promise<void>): Promise<void> {
        calls.push('listener');
        await next();
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
        }),
      ],
      providers: [UpdateHandler],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
    bot.botInfo = getTestBotInfo();
    await bot.handleUpdate(createTextMessageUpdate(1, 'Hello'));

    expect(calls).toEqual(['listener', 'listener']);

    await moduleRef.close();
  });

  it('applies Nest exception filters to update listeners', async () => {
    const caughtErrors: string[] = [];

    @Catch(Error)
    @Injectable()
    class UpdateExceptionFilter implements ExceptionFilter {
      catch(exception: Error, context: ExecutionContext): boolean {
        caughtErrors.push(`${context.getType<string>()}:${exception.message}`);
        return true;
      }
    }

    @Update()
    class UpdateHandler {
      @On('message')
      @UseFilters(UpdateExceptionFilter)
      onMessage(): void {
        throw new Error('listener failed');
      }
    }

    const filterLogger = jest.fn();
    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
          useCatchLogger: filterLogger,
        }),
      ],
      providers: [UpdateExceptionFilter, UpdateHandler],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
    bot.botInfo = getTestBotInfo();
    jest.spyOn(Telegram.prototype, 'callApi').mockResolvedValue({} as never);
    await expect(
      bot.handleUpdate(createTextMessageUpdate(1, 'Hello')),
    ).resolves.toBeUndefined();

    expect(caughtErrors).toEqual(['telegraf:listener failed']);
    expect(filterLogger).not.toHaveBeenCalled();

    await moduleRef.close();
  });

  it('forwards next() from scene and wizard listeners', async () => {
    const calls: string[] = [];

    @Scene('next-scene')
    class BaseSceneHandler {
      @On('message')
      async onMessage(@Next() next: () => Promise<void>): Promise<void> {
        calls.push('scene');
        await next();
      }
    }

    @Wizard('next-wizard')
    class WizardSceneHandler {
      @WizardStep(0)
      @On('message')
      async firstStep(@Next() next: () => Promise<void>): Promise<void> {
        calls.push('wizard');
        await next();
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
        }),
      ],
      providers: [BaseSceneHandler, WizardSceneHandler],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
    const stage =
      moduleRef.get<Scenes.Stage<Scenes.WizardContext>>(TELEGRAF_STAGE);
    const baseScene = stage.scenes.get('next-scene');
    const wizardScene = stage.scenes.get('next-wizard');

    expect(baseScene).toBeInstanceOf(Scenes.BaseScene);
    expect(wizardScene).toBeInstanceOf(Scenes.WizardScene);
    if (
      !(baseScene instanceof Scenes.BaseScene) ||
      !(wizardScene instanceof Scenes.WizardScene)
    ) {
      throw new Error('Scenes were not registered');
    }

    const context = createTelegrafContext(bot);
    let sceneNextCalls = 0;
    await baseScene.middleware()(
      context as unknown as Scenes.WizardContext,
      (): Promise<void> => {
        sceneNextCalls += 1;
        return Promise.resolve();
      },
    );
    let wizardNextCalls = 0;
    await TelegrafComposer.unwrap(wizardScene.steps[0])(
      context,
      (): Promise<void> => {
        wizardNextCalls += 1;
        return Promise.resolve();
      },
    );

    expect(calls).toEqual(['scene', 'wizard']);
    expect(sceneNextCalls).toBe(1);
    expect(wizardNextCalls).toBe(1);

    await moduleRef.close();
  });

  it('runs active scene handlers between composer and update handlers', async () => {
    const calls: string[] = [];

    @ComposerDecorator()
    class ComposerHandler {
      @On('message')
      async onMessage(@Next() next: () => Promise<void>): Promise<void> {
        calls.push('composer');
        await next();
      }
    }

    @Scene('ordered-scene')
    class OrderedScene {
      @On('message')
      async onMessage(@Next() next: () => Promise<void>): Promise<void> {
        calls.push('scene');
        await next();
      }
    }

    @Update()
    class UpdateHandler {
      @Hears('enter')
      async enterScene(@Ctx() ctx: Scenes.WizardContext): Promise<void> {
        calls.push('enter');
        await ctx.scene.enter('ordered-scene');
      }

      @On('message')
      async onMessage(@Next() next: () => Promise<void>): Promise<void> {
        calls.push('update');
        await next();
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
          middlewaresBefore: [session()],
          middlewaresAfter: [
            async (_context, next): Promise<void> => {
              calls.push('after');
              await next();
            },
          ],
        }),
      ],
      providers: [ComposerHandler, OrderedScene, UpdateHandler],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
    bot.botInfo = getTestBotInfo();
    await bot.handleUpdate(createTextMessageUpdate(1, 'enter'));
    calls.length = 0;

    await bot.handleUpdate(createTextMessageUpdate(2, 'Hello'));

    expect(calls).toEqual(['composer', 'scene', 'update', 'after']);

    await moduleRef.close();
  });

  it('extracts sender properties through parameter decorators', async () => {
    const handleSender = jest.fn();

    @Update()
    class UpdateHandler {
      @On('message')
      onMessage(@Sender('id') senderId: number): void {
        handleSender(senderId);
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [
        TelegrafModule.forRoot({
          token: '1:test-token',
          launchOptions: false,
        }),
      ],
      providers: [UpdateHandler],
    }).compile();
    await moduleRef.init();

    const bot = moduleRef.get<Telegraf>(getBotToken());
    jest.spyOn(bot, 'stop').mockImplementation(() => undefined);
    bot.botInfo = getTestBotInfo();
    await bot.handleUpdate(createTextMessageUpdate(1, 'Hello'));

    expect(handleSender).toHaveBeenCalledWith(1);

    await moduleRef.close();
  });
});

function createTextMessageUpdate(updateId: number, text: string) {
  return {
    update_id: updateId,
    message: {
      chat: { first_name: 'Test', id: 1, type: 'private' as const },
      date: 0,
      from: { first_name: 'Test', id: 1, is_bot: false },
      message_id: updateId,
      text,
    },
  };
}

function getTestBotInfo() {
  return {
    first_name: 'Test bot',
    id: 1,
    is_bot: true as const,
    username: 'test_bot',
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: false,
  };
}

function createTelegrafContext(bot: Telegraf): TelegrafContext {
  return new TelegrafContext(
    createTextMessageUpdate(1, 'Hello') as TelegrafContext['update'],
    bot.telegram,
    getTestBotInfo(),
  );
}
