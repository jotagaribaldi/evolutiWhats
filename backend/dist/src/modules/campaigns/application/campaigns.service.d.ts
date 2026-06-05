import { PrismaService } from '../../../core/database/prisma.service';
import { CreateCampaignDto } from './dto/campaign.dto';
import { PaginationDto, PaginatedResponseDto } from '../../../common/dtos';
import { Queue } from 'bullmq';
export declare class CampaignsService {
    private readonly prisma;
    private readonly campaignQueue;
    private readonly logger;
    constructor(prisma: PrismaService, campaignQueue: Queue);
    create(tenantId: string, userId: string, dto: CreateCampaignDto): Promise<any>;
    findAll(tenantId: string, pagination: PaginationDto): Promise<PaginatedResponseDto<unknown>>;
    findOne(tenantId: string, id: string): Promise<any>;
    buildRecipientList(campaignId: string, groupIds: string[]): Promise<any>;
    start(tenantId: string, campaignId: string): Promise<{
        message: string;
        totalRecipients: any;
    }>;
    pause(tenantId: string, campaignId: string): Promise<{
        message: string;
    }>;
    getStats(tenantId: string, campaignId: string): Promise<{
        campaign: any;
        breakdown: any;
    }>;
}
