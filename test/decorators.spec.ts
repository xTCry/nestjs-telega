import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import {
  Hears,
  InjectAllBots,
  InjectBot,
  On,
  Scene,
  SceneEnter,
  SceneLeave,
  SceneMetadataDecorator,
  TgHears,
  TgOn,
  TgUpdate,
  Update,
  Use,
  Wizard,
  WizardStep,
  WizardStepMetadataDecorator,
} from '../lib/decorators';
import { ListenerMetadata } from '../lib/interfaces';
import { allBotsMap } from '../lib/telegraf-all-bots.provider';
import { getAllBotsToken, getBotToken, ListenerDecorator } from '../lib/utils';

describe('public decorators', () => {
  it('injects the named bot and all-bots registry outside a constructor', async () => {
    const bot = { name: 'reminder' };

    @Injectable()
    class BotRegistryConsumer {
      @InjectBot('reminder')
      readonly bot!: typeof bot;

      @InjectAllBots()
      readonly bots!: typeof allBotsMap;
    }

    const moduleRef = await Test.createTestingModule({
      providers: [
        BotRegistryConsumer,
        { provide: getBotToken('reminder'), useValue: bot },
        { provide: getAllBotsToken(), useValue: allBotsMap },
      ],
    }).compile();

    const consumer = moduleRef.get(BotRegistryConsumer);

    expect(consumer.bot).toBe(bot);
    expect(consumer.bots).toBe(allBotsMap);

    await moduleRef.close();
  });

  it('appends metadata for chained listener decorators', () => {
    class UpdateHandler {
      handle(): void {}
    }

    const descriptor = getMethodDescriptor(UpdateHandler.prototype, 'handle');
    On('message')(UpdateHandler.prototype, 'handle', descriptor);
    Hears('/start')(UpdateHandler.prototype, 'handle', descriptor);
    const useDecorator = Use as unknown as () => MethodDecorator;
    useDecorator()(UpdateHandler.prototype, 'handle', descriptor);

    const reflector = new Reflector();
    expect(
      reflector.get(ListenerDecorator, descriptor.value) as ListenerMetadata[],
    ).toEqual([
      { method: 'on', args: ['message'] },
      { method: 'hears', args: ['/start'] },
      { method: 'use', args: [] },
    ]);
  });

  it('exports Tg aliases that preserve decorator metadata', () => {
    @TgUpdate()
    class UpdateHandler {
      @TgOn('message')
      @TgHears('Hello')
      handle(): void {}
    }

    const descriptor = getMethodDescriptor(UpdateHandler.prototype, 'handle');
    const reflector = new Reflector();

    expect(reflector.get(Update, UpdateHandler)).toEqual({});
    expect(
      reflector.get(ListenerDecorator, descriptor.value) as ListenerMetadata[],
    ).toEqual([
      { method: 'hears', args: ['Hello'] },
      { method: 'on', args: ['message'] },
    ]);
  });

  it('marks scene lifecycle handlers separately from update listeners', () => {
    class SceneHandler {
      onEnter(): void {}

      onLeave(): void {}
    }

    const enterDescriptor = getMethodDescriptor(
      SceneHandler.prototype,
      'onEnter',
    );
    const leaveDescriptor = getMethodDescriptor(
      SceneHandler.prototype,
      'onLeave',
    );

    SceneEnter()(SceneHandler.prototype, 'onEnter', enterDescriptor);
    SceneLeave()(SceneHandler.prototype, 'onLeave', leaveDescriptor);

    const reflector = new Reflector();
    expect(reflector.get(SceneEnter, enterDescriptor.value)).toEqual({});
    expect(reflector.get(SceneLeave, leaveDescriptor.value)).toEqual({});
  });

  it('exposes reflectable scene and wizard metadata through compatibility keys', () => {
    class BaseSceneHandler {}
    class WizardSceneHandler {
      handle(): void {}
    }

    Scene('base-scene')(BaseSceneHandler);
    Wizard('wizard-scene')(WizardSceneHandler);
    const descriptor = getMethodDescriptor(
      WizardSceneHandler.prototype,
      'handle',
    );
    WizardStep(2)(WizardSceneHandler.prototype, 'handle', descriptor);

    const reflector = new Reflector();
    expect(
      reflector.get(SceneMetadataDecorator, BaseSceneHandler),
    ).toMatchObject({
      sceneId: 'base-scene',
      type: 'base',
    });
    expect(
      reflector.get(SceneMetadataDecorator, WizardSceneHandler),
    ).toMatchObject({
      sceneId: 'wizard-scene',
      type: 'wizard',
    });
    expect(
      reflector.get(WizardStepMetadataDecorator, descriptor.value),
    ).toEqual({ step: 2 });
  });
});

function getMethodDescriptor(
  target: object,
  methodName: string,
): TypedPropertyDescriptor<() => void> & { value: () => void } {
  const descriptor = Object.getOwnPropertyDescriptor(target, methodName);

  if (!descriptor?.value) {
    throw new Error(`${methodName} descriptor is not defined`);
  }

  return descriptor as TypedPropertyDescriptor<() => void> & {
    value: () => void;
  };
}
