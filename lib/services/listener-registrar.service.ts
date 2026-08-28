import { ReflectableDecorator, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import {
  Composer,
  Context,
  MiddlewareFn,
  Scenes,
  Telegraf,
} from 'telegraf-hardened';
import type { SceneOptions } from 'telegraf-hardened/scenes';

import {
  Composer as ComposerDecorator,
  SceneMetadataDecorator,
  Update,
} from '../decorators/core';
import {
  ListenerPhaseMetadataDecorator,
  ListenerPriorityMetadataDecorator,
} from '../decorators/core/listener-order.metadata';
import {
  SceneEnter,
  SceneLeave,
  WizardStepMetadataDecorator,
} from '../decorators/scene';
import type {
  ListenerMetadata,
  ListenerRegistrationDescriptor,
  ListenerRegistrationPhase,
  SceneMetadata,
  TelegrafListenerDiagnostics,
} from '../interfaces';
import type { ComposerMethodArgs } from '../types';
import { ListenerDecorator } from '../utils';

type TelegrafMethod = (...args: unknown[]) => unknown;
type TelegrafPrototype = Record<string, TelegrafMethod>;
type TelegrafSceneContext = Scenes.WizardContext;
type TelegrafListenerCallback = MiddlewareFn<TelegrafSceneContext>;
type WizardStep = { step: number; methodName: string };

/** Provider `@Update()` listener-ов вместе с местом его NestJS discovery. */
export interface UpdateListenerProvider {
  readonly wrapper: InstanceWrapper<object>;
  readonly moduleName: string;
}

type PendingUpdateListener = Omit<
  ListenerRegistrationDescriptor,
  'registrationIndex'
> & {
  readonly listener: TelegrafListenerCallback;
};

const listenerPhaseOrder: Record<ListenerRegistrationPhase, number> = {
  normal: 0,
  fallback: 1,
};

/** Сохраняет discovery-порядок, когда phase и priority совпадают. */
const compareUpdateListeners = (
  left: PendingUpdateListener,
  right: PendingUpdateListener,
): number =>
  listenerPhaseOrder[left.phase] - listenerPhaseOrder[right.phase] ||
  left.priority - right.priority ||
  left.discoveryIndex - right.discoveryIndex;

/** Создаёт NestJS-aware middleware для декорированного метода provider-а. */
export type TelegrafListenerFactory = (
  instance: object,
  prototype: TelegrafPrototype,
  methodName: string,
) => TelegrafListenerCallback | undefined;

/** Регистрирует listener-ы в Telegraf, сохраняя детали scene и wizard внутри. */
export class ListenerRegistrarService {
  public constructor(
    private readonly reflector: Reflector,
    private readonly metadataScanner: MetadataScanner,
    private readonly createListener: TelegrafListenerFactory,
    private readonly botName: string,
    private readonly listenerDiagnostics?: TelegrafListenerDiagnostics,
  ) {}

  public registerBeforeStage(
    wrappers: InstanceWrapper<object>[],
    stage: Scenes.Stage<TelegrafSceneContext>,
  ): void {
    this.registerComposers(
      this.getDecoratedProviders(wrappers, ComposerDecorator),
      stage,
    );
    this.registerScenes(
      this.getDecoratedProviders(wrappers, SceneMetadataDecorator),
      stage,
    );
  }

  public registerUpdates(
    providers: UpdateListenerProvider[],
    bot: Telegraf<TelegrafSceneContext>,
  ): void {
    const listeners = this.collectUpdateListeners(providers);
    const orderedListeners = listeners.sort(compareUpdateListeners);

    for (const [registrationIndex, listener] of orderedListeners.entries()) {
      this.registerComposerMethod(
        bot,
        listener.listenerMethod,
        listener.args,
        listener.listener,
      );
      const { listener: _listener, ...descriptor } = listener;
      this.onUpdateListenerRegistered({ ...descriptor, registrationIndex });
    }
  }

  private getDecoratedProviders(
    wrappers: InstanceWrapper<object>[],
    decorator: ReflectableDecorator<never, unknown>,
  ): InstanceWrapper<object>[] {
    return wrappers.filter(
      (wrapper) =>
        wrapper.metatype != null &&
        this.reflector.get(decorator, wrapper.metatype) !== undefined,
    );
  }

  private registerComposers(
    wrappers: InstanceWrapper<object>[],
    stage: Scenes.Stage<TelegrafSceneContext>,
  ): void {
    for (const wrapper of wrappers) {
      const composer = new Composer<TelegrafSceneContext>();
      this.registerListeners(composer, wrapper);
      stage.use(composer);
    }
  }

  /** Собирает update-listener-ы без регистрации, чтобы упорядочить их глобально. */
  private collectUpdateListeners(
    providers: UpdateListenerProvider[],
  ): PendingUpdateListener[] {
    const listeners: PendingUpdateListener[] = [];
    let discoveryIndex = 0;

    for (const { wrapper, moduleName } of providers) {
      if (
        !wrapper.metatype ||
        this.reflector.get(Update, wrapper.metatype) === undefined
      ) {
        continue;
      }

      const { instance } = wrapper;
      const prototype = this.getPrototype(instance);
      if (!prototype) {
        continue;
      }

      for (const methodName of this.metadataScanner.getAllMethodNames(
        prototype,
      )) {
        const methodRef = prototype[methodName];
        const metadata = this.reflector.get(ListenerDecorator, methodRef);
        if (!metadata?.length) {
          continue;
        }

        const listener = this.createListener(instance, prototype, methodName);
        if (!listener) {
          continue;
        }

        const phase =
          this.reflector.get(ListenerPhaseMetadataDecorator, methodRef) ??
          'normal';
        const priority =
          this.reflector.get(ListenerPriorityMetadataDecorator, methodRef) ?? 0;

        for (const { method, args } of metadata) {
          listeners.push({
            moduleName,
            providerName: this.getClassName(wrapper),
            methodName,
            listenerMethod: method,
            args,
            phase,
            priority,
            discoveryIndex,
            listener,
          });
          discoveryIndex += 1;
        }
      }
    }

    return listeners;
  }

  /** Регистрирует сцены и проверяет уникальность их ID в пределах stage бота. */
  private registerScenes(
    wrappers: InstanceWrapper<object>[],
    stage: Scenes.Stage<TelegrafSceneContext>,
  ): void {
    const sceneClasses = new Map<string, string>();

    for (const wrapper of wrappers) {
      const metadata = this.getSceneMetadata(wrapper);
      if (!metadata) {
        continue;
      }

      const { sceneId, type, options } = metadata;
      const firstSceneClass = sceneClasses.get(sceneId);
      if (firstSceneClass) {
        throw new Error(
          `Duplicate scene id "${sceneId}" for bot "${this.botName}": ` +
            `${firstSceneClass} conflicts with ${this.getClassName(wrapper)}`,
        );
      }
      sceneClasses.set(sceneId, this.getClassName(wrapper));

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

      stage.register(scene);
      this.registerSceneLifecycleListeners(scene, wrapper);

      if (scene instanceof Scenes.WizardScene) {
        this.registerWizardListeners(scene, wrapper);
      } else {
        this.registerListeners(scene, wrapper);
      }
    }
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
      const listener = this.createListener(instance, prototype, methodName);
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
      const isLifecycleListener =
        this.reflector.get(SceneEnter, methodRef) !== undefined ||
        this.reflector.get(SceneLeave, methodRef) !== undefined;
      const metadata = this.reflector.get(
        WizardStepMetadataDecorator,
        methodRef,
      );

      // Lifecycle methods run only through scene.enter/leave, never as wizard steps.
      if (metadata && !isLifecycleListener) {
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

    const listener = this.createListener(instance, prototype, methodName);
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

  private onUpdateListenerRegistered(
    listener: ListenerRegistrationDescriptor,
  ): void {
    // Diagnostics подключаются снаружи только для update-listener-ов.
    // Composer и сцены имеют отдельный lifecycle и порядок регистрации.
    this.listenerDiagnostics?.onRegistered(listener);
  }

  private getPrototype(instance: object): TelegrafPrototype | undefined {
    const prototype = Object.getPrototypeOf(instance);
    return prototype && typeof prototype === 'object'
      ? (prototype as TelegrafPrototype)
      : undefined;
  }

  private getClassName(wrapper: InstanceWrapper<object>): string {
    return wrapper.metatype?.name ?? 'AnonymousScene';
  }
}
