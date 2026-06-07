import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../core/database/prisma.service';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/tenants')
export class TenantsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'List all tenants (SUPER_ADMIN only)',
    description: 'Returns all companies registered in the system. Used for whatsapp instance assignment.',
  })
  async findAll() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            whatsappInstances: true,
            campaigns: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}
