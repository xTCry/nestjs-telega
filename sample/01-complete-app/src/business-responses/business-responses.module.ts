import { Module } from '@nestjs/common';

import { BusinessResponsesStore } from './business-responses.store';

@Module({
  providers: [BusinessResponsesStore],
  exports: [BusinessResponsesStore],
})
export class BusinessResponsesModule {}
