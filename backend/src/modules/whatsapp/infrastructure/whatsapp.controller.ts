import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators';
import { WhatsappService } from '../application/whatsapp.service';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/whatsapp/instances')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  // ── Sync ──────────────────────────────────────────────────────

  @Post('sync')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync instances from Evolution API',
    description:
      'SUPER_ADMIN: syncs all instances globally (new ones get tenantId=null). ' +
      'COMPANY_ADMIN: syncs only instances linked to their tenant.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync completed',
    schema: { example: { synced: 3, created: 2, updated: 1, disconnected: 0 } },
  })
  sync(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.whatsappService.syncFromEvolution(tenantId, role);
  }

  // ── CRUD ──────────────────────────────────────────────────────

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Create a new WhatsApp instance in Evolution API' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') role: string,
    @Body('instanceName') name: string,
    @Body('dailyLimit') dailyLimit?: number,
  ) {
    return this.whatsappService.createInstance(tenantId, role, name, dailyLimit);
  }

  @Get()
  @ApiOperation({
    summary: 'List WhatsApp instances',
    description:
      'SUPER_ADMIN: returns all instances with tenant info. Others: only their tenant instances.',
  })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.whatsappService.findAll(tenantId, role);
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Get QR code for connection' })
  getQrCode(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.whatsappService.getQrCode(tenantId, role, id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get instance connection status (live check against Evolution API)' })
  getStatus(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.whatsappService.getStatus(tenantId, role, id);
  }

  // ── Assign Tenant (SUPER_ADMIN only) ──────────────────────────

  @Patch(':id/assign')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Assign or unassign a tenant to a WhatsApp instance (SUPER_ADMIN only)',
    description: 'Set tenantId to link the instance to a company. Set null to unlink.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tenantId: { type: 'string', nullable: true, description: 'UUID of the tenant, or null to unassign' },
      },
    },
  })
  assignTenant(
    @CurrentUser('role') role: string,
    @Param('id') id: string,
    @Body('tenantId') tenantId: string | null,
  ) {
    return this.whatsappService.assignTenant(role, id, tenantId ?? null);
  }

  // ── Disconnect / Delete ────────────────────────────────────────

  @Delete(':id/disconnect')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Logout and disconnect instance from Evolution API' })
  disconnect(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.whatsappService.disconnect(tenantId, role, id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Delete instance from both Evolution API and local database' })
  remove(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.whatsappService.remove(tenantId, role, id);
  }
}
