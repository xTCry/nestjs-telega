import { Module } from '@nestjs/common';

import { RandomNumberScene } from '../greeter/scenes/random-number.scene';
import { EchoService } from './echo.service';
import { EchoUpdate } from './echo.update';

@Module({
  providers: [EchoUpdate, EchoService, RandomNumberScene],
})
export class EchoModule {}
