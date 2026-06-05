import { PrismaService } from '../../../core/database/prisma.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { PaginationDto, PaginatedResponseDto } from '../../../common/dtos';
export declare class LeadsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, dto: CreateLeadDto): Promise<any>;
    findAll(tenantId: string, pagination: PaginationDto, filters?: {
        status?: string;
        groupId?: string;
        tag?: string;
    }): Promise<PaginatedResponseDto<unknown>>;
    findOne(tenantId: string, id: string): Promise<any>;
    update(tenantId: string, id: string, dto: UpdateLeadDto): Promise<any>;
    remove(tenantId: string, id: string): Promise<any>;
    importCsv(tenantId: string, records: CreateLeadDto[]): Promise<{
        imported: number;
        skipped: number;
        errors: string[];
    }>;
}
