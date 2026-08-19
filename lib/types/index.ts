import { Composer, Middleware } from 'telegraf';

export type Filter<T extends readonly unknown[], F> = T extends []
  ? []
  : T extends [infer Head, ...infer Tail]
    ? Head extends F
      ? Filter<Tail, F>
      : [Head, ...Filter<Tail, F>]
    : [];

export type OnlyFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown ? K : never;
}[keyof T];

type ParametersOrNever<T> = T extends (...args: never[]) => unknown
  ? Parameters<T>
  : never;

type BaseComposerMethodArgs<
  TComposer extends Composer<never>,
  TMethod extends OnlyFunctionPropertyNames<TComposer>,
> = Filter<ParametersOrNever<TComposer[TMethod]>, Middleware<never>>;

type NonEmptyArray<T> = [T, ...T[]];

export type ComposerMethodArgs<
  T extends Composer<never>,
  U extends OnlyFunctionPropertyNames<T> = OnlyFunctionPropertyNames<T>,
> = U extends 'use'
  ? BaseComposerMethodArgs<T, U>
  : NonEmptyArray<BaseComposerMethodArgs<T, U>[number]>;
