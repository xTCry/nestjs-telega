import { Module } from '@nestjs/common';

import { NotifierUpdate } from './notifier.update';

@Module({
  providers: [NotifierUpdate],
})
export class NotifierModule {}
