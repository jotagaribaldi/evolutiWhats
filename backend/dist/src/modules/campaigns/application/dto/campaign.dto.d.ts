export declare class CreateCampaignDto {
    name: string;
    description?: string;
    messageTemplate: string;
    groupIds?: string[];
    instanceId?: string;
    scheduledAt?: string;
    minDelayMs?: number;
    maxDelayMs?: number;
}
