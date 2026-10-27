import { Module } from '@nestjs/common';

import { EphemeralUpdate } from './ephemeral.update';
import { GreeterUpdate } from './greeter.update';
import { RandomNumberScene } from './scenes/random-number.scene';
import { GreeterWizard } from './wizard/greeter.wizard';

@Module({
  providers: [GreeterUpdate, EphemeralUpdate, RandomNumberScene, GreeterWizard],
})
export class GreeterModule {}
