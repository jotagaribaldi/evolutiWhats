import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
      'Fetches all instances from the Evolution API and upserts them into the local database. ' +
      'Creates new records, updates existing ones, and marks orphaned instances as DISCONNECTED.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync completed',
    schema: {
      example: { synced: 3, created: 2, updated: 1, disconnected: 0 },
    },
  })
  sync(@CurrentUser('tenantId') tenantId: string) {
    return this.whatsappService.syncFromEvolution(tenantId);
  }

  // ── CRUD ──────────────────────────────────────────────────────

  @Post()
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Create a new WhatsApp instance in Evolution API' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body('instanceName') name: string,
    @Body('dailyLimit') dailyLimit?: number,
  ) {
    return this.whatsappService.createInstance(tenantId, name, dailyLimit);
  }

  @Get()
  @ApiOperation({ summary: 'List all WhatsApp instances' })
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.whatsappService.findAll(tenantId);
  }

  @Get(':id/qr')
  @ApiOperation({ summary: 'Get QR code for connection' })
  getQrCode(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.whatsappService.getQrCode(tenantId, id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get instance connection status (live check against Evolution API)' })
  getStatus(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.whatsappService.getStatus(tenantId, id);
  }

  @Delete(':id/disconnect')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Logout and disconnect instance from Evolution API' })
  disconnect(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.whatsappService.disconnect(tenantId, id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Delete instance from both Evolution API and local database' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.whatsappService.remove(tenantId, id);
  }
}
