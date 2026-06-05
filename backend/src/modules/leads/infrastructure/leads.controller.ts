import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, UploadedFile, UseInterceptors, Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators';
import { PaginationDto } from '../../../common/dtos';
import { LeadsService } from '../application/leads.service';
import { CreateLeadDto, UpdateLeadDto } from '../application/dto/lead.dto';
import { parse } from 'csv-parse/sync';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List leads with pagination and filters' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('groupId') groupId?: string,
    @Query('tag') tag?: string,
  ) {
    return this.leadsService.findAll(tenantId, pagination, { status, groupId, tag });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  findOne(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.leadsService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a lead' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lead' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.leadsService.remove(tenantId, id);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import leads from CSV' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @CurrentUser('tenantId') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const content = file.buffer.toString('utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const leads: CreateLeadDto[] = records.map((r: Record<string, string>) => ({
      name: r.name || r.nome,
      phone: r.phone || r.telefone,
      email: r.email || undefined,
      notes: r.notes || r.observacoes || undefined,
      source: r.source || r.origem || 'csv_import',
      tags: r.tags ? r.tags.split(';').map((t: string) => t.trim()) : [],
    }));

    return this.leadsService.importCsv(tenantId, leads);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export leads as CSV' })
  async exportCsv(
    @CurrentUser('tenantId') tenantId: string,
    @Res() res: Response,
  ) {
    const result = await this.leadsService.findAll(tenantId, { page: 1, limit: 100000, get skip() { return 0; } });
    const leads = result.data;

    const header = 'name,phone,email,status,source,tags,created_at\n';
    const rows = leads.map((l: any) =>
      `"${l.name}","${l.phone}","${l.email || ''}","${l.status}","${l.source || ''}","${(l.tags || []).join(';')}","${l.createdAt}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
    res.send(header + rows);
  }
}
