import type {
  InjectionToken,
  ModuleMetadata,
  Type,
} from '@nestjs/common/interfaces';
import type { Context, Middleware, Telegraf } from 'telegraf-hardened';

import type { TelegrafReplyExtra } from './telegraf-listener-result.interface';

export interface TelegrafModuleOptions {
  token: string;
  botName?: string;
  options?: Partial<Telegraf.Options<Context>>;
  launchOptions?: Telegraf.LaunchOptions | false;
  include?: Function[];
  /**
   * Middleware, выполняемые до stage и найденных обработчиков.
   * `middlewares` сохраняется как compatibility alias этого свойства.
   */
  middlewaresBefore?: ReadonlyArray<Middleware<Context>>;
  /** @deprecated Используйте `middlewaresBefore`. */
  middlewares?: ReadonlyArray<Middleware<Context>>;
  /** Middleware, выполняемые после найденных update-обработчиков. */
  middlewaresAfter?: ReadonlyArray<Middleware<Context>>;
  replyOptions?: TelegrafReplyExtra;
  useCatchLogger?: ((err: Error, ctx?: Context) => void) | false;
}

export interface TelegrafOptionsFactory {
  createTelegrafOptions():
    | Promise<TelegrafModuleOptions>
    | TelegrafModuleOptions;
}

export interface TelegrafModuleAsyncOptions extends Pick<
  ModuleMetadata,
  'imports'
> {
  botName?: string;
  useExisting?: Type<TelegrafOptionsFactory>;
  useClass?: Type<TelegrafOptionsFactory>;
  useFactory?: (
    ...args: unknown[]
  ) => Promise<TelegrafModuleOptions> | TelegrafModuleOptions;
  inject?: InjectionToken[];
}
