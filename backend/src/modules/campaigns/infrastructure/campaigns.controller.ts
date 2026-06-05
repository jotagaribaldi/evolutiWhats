import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators';
import { PaginationDto } from '../../../common/dtos';
import { CampaignsService } from '../application/campaigns.service';
import { CreateCampaignDto } from '../application/dto/campaign.dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.campaignsService.create(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List campaigns' })
  findAll(@CurrentUser('tenantId') tenantId: string, @Query() pagination: PaginationDto) {
    return this.campaignsService.findAll(tenantId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details' })
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.campaignsService.findOne(tenantId, id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a campaign (builds recipients + dispatches)' })
  start(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.campaignsService.start(tenantId, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a running campaign' })
  pause(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.campaignsService.pause(tenantId, id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  getStats(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.campaignsService.getStats(tenantId, id);
  }
}
