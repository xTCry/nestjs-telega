import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, ModuleRef, ModulesContainer } from '@nestjs/core';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ParamMetadata } from '@nestjs/core/helpers/interfaces';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { Composer, Context, MiddlewareFn, Scenes, Telegraf } from 'telegraf';

import { TelegrafContextType } from '../execution-context';
import { TelegrafParamsFactory } from '../factories/telegraf-params-factory';
import { ListenerMetadata, TelegrafModuleOptions } from '../interfaces';
import {
  PARAM_ARGS_METADATA,
  TELEGRAF_BOT_NAME,
  TELEGRAF_MODULE_OPTIONS,
  TELEGRAF_STAGE,
} from '../telegraf.constants';
import { BaseExplorerService } from './base-explorer.service';
import { MetadataAccessorService } from './metadata-accessor.service';

@Injectable()
export class ListenersExplorerService
  extends BaseExplorerService
  implements OnModuleInit
{
  private readonly telegrafParamsFactory = new TelegrafParamsFactory();
  private bot!: Telegraf<any>;

  constructor(
    @Inject(TELEGRAF_STAGE)
    private readonly stage: Scenes.Stage<any>,
    @Inject(TELEGRAF_MODULE_OPTIONS)
    private readonly telegrafOptions: TelegrafModuleOptions,
    @Inject(TELEGRAF_BOT_NAME)
    private readonly botName: string,
    private readonly moduleRef: ModuleRef,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataAccessor: MetadataAccessorService,
    private readonly metadataScanner: MetadataScanner,
    private readonly modulesContainer: ModulesContainer,
    private readonly externalContextCreator: ExternalContextCreator,
  ) {
    super();
  }

  onModuleInit(): void {
    this.bot = this.moduleRef.get<Telegraf<any>>(this.botName, {
      strict: false,
    });
    this.explore();

    this.bot.use(this.stage.middleware());

    this.exploreUpdates();
  }

  explore(): void {
    const modules = this.getModules(
      this.modulesContainer,
      this.telegrafOptions.include || [],
    );

    this.registerComposers(modules);
    this.registerScenes(modules);
  }

  exploreUpdates(): void {
    const modules = this.getModules(
      this.modulesContainer,
      this.telegrafOptions.include || [],
    );

    this.registerUpdates(modules);
  }

  private registerComposers(modules: Module[]): void {
    const updates = this.flatMap<InstanceWrapper>(modules, (instance) =>
      this.filterComposers(instance),
    );
    updates.forEach((wrapper) => {
      const composer = new Composer();
      this.registerListeners(composer, wrapper);
      this.stage.use(composer);
    });
  }

  private registerUpdates(modules: Module[]): void {
    const updates = this.flatMap<InstanceWrapper>(modules, (instance) =>
      this.filterUpdates(instance),
    );
    updates.forEach((wrapper) => this.registerListeners(this.bot, wrapper));
  }

  private registerScenes(modules: Module[]): void {
    const scenes = this.flatMap<InstanceWrapper>(modules, (wrapper) =>
      this.filterScenes(wrapper),
    );
    const sceneIds = new Set<string>();
    scenes.forEach((wrapper) => {
      const sceneMetadata = this.metadataAccessor.getSceneMetadata(
        wrapper.instance.constructor,
      );

      if (!sceneMetadata) {
        return;
      }

      const { sceneId, type, options } = sceneMetadata;
      if (sceneIds.has(sceneId)) {
        throw new Error(`Two scenes with the same id ${sceneId} were detected`);
      }
      sceneIds.add(sceneId);

      const scene =
        type === 'base'
          ? new Scenes.BaseScene<any>(sceneId, options || ({} as any))
          : new Scenes.WizardScene<any>(sceneId, options || ({} as any));
      this.stage.register(scene);
      this.registerSceneLifecycleListeners(scene, wrapper);

      if (type === 'base') {
        this.registerListeners(scene, wrapper);
      } else {
        this.registerWizardListeners(scene as Scenes.WizardScene<any>, wrapper);
      }
    });
  }

  /** Регистрирует обработчики входа и выхода, не смешивая их с update-listener-ами. */
  private registerSceneLifecycleListeners(
    scene: Scenes.BaseScene<any>,
    wrapper: InstanceWrapper<unknown>,
  ): void {
    const { instance } = wrapper;
    if (!instance || typeof instance !== 'object') {
      return;
    }

    const prototype = Object.getPrototypeOf(instance) as Record<
      string,
      (...args: any[]) => any
    >;

    this.metadataScanner.scanFromPrototype(
      instance,
      prototype,
      (methodName) => {
        const methodRef = prototype[methodName];
        const listenerCallbackFn = this.createContextCallback(
          instance,
          prototype,
          methodName,
        ) as MiddlewareFn<Context> | undefined;

        if (!listenerCallbackFn) {
          return;
        }

        // Сохраняем единый контракт listener-ов: строковый результат метода
        // автоматически отправляется пользователю, включая enter/leave-события.
        const listener: MiddlewareFn<Context> = async (ctx, next) => {
          const result = await listenerCallbackFn(ctx, next);
          if (result) {
            await ctx.reply(String(result));
          }
        };

        if (this.metadataAccessor.isSceneEnter(methodRef)) {
          scene.enter(listener);
        }

        if (this.metadataAccessor.isSceneLeave(methodRef)) {
          scene.leave(listener);
        }
      },
    );
  }

  private filterComposers(
    wrapper: InstanceWrapper,
  ): InstanceWrapper<unknown> | undefined {
    const { instance } = wrapper;
    if (!instance || !wrapper.metatype) return undefined;

    const isComposer = this.metadataAccessor.isComposer(wrapper.metatype);
    if (!isComposer) return undefined;

    return wrapper;
  }

  private filterUpdates(
    wrapper: InstanceWrapper,
  ): InstanceWrapper<unknown> | undefined {
    const { instance } = wrapper;
    if (!instance || !wrapper.metatype) return undefined;

    const isUpdate = this.metadataAccessor.isUpdate(wrapper.metatype);
    if (!isUpdate) return undefined;

    return wrapper;
  }

  private filterScenes(
    wrapper: InstanceWrapper,
  ): InstanceWrapper<unknown> | undefined {
    const { instance } = wrapper;
    if (!instance || !wrapper.metatype) return undefined;

    const isScene = this.metadataAccessor.isScene(wrapper.metatype);
    if (!isScene) return undefined;

    return wrapper;
  }

  private registerListeners(
    composer: Composer<any>,
    wrapper: InstanceWrapper<unknown>,
  ): void {
    const { instance } = wrapper;
    if (!instance || typeof instance !== 'object') {
      return;
    }

    const prototype = Object.getPrototypeOf(instance) as Record<
      string,
      (...args: any[]) => any
    >;
    this.metadataScanner.scanFromPrototype(instance, prototype, (name) =>
      this.registerIfListener(composer, instance, prototype, name),
    );
  }

  private registerWizardListeners(
    wizard: Scenes.WizardScene<any>,
    wrapper: InstanceWrapper<unknown>,
  ): void {
    const { instance } = wrapper;
    if (!instance || typeof instance !== 'object') {
      return;
    }

    const prototype = Object.getPrototypeOf(instance) as Record<
      string,
      (...args: any[]) => any
    >;

    type WizardMetadata = { step: number; methodName: string };
    const wizardSteps: WizardMetadata[] = [];
    const basicListeners: string[] = [];

    this.metadataScanner.scanFromPrototype(
      instance,
      prototype,
      (methodName) => {
        const methodRef = prototype[methodName];
        const metadata = this.metadataAccessor.getWizardStepMetadata(methodRef);
        if (!metadata) {
          basicListeners.push(methodName);
          return undefined;
        }
        wizardSteps.push({ step: metadata.step, methodName });
      },
    );

    for (const methodName of basicListeners) {
      this.registerIfListener(wizard, instance, prototype, methodName);
    }

    const group = wizardSteps
      .sort((a, b) => a.step - b.step)
      .reduce<{ [key: number]: WizardMetadata[] }>(
        (prev, cur) => ({
          ...prev,
          [cur.step]: [...(prev[cur.step] || []), cur],
        }),
        {},
      );

    wizard.steps = Object.values(group).map((stepsMetadata) => {
      const composer = new Composer();
      stepsMetadata.forEach((stepMethod) => {
        this.registerIfListener(
          composer,
          instance,
          prototype,
          stepMethod.methodName,
          [{ method: 'use', args: [] }],
        );
      });
      return composer.middleware();
    });
  }

  private registerIfListener(
    composer: Composer<any>,
    instance: object,
    prototype: Record<string, (...args: any[]) => any>,
    methodName: string,
    defaultMetadata?: ListenerMetadata[],
  ): void {
    const methodRef = prototype[methodName];
    const metadata =
      this.metadataAccessor.getListenerMetadata(methodRef) || defaultMetadata;
    if (!metadata || metadata.length < 1) {
      return undefined;
    }

    const listenerCallbackFn = this.createContextCallback(
      instance,
      prototype,
      methodName,
    ) as MiddlewareFn<Context> | undefined;

    if (!listenerCallbackFn) {
      return;
    }

    for (const { method, args } of metadata) {
      /* Basic callback */
      // composer[method](...args, listenerCallbackFn);

      /* Complex callback return value handing */
      const register = composer[method as keyof Composer<any>] as unknown as (
        ...middleware: unknown[]
      ) => Composer<any>;

      register.call(
        composer,
        ...args,
        async (ctx: Context, next: () => Promise<void>): Promise<void> => {
          const result = await listenerCallbackFn(ctx, next);
          if (result) {
            await ctx.reply(String(result));
          }
          // TODO-Possible-Feature: Add more supported return types
        },
      );
    }
  }

  private createContextCallback(
    instance: object,
    prototype: Record<string, (...args: any[]) => any>,
    methodName: string,
  ) {
    const paramsFactory = this.telegrafParamsFactory;
    return this.externalContextCreator.create<
      Record<number, ParamMetadata>,
      TelegrafContextType
    >(
      instance,
      prototype[methodName],
      methodName,
      PARAM_ARGS_METADATA,
      paramsFactory,
      undefined,
      undefined,
      { guards: true, filters: true, interceptors: true },
      'telegraf',
    );
  }
}
