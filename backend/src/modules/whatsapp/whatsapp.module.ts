import { Module } from '@nestjs/common';
import { WhatsappService } from './application/whatsapp.service';
import { WhatsappController } from './infrastructure/whatsapp.controller';
import { EvolutionApiClient } from './infrastructure/evolution-api.client';

@Module({
  controllers: [WhatsappController],
  providers: [WhatsappService, EvolutionApiClient],
  exports: [WhatsappService, EvolutionApiClient],
})
export class WhatsappModule {}
