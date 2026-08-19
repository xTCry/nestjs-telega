import type {
  InjectionToken,
  ModuleMetadata,
  Type,
} from '@nestjs/common/interfaces';
import type { Context, Middleware, Telegraf } from 'telegraf';

export interface TelegrafModuleOptions {
  token: string;
  botName?: string;
  options?: Partial<Telegraf.Options<Context>>;
  launchOptions?: Telegraf.LaunchOptions | false;
  include?: Function[];
  middlewares?: ReadonlyArray<Middleware<Context>>;
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
