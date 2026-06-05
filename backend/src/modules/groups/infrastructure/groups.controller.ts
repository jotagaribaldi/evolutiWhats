import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators';
import { PaginationDto } from '../../../common/dtos';
import { GroupsService } from '../application/groups.service';
import { CreateGroupDto, UpdateGroupDto } from '../application/dto/group.dto';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new group' })
  create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List groups with lead count' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query() pagination: PaginationDto) {
    return this.groupsService.findAll(tenantId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group by ID' })
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.groupsService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a group' })
  update(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a group' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.groupsService.remove(tenantId, id);
  }

  @Get(':id/leads')
  @ApiOperation({ summary: 'List leads in a group' })
  getLeads(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.groupsService.getLeads(tenantId, id, pagination);
  }

  @Post(':id/leads')
  @ApiOperation({ summary: 'Add leads to a group in batch' })
  addLeads(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string, @Body() body: { leadIds: string[] }) {
    return this.groupsService.addLeads(tenantId, id, body.leadIds);
  }

  @Delete(':id/leads/:leadId')
  @ApiOperation({ summary: 'Remove a lead from a group' })
  removeLeadFromGroup(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Param('leadId') leadId: string,
  ) {
    return this.groupsService.removeLeadFromGroup(tenantId, id, leadId);
  }
}
