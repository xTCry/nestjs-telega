import { Module } from '@nestjs/common';

import { BusinessResponsesModule } from '../business-responses/business-responses.module';
import { BusinessDialogueScene } from './business-dialogue.scene';
import { BusinessUpdate } from './business.update';

@Module({
  imports: [BusinessResponsesModule],
  providers: [BusinessUpdate, BusinessDialogueScene],
})
export class BusinessModule {}
