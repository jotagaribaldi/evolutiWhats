import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { EvolutionApiClient } from '../infrastructure/evolution-api.client';
import { InstanceStatus, Prisma, WhatsappInstance } from '@prisma/client';

/** Map Evolution connectionStatus → InstanceStatus enum */
const STATUS_MAP: Record<string, InstanceStatus> = {
  open: InstanceStatus.CONNECTED,
  connecting: InstanceStatus.CONNECTING,
  close: InstanceStatus.DISCONNECTED,
};

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evolutionApi: EvolutionApiClient,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // SYNC — Import all instances from Evolution API into the DB
  // ──────────────────────────────────────────────────────────────

  /**
   * Fetches all instances from the Evolution API and upserts them into the DB.
   *
   * SUPER_ADMIN: syncs globally — new instances get tenantId = null (unassigned).
   * COMPANY_ADMIN/USER: syncs only instances already linked to their tenant.
   *
   * Returns a summary: { synced, created, updated, disconnected }
   */
  async syncFromEvolution(tenantId: string, role: string) {
    this.logger.log(`Starting Evolution API sync for tenant ${tenantId} (role: ${role})`);
    const isSuperAdmin = role === 'SUPER_ADMIN';

    // 1. Fetch all instances from Evolution API
    const evolutionInstances = await this.evolutionApi.fetchInstances();
    this.logger.log(`Found ${evolutionInstances.length} instances in Evolution API`);

    // 2. Load existing DB records
    const dbInstances = await this.prisma.whatsappInstance.findMany({
      where: isSuperAdmin ? {} : { tenantId },
    });
    const dbByName = new Map<string, WhatsappInstance>(
      dbInstances.map((i: WhatsappInstance) => [i.instanceName, i]),
    );

    const results = { synced: evolutionInstances.length, created: 0, updated: 0, disconnected: 0 };

    // 3. Upsert each Evolution instance
    for (const evo of evolutionInstances) {
      const status = STATUS_MAP[evo.connectionStatus] ?? InstanceStatus.DISCONNECTED;
      const connectionData: Prisma.InputJsonValue = {
        evolutionId: evo.id,
        ownerJid: evo.ownerJid ?? null,
        profileName: evo.profileName ?? null,
        profilePicUrl: evo.profilePicUrl ?? null,
        integration: evo.integration,
        messageCount: evo._count?.Message ?? 0,
      };

      const existing = dbByName.get(evo.name);

      if (existing) {
        await this.prisma.whatsappInstance.update({
          where: { id: existing.id },
          data: { status, connectionData },
        });
        results.updated++;
        this.logger.debug(`Updated instance: ${evo.name} → ${status}`);
      } else {
        // Only create in global scope (SUPER_ADMIN) — tenant users can't import unknown instances
        if (isSuperAdmin) {
          await this.prisma.whatsappInstance.create({
            data: {
              tenantId: null,       // Unassigned until root binds it
              instanceName: evo.name,
              status,
              connectionData,
              dailyLimit: 500,
            },
          });
          results.created++;
          this.logger.log(`Imported unassigned instance: ${evo.name} (${status})`);
        }
      }

      dbByName.delete(evo.name);
    }

    // 4. Any DB instances NOT in Evolution → mark DISCONNECTED (only within scope)
    for (const [, orphan] of dbByName as Map<string, WhatsappInstance>) {
      if (orphan.status !== InstanceStatus.DISCONNECTED) {
        await this.prisma.whatsappInstance.update({
          where: { id: orphan.id },
          data: { status: InstanceStatus.DISCONNECTED },
        });
        results.disconnected++;
        this.logger.warn(`Instance not in Evolution, marked DISCONNECTED: ${orphan.instanceName}`);
      }
    }

    this.logger.log(`Sync complete: ${JSON.stringify(results)}`);
    return results;
  }

  // ──────────────────────────────────────────────────────────────
  // CRUD
  // ──────────────────────────────────────────────────────────────

  async createInstance(tenantId: string, role: string, instanceName: string, dailyLimit = 500) {
    const fullName = `${tenantId.substring(0, 8)}_${instanceName}`;
    const result = await this.evolutionApi.createInstance(fullName);

    // SUPER_ADMIN creates unassigned; others are auto-linked to their tenant
    const assignedTenantId = role === 'SUPER_ADMIN' ? null : tenantId;

    const instance = await this.prisma.whatsappInstance.create({
      data: {
        tenantId: assignedTenantId,
        instanceName: fullName,
        status: InstanceStatus.CONNECTING,
        dailyLimit,
        connectionData: result.qrcode ? { qrcode: result.qrcode.base64 } : Prisma.JsonNull,
      },
    });

    return { instance, qrcode: result.qrcode?.base64 };
  }

  async getQrCode(tenantId: string, role: string, id: string) {
    const instance = await this.findOneScoped(tenantId, role, id);
    const result = await this.evolutionApi.connectInstance(instance.instanceName);
    return { qrcode: result.base64 };
  }

  async getStatus(tenantId: string, role: string, id: string) {
    const instance = await this.findOneScoped(tenantId, role, id);
    const state = await this.evolutionApi.getConnectionState(instance.instanceName);

    const newStatus = STATUS_MAP[state.state] ?? InstanceStatus.DISCONNECTED;

    if (newStatus !== instance.status) {
      await this.prisma.whatsappInstance.update({
        where: { id },
        data: { status: newStatus },
      });
    }

    return { ...instance, status: newStatus };
  }

  /**
   * SUPER_ADMIN: returns all instances with tenant info.
   * Others: returns only instances linked to their tenant.
   */
  async findAll(tenantId: string, role: string) {
    if (role === 'SUPER_ADMIN') {
      return this.prisma.whatsappInstance.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
    }

    return this.prisma.whatsappInstance.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const instance = await this.prisma.whatsappInstance.findUnique({ where: { id } });
    if (!instance) throw new NotFoundException('Instance not found');
    return instance;
  }

  /**
   * Finds an instance scoped by tenant (or globally for SUPER_ADMIN).
   */
  async findOneScoped(tenantId: string, role: string, id: string) {
    const where = role === 'SUPER_ADMIN' ? { id } : { id, tenantId };
    const instance = await this.prisma.whatsappInstance.findFirst({ where });
    if (!instance) throw new NotFoundException('Instance not found');
    return instance;
  }

  /**
   * Assigns or removes the tenant association for a given instance.
   * Only SUPER_ADMIN can call this.
   */
  async assignTenant(role: string, instanceId: string, newTenantId: string | null) {
    if (role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can assign instances to tenants');
    }

    // Validate tenant exists if assigning
    if (newTenantId) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: newTenantId } });
      if (!tenant) throw new NotFoundException('Tenant not found');
    }

    return this.prisma.whatsappInstance.update({
      where: { id: instanceId },
      data: { tenantId: newTenantId },
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async disconnect(tenantId: string, role: string, id: string) {
    const instance = await this.findOneScoped(tenantId, role, id);
    await this.evolutionApi.logoutInstance(instance.instanceName);
    return this.prisma.whatsappInstance.update({
      where: { id },
      data: { status: InstanceStatus.DISCONNECTED },
    });
  }

  async remove(tenantId: string, role: string, id: string) {
    const instance = await this.findOneScoped(tenantId, role, id);
    try {
      await this.evolutionApi.deleteInstance(instance.instanceName);
    } catch { /* instance may not exist in Evolution API */ }
    return this.prisma.whatsappInstance.delete({ where: { id } });
  }
}
