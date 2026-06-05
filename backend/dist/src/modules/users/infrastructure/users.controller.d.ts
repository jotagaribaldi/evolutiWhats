import { PaginationDto } from '../../../common/dtos';
import { UsersService } from '../application/users.service';
import { CreateUserDto, UpdateUserDto } from '../application/dto/user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(tenantId: string, dto: CreateUserDto): Promise<any>;
    findAll(tenantId: string, pagination: PaginationDto): Promise<import("../../../common/dtos").PaginatedResponseDto<unknown>>;
    update(tenantId: string, id: string, dto: UpdateUserDto): Promise<any>;
    remove(tenantId: string, id: string): Promise<any>;
}
