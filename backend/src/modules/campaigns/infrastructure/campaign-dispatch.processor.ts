import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../core/database/prisma.service';
import { EvolutionApiClient } from '../../whatsapp/infrastructure/evolution-api.client';
import { CampaignStatus, RecipientStatus } from '@prisma/client';

function getHumanizedDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function personalizeMessage(template: string, leadName: string, leadPhone: string): string {
  return template
    .replace(/\{\{nome\}\}/gi, leadName)
    .replace(/\{\{name\}\}/gi, leadName)
    .replace(/\{nome\}/gi, leadName)
    .replace(/\{name\}/gi, leadName)
    .replace(/\{\{telefone\}\}/gi, leadPhone)
    .replace(/\{\{phone\}\}/gi, leadPhone)
    .replace(/\{telefone\}/gi, leadPhone)
    .replace(/\{phone\}/gi, leadPhone);
}

@Processor('campaign-dispatch')
export class CampaignDispatchProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignDispatchProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evolutionApi: EvolutionApiClient,
  ) {
    super();
  }

  async process(job: Job<{ campaignId: string; tenantId: string }>) {
    const { campaignId } = job.data;

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { instance: true },
    });

    if (!campaign || !campaign.instance) {
      this.logger.error(`Campaign ${campaignId} not found or has no instance`);
      return;
    }

    if (campaign.status !== CampaignStatus.RUNNING) {
      this.logger.warn(`Campaign ${campaignId} is not in RUNNING state, skipping`);
      return;
    }

    const recipients = await this.prisma.campaignRecipient.findMany({
      where: { campaignId, status: RecipientStatus.PENDING },
      include: { lead: { select: { phone: true, name: true } } },
      orderBy: { lead: { name: 'asc' } },
    });

    this.logger.log(`Processing campaign ${campaignId}: ${recipients.length} pending messages`);

    let sentCount = campaign.sentCount;
    let failedCount = campaign.failedCount;

    for (const recipient of recipients) {
      // Check if campaign was paused
      const currentStatus = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { status: true },
      });

      if (currentStatus?.status === CampaignStatus.PAUSED) {
        this.logger.log(`Campaign ${campaignId} was paused, stopping dispatch`);
        return;
      }

      // Personalize and send
      const message = personalizeMessage(
        campaign.messageTemplate,
        recipient.lead.name,
        recipient.lead.phone,
      );

      const result = await this.evolutionApi.sendText(
        campaign.instance.instanceName,
        recipient.lead.phone,
        message,
      );

      if (result.success) {
        await this.prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: RecipientStatus.SENT, sentAt: new Date() },
        });
        sentCount++;
      } else {
        await this.prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: RecipientStatus.FAILED,
            errorMessage: result.error,
          },
        });
        failedCount++;
      }

      // Update campaign counters
      await this.prisma.campaign.update({
        where: { id: campaignId },
        data: { sentCount, failedCount },
      });

      // Humanized delay between messages
      const delay = getHumanizedDelay(campaign.minDelayMs, campaign.maxDelayMs);
      this.logger.debug(`Waiting ${delay}ms before next message`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Mark campaign as completed
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.COMPLETED,
        completedAt: new Date(),
        sentCount,
        failedCount,
      },
    });

    this.logger.log(
      `Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`,
    );
  }
}
