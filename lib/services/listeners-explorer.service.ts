import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef, ModulesContainer, Reflector } from '@nestjs/core';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ParamMetadata } from '@nestjs/core/helpers/interfaces';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { MiddlewareFn, Scenes, Telegraf } from 'telegraf-hardened';

import { TelegrafReplyOptions as TelegrafReplyOptionsDecorator } from '../decorators/core';
import { TelegrafContextType } from '../execution-context';
import { TelegrafParamsFactory } from '../factories/telegraf-params-factory';
import type {
  TelegrafListenerResult,
  TelegrafModuleOptions,
  TelegrafReplyExtra,
} from '../interfaces';
import { PARAM_ARGS_METADATA } from '../telegraf.constants';
import { applyListenerResult } from '../utils';
import {
  ListenerRegistrarService,
  TelegrafListenerFactory,
  UpdateListenerProvider,
} from './listener-registrar.service';

type TelegrafMethod = (...args: unknown[]) => unknown;
type TelegrafPrototype = Record<string, TelegrafMethod>;
type TelegrafSceneContext = Scenes.WizardContext;
type TelegrafListenerCallback = MiddlewareFn<TelegrafSceneContext>;

/** Находит декорированные providers и подключает их к текущему bot instance. */
@Injectable()
export class ListenersExplorerService implements OnModuleInit {
  private readonly telegrafParamsFactory = new TelegrafParamsFactory();
  private readonly listenerRegistrar: ListenerRegistrarService;
  private bot!: Telegraf<TelegrafSceneContext>;

  public constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
    metadataScanner: MetadataScanner,
    private readonly modulesContainer: ModulesContainer,
    private readonly externalContextCreator: ExternalContextCreator,

    private readonly stage: Scenes.Stage<TelegrafSceneContext>,
    private readonly telegrafOptions: TelegrafModuleOptions,
    private readonly botName: string,
  ) {
    this.listenerRegistrar = new ListenerRegistrarService(
      reflector,
      metadataScanner,
      this.createReplyingListener.bind(this) as TelegrafListenerFactory,
      botName,
      telegrafOptions.listenerDiagnostics,
    );
  }

  public onModuleInit(): void {
    this.bot = this.moduleRef.get<Telegraf<TelegrafSceneContext>>(
      this.botName,
      { strict: false },
    );

    const discoveredProviders = this.getProviders(
      this.getModules(this.telegrafOptions.include ?? []),
    );
    const providers = discoveredProviders.map(({ wrapper }) => wrapper);
    this.listenerRegistrar.registerBeforeStage(providers, this.stage);
    this.bot.use(this.stage.middleware());
    this.listenerRegistrar.registerUpdates(discoveredProviders, this.bot);
    this.bot.use(...(this.telegrafOptions.middlewaresAfter ?? []));
  }

  private getModules(include: Function[]): Module[] {
    const modules = [...this.modulesContainer.values()];
    return include.length === 0
      ? modules
      : modules.filter(({ metatype }) => include.includes(metatype));
  }

  /** Исключает повторный discovery одного provider-а в текущем bot instance. */
  private getProviders(modules: Module[]): UpdateListenerProvider[] {
    const providers: UpdateListenerProvider[] = [];
    const metatypes = new Set<Function>();

    for (const moduleRef of modules) {
      for (const wrapper of moduleRef.providers.values()) {
        if (
          !wrapper.instance ||
          !wrapper.metatype ||
          metatypes.has(wrapper.metatype)
        ) {
          continue;
        }

        metatypes.add(wrapper.metatype);
        providers.push({
          wrapper: wrapper as InstanceWrapper<object>,
          moduleName: moduleRef.metatype?.name ?? 'AnonymousModule',
        });
      }
    }

    return providers;
  }

  private createReplyingListener(
    instance: object,
    prototype: TelegrafPrototype,
    methodName: string,
  ): TelegrafListenerCallback | undefined {
    const methodRef = prototype[methodName];
    const callback = this.createContextCallback(
      instance,
      prototype,
      methodName,
    );
    if (!callback || typeof methodRef !== 'function') {
      return undefined;
    }

    const replyOptions = this.getMergedReplyOptions(instance, methodRef);

    return async (ctx, next): Promise<void> => {
      const result = (await callback(ctx, next)) as TelegrafListenerResult;
      await applyListenerResult(ctx, result, replyOptions);
    };
  }

  /** Объединяет module-, class- и method-level параметры ответа. */
  private getMergedReplyOptions(
    instance: object,
    methodRef: TelegrafMethod,
  ): TelegrafReplyExtra {
    return {
      ...this.telegrafOptions.replyOptions,
      ...this.reflector.getAllAndMerge<TelegrafReplyExtra>(
        TelegrafReplyOptionsDecorator,
        [instance.constructor, methodRef],
      ),
    };
  }

  private createContextCallback(
    instance: object,
    prototype: TelegrafPrototype,
    methodName: string,
  ): TelegrafListenerCallback | undefined {
    const methodRef = prototype[methodName];
    if (typeof methodRef !== 'function') {
      return undefined;
    }

    return this.externalContextCreator.create<
      Record<number, ParamMetadata>,
      TelegrafContextType
    >(
      instance,
      methodRef,
      methodName,
      PARAM_ARGS_METADATA,
      this.telegrafParamsFactory,
      undefined,
      undefined,
      { guards: true, filters: true, interceptors: true },
      'telegraf',
    ) as TelegrafListenerCallback;
  }
}
