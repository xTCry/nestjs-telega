import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  ModuleRef,
  ModulesContainer,
  ReflectableDecorator,
  Reflector,
} from '@nestjs/core';
import { ExternalContextCreator } from '@nestjs/core/helpers/external-context-creator';
import { ParamMetadata } from '@nestjs/core/helpers/interfaces';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { Composer, Context, MiddlewareFn, Scenes, Telegraf } from 'telegraf';
import type { SceneOptions } from 'telegraf/typings/scenes/base';

import {
  Composer as ComposerDecorator,
  SceneMetadataDecorator,
  Update,
} from '../decorators/core';
import {
  SceneEnter,
  SceneLeave,
  WizardStepMetadataDecorator,
} from '../decorators/scene';
import { TelegrafContextType } from '../execution-context';
import { TelegrafParamsFactory } from '../factories/telegraf-params-factory';
import type {
  ListenerMetadata,
  SceneMetadata,
  TelegrafModuleOptions,
} from '../interfaces';
import { PARAM_ARGS_METADATA } from '../telegraf.constants';
import type { ComposerMethodArgs } from '../types';
import { ListenerDecorator } from '../utils';

type TelegrafMethod = (...args: unknown[]) => unknown;
type TelegrafPrototype = Record<string, TelegrafMethod>;
type TelegrafSceneContext = Scenes.WizardContext;
type TelegrafListenerCallback = MiddlewareFn<TelegrafSceneContext>;
type WizardStep = { step: number; methodName: string };

/** Находит декорированные providers и регистрирует их в текущем bot instance. */
@Injectable()
export class ListenersExplorerService implements OnModuleInit {
  private readonly telegrafParamsFactory = new TelegrafParamsFactory();
  private bot!: Telegraf<TelegrafSceneContext>;

  public constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
    private readonly metadataScanner: MetadataScanner,
    private readonly modulesContainer: ModulesContainer,
    private readonly externalContextCreator: ExternalContextCreator,

    private readonly stage: Scenes.Stage<TelegrafSceneContext>,
    private readonly telegrafOptions: TelegrafModuleOptions,
    private readonly botName: string,
  ) {}

  public onModuleInit(): void {
    this.bot = this.moduleRef.get<Telegraf<TelegrafSceneContext>>(
      this.botName,
      {
        strict: false,
      },
    );

    const modules = this.getModules(this.telegrafOptions.include ?? []);
    this.registerComposers(modules);
    this.registerScenes(modules);
    this.bot.use(this.stage.middleware());
    this.registerUpdates(modules);
  }

  private getModules(include: Function[]): Module[] {
    const modules = [...this.modulesContainer.values()];
    return include.length === 0
      ? modules
      : modules.filter(({ metatype }) => include.includes(metatype));
  }

  private getDecoratedProviders(
    modules: Module[],
    decorator: ReflectableDecorator<never, unknown>,
  ): InstanceWrapper<object>[] {
    const providers: InstanceWrapper<object>[] = [];

    for (const moduleRef of modules) {
      for (const wrapper of moduleRef.providers.values()) {
        if (!wrapper.instance || !wrapper.metatype) {
          continue;
        }

        if (!this.reflector.get(decorator, wrapper.metatype)) {
          continue;
        }

        providers.push(wrapper as InstanceWrapper<object>);
      }
    }

    return providers;
  }

  private registerComposers(modules: Module[]): void {
    for (const wrapper of this.getDecoratedProviders(
      modules,
      ComposerDecorator,
    )) {
      const composer = new Composer<TelegrafSceneContext>();
      this.registerListeners(composer, wrapper);
      this.stage.use(composer);
    }
  }

  private registerUpdates(modules: Module[]): void {
    for (const wrapper of this.getDecoratedProviders(modules, Update)) {
      this.registerListeners(this.bot, wrapper);
    }
  }

  private registerScenes(modules: Module[]): void {
    const sceneIds = new Set<string>();

    for (const wrapper of this.getDecoratedProviders(
      modules,
      SceneMetadataDecorator,
    )) {
      this.registerScene(wrapper, sceneIds);
    }
  }

  private registerScene(
    wrapper: InstanceWrapper<object>,
    sceneIds: Set<string>,
  ): void {
    const metadata = this.getSceneMetadata(wrapper);
    if (!metadata) {
      return;
    }

    const { sceneId, type, options } = metadata;
    if (sceneIds.has(sceneId)) {
      throw new Error(`Two scenes with the same id ${sceneId} were detected`);
    }
    sceneIds.add(sceneId);

    const scene =
      type === 'base'
        ? new Scenes.BaseScene<TelegrafSceneContext>(
            sceneId,
            options as SceneOptions<TelegrafSceneContext> | undefined,
          )
        : new Scenes.WizardScene<TelegrafSceneContext>(
            sceneId,
            this.getSceneOptions(options),
          );

    this.stage.register(scene);
    this.registerSceneLifecycleListeners(scene, wrapper);

    if (scene instanceof Scenes.WizardScene) {
      this.registerWizardListeners(scene, wrapper);
      return;
    }

    this.registerListeners(scene, wrapper);
  }

  private getSceneMetadata(
    wrapper: InstanceWrapper<object>,
  ): SceneMetadata | undefined {
    if (!wrapper.metatype) {
      return undefined;
    }

    return this.reflector.get(SceneMetadataDecorator, wrapper.metatype);
  }

  private getSceneOptions(
    options: SceneOptions<Context> | undefined,
  ): SceneOptions<TelegrafSceneContext> {
    return (options ?? {}) as SceneOptions<TelegrafSceneContext>;
  }

  private registerSceneLifecycleListeners(
    scene: Scenes.BaseScene<TelegrafSceneContext>,
    wrapper: InstanceWrapper<object>,
  ): void {
    const { instance } = wrapper;
    const prototype = this.getPrototype(instance);
    if (!prototype) {
      return;
    }

    for (const methodName of this.metadataScanner.getAllMethodNames(
      prototype,
    )) {
      const methodRef = prototype[methodName];
      const listener = this.createReplyingListener(
        instance,
        prototype,
        methodName,
      );
      if (!listener) {
        continue;
      }

      if (this.reflector.get(SceneEnter, methodRef)) {
        scene.enter(listener);
      }

      if (this.reflector.get(SceneLeave, methodRef)) {
        scene.leave(listener);
      }
    }
  }

  private registerListeners(
    composer: Composer<TelegrafSceneContext>,
    wrapper: InstanceWrapper<object>,
  ): void {
    const { instance } = wrapper;
    const prototype = this.getPrototype(instance);
    if (!prototype) {
      return;
    }

    for (const methodName of this.metadataScanner.getAllMethodNames(
      prototype,
    )) {
      this.registerIfListener(composer, instance, prototype, methodName);
    }
  }

  private registerWizardListeners(
    wizard: Scenes.WizardScene<TelegrafSceneContext>,
    wrapper: InstanceWrapper<object>,
  ): void {
    const { instance } = wrapper;
    const prototype = this.getPrototype(instance);
    if (!prototype) {
      return;
    }

    const steps: WizardStep[] = [];
    const regularListeners: string[] = [];

    for (const methodName of this.metadataScanner.getAllMethodNames(
      prototype,
    )) {
      const methodRef = prototype[methodName];
      const metadata = this.reflector.get(
        WizardStepMetadataDecorator,
        methodRef,
      );

      if (metadata) {
        steps.push({ step: metadata.step, methodName });
      } else {
        regularListeners.push(methodName);
      }
    }

    for (const methodName of regularListeners) {
      this.registerIfListener(wizard, instance, prototype, methodName);
    }

    const groupedSteps = new Map<number, WizardStep[]>();
    for (const step of steps.sort((left, right) => left.step - right.step)) {
      groupedSteps.set(step.step, [
        ...(groupedSteps.get(step.step) ?? []),
        step,
      ]);
    }

    wizard.steps = [...groupedSteps.values()].map((stepMethods) => {
      const composer = new Composer<TelegrafSceneContext>();
      for (const { methodName } of stepMethods) {
        this.registerIfListener(composer, instance, prototype, methodName, [
          {
            method: 'use',
            args: [] as ComposerMethodArgs<Composer<never>, 'use'>,
          },
        ]);
      }
      return composer.middleware();
    });
  }

  private registerIfListener(
    composer: Composer<TelegrafSceneContext>,
    instance: object,
    prototype: TelegrafPrototype,
    methodName: string,
    defaultMetadata?: ListenerMetadata[],
  ): void {
    const methodRef = prototype[methodName];
    const metadata =
      this.reflector.get(ListenerDecorator, methodRef) ?? defaultMetadata;
    if (!metadata?.length) {
      return;
    }

    const listener = this.createReplyingListener(
      instance,
      prototype,
      methodName,
    );
    if (!listener) {
      return;
    }

    for (const { method, args } of metadata) {
      this.registerComposerMethod(composer, method, args, listener);
    }
  }

  private registerComposerMethod(
    composer: Composer<TelegrafSceneContext>,
    method: string,
    args: readonly unknown[],
    listener: TelegrafListenerCallback,
  ): void {
    const candidate = composer[method as keyof Composer<Context>];
    if (typeof candidate !== 'function') {
      throw new Error(`Telegraf Composer method ${method} is not available`);
    }

    const register = candidate as unknown as (
      ...arguments_: [...unknown[], TelegrafListenerCallback]
    ) => Composer<TelegrafSceneContext>;
    register.call(composer, ...args, listener);
  }

  private createReplyingListener(
    instance: object,
    prototype: TelegrafPrototype,
    methodName: string,
  ): TelegrafListenerCallback | undefined {
    const callback = this.createContextCallback(
      instance,
      prototype,
      methodName,
    );
    if (!callback) {
      return undefined;
    }

    return async (ctx, next): Promise<void> => {
      const result = await callback(ctx, next);
      if (result) {
        await ctx.reply(String(result));
      }
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

  private getPrototype(instance: object): TelegrafPrototype | undefined {
    const prototype = Object.getPrototypeOf(instance);
    return prototype && typeof prototype === 'object'
      ? (prototype as TelegrafPrototype)
      : undefined;
  }
}
