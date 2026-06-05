import { PaginationDto } from '../../../common/dtos';
import { CampaignsService } from '../application/campaigns.service';
import { CreateCampaignDto } from '../application/dto/campaign.dto';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    create(tenantId: string, userId: string, dto: CreateCampaignDto): Promise<any>;
    findAll(tenantId: string, pagination: PaginationDto): Promise<import("../../../common/dtos").PaginatedResponseDto<unknown>>;
    findOne(tenantId: string, id: string): Promise<any>;
    start(tenantId: string, id: string): Promise<{
        message: string;
        totalRecipients: any;
    }>;
    pause(tenantId: string, id: string): Promise<{
        message: string;
    }>;
    getStats(tenantId: string, id: string): Promise<{
        campaign: any;
        breakdown: any;
    }>;
}
