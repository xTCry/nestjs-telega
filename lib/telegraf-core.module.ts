import {
  DynamicModule,
  FactoryProvider,
  Global,
  Module,
  OnApplicationShutdown,
  Provider,
  Type,
} from '@nestjs/common';
import {
  DiscoveryModule,
  ExternalContextCreator,
  MetadataScanner,
  ModuleRef,
  ModulesContainer,
  Reflector,
} from '@nestjs/core';
import type { Context, Scenes, Telegraf } from 'telegraf';

import {
  TelegrafModuleAsyncOptions,
  TelegrafModuleOptions,
  TelegrafOptionsFactory,
} from './interfaces';
import { ListenersExplorerService } from './services';
import { createTelegrafStageProvider } from './stage.provider';
import {
  allBotsMap,
  telegrafAllBotsProvider,
} from './telegraf-all-bots.provider';
import { DEFAULT_BOT_NAME } from './telegraf.constants';
import {
  createBotFactory,
  getBotToken,
  getTelegrafBotNameToken,
  getTelegrafListenersExplorerToken,
  getTelegrafModuleOptionsToken,
  getTelegrafShutdownServiceToken,
  getTelegrafStageToken,
} from './utils';

const isDefaultBotName = (botName?: string): boolean =>
  !botName || botName === DEFAULT_BOT_NAME;

/** Создаёт discovery-сервис, изолированный для конкретного bot instance. */
const createListenersExplorerProvider = (
  botName?: string,
): FactoryProvider => ({
  provide: getTelegrafListenersExplorerToken(botName),
  useFactory: (
    reflector: Reflector,
    moduleRef: ModuleRef,
    metadataScanner: MetadataScanner,
    modulesContainer: ModulesContainer,
    externalContextCreator: ExternalContextCreator,
    stage: Scenes.Stage<Scenes.WizardContext>,
    telegrafOptions: TelegrafModuleOptions,
    botToken: string,
  ) =>
    new ListenersExplorerService(
      reflector,
      moduleRef,
      metadataScanner,
      modulesContainer,
      externalContextCreator,
      stage,
      telegrafOptions,
      botToken,
    ),
  inject: [
    Reflector,
    ModuleRef,
    MetadataScanner,
    ModulesContainer,
    ExternalContextCreator,
    getTelegrafStageToken(botName),
    getTelegrafModuleOptionsToken(botName),
    getTelegrafBotNameToken(botName),
  ],
});

/** Сохраняет возможность получить explorer default-бота по class token. */
const createDefaultListenersExplorerAliasProvider = (): Provider => ({
  provide: ListenersExplorerService,
  useExisting: getTelegrafListenersExplorerToken(),
});

/** Останавливает и удаляет из реестра только bot instance текущего модуля. */
const createTelegrafShutdownProvider = (botName?: string): FactoryProvider => {
  const botToken = getBotToken(botName);

  return {
    provide: getTelegrafShutdownServiceToken(botName),
    useFactory: (moduleRef: ModuleRef): OnApplicationShutdown => ({
      onApplicationShutdown(): void {
        const bot = moduleRef.get<Telegraf<Context> | undefined>(botToken, {
          strict: false,
        });
        bot?.stop();
        allBotsMap.delete(botToken);
      },
    }),
    inject: [ModuleRef],
  };
};

const createDefaultCompatibilityProviders = (botName?: string): Provider[] => {
  if (!isDefaultBotName(botName)) {
    return [];
  }

  return [createDefaultListenersExplorerAliasProvider()];
};

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [],
})
export class TelegrafCoreModule {
  public static forRoot(options: TelegrafModuleOptions): DynamicModule {
    const botToken = getBotToken(options.botName);
    const botNameProvider = {
      provide: getTelegrafBotNameToken(options.botName),
      useValue: botToken,
    };
    const botProvider: Provider = {
      provide: botToken,
      useFactory: async () => {
        const bot = await createBotFactory(options);
        allBotsMap.set(botToken, bot);
        return bot;
      },
    };
    const providers = [
      botNameProvider,
      botProvider,
      createTelegrafStageProvider(options.botName),
      createListenersExplorerProvider(options.botName),
      createTelegrafShutdownProvider(options.botName),
      telegrafAllBotsProvider,
      ...createDefaultCompatibilityProviders(options.botName),
    ];

    return {
      module: TelegrafCoreModule,
      providers: [
        {
          provide: getTelegrafModuleOptionsToken(options.botName),
          useValue: options,
        },
        ...providers,
      ],
      exports: providers,
    };
  }

  public static forRootAsync(
    options: TelegrafModuleAsyncOptions,
  ): DynamicModule {
    const botToken = getBotToken(options.botName);
    const botNameProvider = {
      provide: getTelegrafBotNameToken(options.botName),
      useValue: botToken,
    };
    const botProvider: Provider = {
      provide: botToken,
      useFactory: async (telegrafOptions: TelegrafModuleOptions) => {
        const bot = await createBotFactory(telegrafOptions);
        allBotsMap.set(botToken, bot);
        return bot;
      },
      inject: [getTelegrafModuleOptionsToken(options.botName)],
    };
    const providers = [
      botNameProvider,
      botProvider,
      createTelegrafStageProvider(options.botName),
      createListenersExplorerProvider(options.botName),
      createTelegrafShutdownProvider(options.botName),
      telegrafAllBotsProvider,
      ...createDefaultCompatibilityProviders(options.botName),
    ];

    return {
      module: TelegrafCoreModule,
      imports: options.imports,
      providers: [...this.createAsyncProviders(options), ...providers],
      exports: providers,
    };
  }

  private static createAsyncProviders(
    options: TelegrafModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    const useClass = options.useClass;
    if (!useClass) {
      return [this.createAsyncOptionsProvider(options)];
    }

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: TelegrafModuleAsyncOptions,
  ): Provider {
    const optionsToken = getTelegrafModuleOptionsToken(options.botName);

    if (options.useFactory) {
      return {
        provide: optionsToken,
        useFactory: options.useFactory,
        inject: options.inject ?? [],
      };
    }

    // `as Type<TelegrafOptionsFactory>[]` обходит TypeScript#31603.
    const inject = [
      options.useClass ?? options.useExisting,
    ] as Type<TelegrafOptionsFactory>[];
    return {
      provide: optionsToken,
      useFactory: async (optionsFactory: TelegrafOptionsFactory) =>
        await optionsFactory.createTelegrafOptions(),
      inject,
    };
  }
}
