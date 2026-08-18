import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { Hears, InjectAllBots, InjectBot, On, Use } from '../lib/decorators';
import { ListenerMetadata } from '../lib/interfaces';
import { allBotsMap } from '../lib/telegraf-all-bots.provider';
import { LISTENERS_METADATA } from '../lib/telegraf.constants';
import { getAllBotsToken, getBotToken } from '../lib/utils';

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
    Use()(UpdateHandler.prototype, 'handle', descriptor);

    expect(
      Reflect.getMetadata(
        LISTENERS_METADATA,
        descriptor.value,
      ) as ListenerMetadata[],
    ).toEqual([
      { method: 'on', args: ['message'] },
      { method: 'hears', args: ['/start'] },
      { method: 'use', args: [] },
    ]);
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
