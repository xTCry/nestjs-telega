import {
  CanActivate,
  ExecutionContext,
  Injectable,
  PipeTransform,
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
} from 'telegraf';

import {
  Composer as ComposerDecorator,
  Message,
  Next,
  On,
  Scene,
  SceneEnter,
  SceneLeave,
  Update,
  Wizard,
  WizardStep,
} from '../lib/decorators';
import { TELEGRAF_STAGE } from '../lib/telegraf.constants';
import { TelegrafModule } from '../lib/telegraf.module';
import { getBotToken } from '../lib/utils';

describe('ListenersExplorerService', () => {
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
          token: 'test-token',
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
          token: 'test-token',
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
          token: 'test-token',
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
          token: 'test-token',
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
          token: 'test-token',
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
          token: 'test-token',
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
