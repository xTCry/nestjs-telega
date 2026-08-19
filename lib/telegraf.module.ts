import { DynamicModule, Module } from '@nestjs/common';

import {
  TelegrafModuleAsyncOptions,
  TelegrafModuleOptions,
} from './interfaces';
import { TelegrafCoreModule } from './telegraf-core.module';

@Module({})
export class TelegrafModule {
  public static forRoot(options: TelegrafModuleOptions): DynamicModule {
    return {
      module: TelegrafModule,
      imports: [TelegrafCoreModule.forRoot(options)],
      exports: [TelegrafCoreModule],
    };
  }

  public static forRootAsync(
    options: TelegrafModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: TelegrafModule,
      imports: [TelegrafCoreModule.forRootAsync(options)],
      exports: [TelegrafCoreModule],
    };
  }
}
