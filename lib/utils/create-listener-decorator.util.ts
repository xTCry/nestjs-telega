import { Composer } from 'telegraf-hardened';

import type { ListenerMetadata } from '../interfaces';
import type { ComposerMethodArgs, OnlyFunctionPropertyNames } from '../types';
import { createAppendDecorator } from './create-append-decorator.util';

export type ListenerDecoratorFactory = <
  TComposer extends Composer<never>,
  TMethod extends OnlyFunctionPropertyNames<TComposer> =
    OnlyFunctionPropertyNames<TComposer>,
>(
  method: TMethod,
) => (...args: ComposerMethodArgs<TComposer, TMethod>) => MethodDecorator;

/** Общая factory всех публичных listener-декораторов. */
const ListenerMetadataDecorator = createAppendDecorator<ListenerMetadata>();

export const ListenerDecorator: ListenerDecoratorFactory & { KEY: string } = (<
    TComposer extends Composer<never>,
    TMethod extends OnlyFunctionPropertyNames<TComposer> =
      OnlyFunctionPropertyNames<TComposer>,
  >(
    method: TMethod,
  ) =>
  (...args: ComposerMethodArgs<TComposer, TMethod>): MethodDecorator =>
    ListenerMetadataDecorator({
      method,
      args,
    } as unknown as ListenerMetadata)) as ListenerDecoratorFactory & {
  KEY: string;
};

ListenerDecorator.KEY = ListenerMetadataDecorator.KEY;

/** @deprecated Внутренний alias; новые декораторы используют ListenerDecorator. */
export const createListenerDecorator = ListenerDecorator;
