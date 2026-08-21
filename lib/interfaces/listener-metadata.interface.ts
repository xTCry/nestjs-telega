import type { Composer } from 'telegraf-hardened';

import type { ComposerMethodArgs, OnlyFunctionPropertyNames } from '../types';

/** Metadata одного зарегистрированного метода Telegraf Composer. */
export interface ListenerMetadata<
  TComposer extends Composer<never> = Composer<never>,
  TMethod extends OnlyFunctionPropertyNames<TComposer> =
    OnlyFunctionPropertyNames<TComposer>,
> {
  method: TMethod;
  args: ComposerMethodArgs<TComposer, TMethod>;
}
