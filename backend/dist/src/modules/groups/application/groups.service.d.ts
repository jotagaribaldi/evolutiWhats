import { PrismaService } from '../../../core/database/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
import { PaginationDto, PaginatedResponseDto } from '../../../common/dtos';
export declare class GroupsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, dto: CreateGroupDto): Promise<any>;
    findAll(tenantId: string, pagination: PaginationDto): Promise<PaginatedResponseDto<unknown>>;
    findOne(tenantId: string, id: string): Promise<any>;
    update(tenantId: string, id: string, dto: UpdateGroupDto): Promise<any>;
    remove(tenantId: string, id: string): Promise<any>;
    getLeads(tenantId: string, groupId: string, pagination: PaginationDto): Promise<PaginatedResponseDto<unknown>>;
    addLeads(tenantId: string, groupId: string, leadIds: string[]): Promise<{
        added: any;
        skipped: number;
    }>;
    removeLeadFromGroup(tenantId: string, groupId: string, leadId: string): Promise<{
        removed: boolean;
    }>;
}
