import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../core/database/prisma.service';
import { EvolutionApiClient } from '../../whatsapp/infrastructure/evolution-api.client';
export declare class CampaignDispatchProcessor extends WorkerHost {
    private readonly prisma;
    private readonly evolutionApi;
    private readonly logger;
    constructor(prisma: PrismaService, evolutionApi: EvolutionApiClient);
    process(job: Job<{
        campaignId: string;
        tenantId: string;
    }>): Promise<void>;
}
