import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CampaignsService } from './application/campaigns.service';
import { CampaignsController } from './infrastructure/campaigns.controller';
import { CampaignDispatchProcessor } from './infrastructure/campaign-dispatch.processor';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'campaign-dispatch' }),
    WhatsappModule,
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignDispatchProcessor],
  exports: [CampaignsService],
})
export class CampaignsModule {}
