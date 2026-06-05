import { PaginationDto } from '../../../common/dtos';
import { GroupsService } from '../application/groups.service';
import { CreateGroupDto, UpdateGroupDto } from '../application/dto/group.dto';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    create(tenantId: string, dto: CreateGroupDto): Promise<any>;
    findAll(tenantId: string, pagination: PaginationDto): Promise<import("../../../common/dtos").PaginatedResponseDto<unknown>>;
    findOne(tenantId: string, id: string): Promise<any>;
    update(tenantId: string, id: string, dto: UpdateGroupDto): Promise<any>;
    remove(tenantId: string, id: string): Promise<any>;
    getLeads(tenantId: string, id: string, pagination: PaginationDto): Promise<import("../../../common/dtos").PaginatedResponseDto<unknown>>;
    addLeads(tenantId: string, id: string, body: {
        leadIds: string[];
    }): Promise<{
        added: any;
        skipped: number;
    }>;
    removeLeadFromGroup(tenantId: string, id: string, leadId: string): Promise<{
        removed: boolean;
    }>;
}
