import type { Response } from 'express';
import { PaginationDto } from '../../../common/dtos';
import { LeadsService } from '../application/leads.service';
import { CreateLeadDto, UpdateLeadDto } from '../application/dto/lead.dto';
export declare class LeadsController {
    private readonly leadsService;
    constructor(leadsService: LeadsService);
    create(tenantId: string, dto: CreateLeadDto): Promise<any>;
    findAll(tenantId: string, pagination: PaginationDto, status?: string, groupId?: string, tag?: string): Promise<import("../../../common/dtos").PaginatedResponseDto<unknown>>;
    findOne(tenantId: string, id: string): Promise<any>;
    update(tenantId: string, id: string, dto: UpdateLeadDto): Promise<any>;
    remove(tenantId: string, id: string): Promise<any>;
    importCsv(tenantId: string, file: Express.Multer.File): Promise<{
        imported: number;
        skipped: number;
        errors: string[];
    }>;
    exportCsv(tenantId: string, res: Response): Promise<void>;
}
