import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators';
import { PaginationDto } from '../../../common/dtos';
import { UsersService } from '../application/users.service';
import { CreateUserDto, UpdateUserDto } from '../application/dto/user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post() @ApiOperation({ summary: 'Create user' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateUserDto) {
    return this.usersService.create(tenantId, dto);
  }

  @Get() @ApiOperation({ summary: 'List users' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query() pagination: PaginationDto) {
    return this.usersService.findAll(tenantId, pagination);
  }

  @Put(':id') @ApiOperation({ summary: 'Update user' })
  update(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(tenantId, id, dto);
  }

  @Delete(':id') @ApiOperation({ summary: 'Deactivate user' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.usersService.remove(tenantId, id);
  }
}
