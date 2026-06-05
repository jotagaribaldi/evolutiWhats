import { LeadStatus } from '@prisma/client';
export declare class CreateLeadDto {
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    tags?: string[];
    status?: LeadStatus;
    source?: string;
    groupIds?: string[];
}
export declare class UpdateLeadDto {
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
    tags?: string[];
    status?: LeadStatus;
    source?: string;
    groupIds?: string[];
}
