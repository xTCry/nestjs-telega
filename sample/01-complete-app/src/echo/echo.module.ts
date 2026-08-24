import { Module } from '@nestjs/common';

import { AdminResponseWizard } from '../admin/admin-response.wizard';
import { BusinessResponsesModule } from '../business-responses/business-responses.module';
import { BotCommandsService } from '../common/services/bot-commands.service';
import { EchoService } from './echo.service';
import { EchoUpdate } from './echo.update';

@Module({
  imports: [BusinessResponsesModule],
  providers: [EchoUpdate, EchoService, AdminResponseWizard, BotCommandsService],
})
export class EchoModule {}
