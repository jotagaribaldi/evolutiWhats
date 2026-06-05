import { PrismaService } from '../../../core/database/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto, PaginatedResponseDto } from '../../../common/dtos';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, dto: CreateUserDto): Promise<any>;
    findAll(tenantId: string, pagination: PaginationDto): Promise<PaginatedResponseDto<unknown>>;
    update(tenantId: string, id: string, dto: UpdateUserDto): Promise<any>;
    remove(tenantId: string, id: string): Promise<any>;
}
