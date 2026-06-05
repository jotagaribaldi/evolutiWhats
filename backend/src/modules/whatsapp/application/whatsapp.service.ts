import { Injectable, NotFoundException, Logger } from '@nestjs/common';
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
   * Fetches all instances from the Evolution API and upserts them
   * into the local database for the given tenant.
   *
   * Rules:
   *  - If an instance with the same `instanceName` already exists → update status + connectionData
   *  - If it doesn't exist → create a new record
   *  - Instances in the DB that are NOT in Evolution → mark as DISCONNECTED
   *
   * Returns a summary: { synced, created, updated, disconnected }
   */
  async syncFromEvolution(tenantId: string) {
    this.logger.log(`Starting Evolution API sync for tenant ${tenantId}`);

    // 1. Fetch all instances from Evolution API
    const evolutionInstances = await this.evolutionApi.fetchInstances();
    this.logger.log(`Found ${evolutionInstances.length} instances in Evolution API`);

    // 2. Load all existing DB records for this tenant
    const dbInstances = await this.prisma.whatsappInstance.findMany({
      where: { tenantId },
    });
    const dbByName = new Map<string, WhatsappInstance>(dbInstances.map((i: WhatsappInstance) => [i.instanceName, i]));

    const results = {
      synced: evolutionInstances.length,
      created: 0,
      updated: 0,
      disconnected: 0,
    };

    // 3. Upsert each Evolution instance into the DB
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
        // Update status and metadata
        await this.prisma.whatsappInstance.update({
          where: { id: existing.id },
          data: { status, connectionData },
        });
        results.updated++;
        this.logger.debug(`Updated instance: ${evo.name} → ${status}`);
      } else {
        // Create new record
        await this.prisma.whatsappInstance.create({
          data: {
            tenantId,
            instanceName: evo.name,
            status,
            connectionData,
            dailyLimit: 500,
          },
        });
        results.created++;
        this.logger.log(`Imported new instance: ${evo.name} (${status})`);
      }

      // Mark as handled so we know which ones disappeared from Evolution
      dbByName.delete(evo.name);
    }

    // 4. Any DB instances NOT returned by Evolution → mark DISCONNECTED
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

  async createInstance(tenantId: string, instanceName: string, dailyLimit = 500) {
    const fullName = `${tenantId.substring(0, 8)}_${instanceName}`;
    const result = await this.evolutionApi.createInstance(fullName);

    const instance = await this.prisma.whatsappInstance.create({
      data: {
        tenantId,
        instanceName: fullName,
        status: InstanceStatus.CONNECTING,
        dailyLimit,
        connectionData: result.qrcode ? { qrcode: result.qrcode.base64 } : Prisma.JsonNull,
      },
    });

    return { instance, qrcode: result.qrcode?.base64 };
  }

  async getQrCode(tenantId: string, id: string) {
    const instance = await this.findOne(tenantId, id);
    const result = await this.evolutionApi.connectInstance(instance.instanceName);
    return { qrcode: result.base64 };
  }

  async getStatus(tenantId: string, id: string) {
    const instance = await this.findOne(tenantId, id);
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

  async findAll(tenantId: string) {
    return this.prisma.whatsappInstance.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const instance = await this.prisma.whatsappInstance.findFirst({
      where: { id, tenantId },
    });
    if (!instance) throw new NotFoundException('Instance not found');
    return instance;
  }

  async disconnect(tenantId: string, id: string) {
    const instance = await this.findOne(tenantId, id);
    await this.evolutionApi.logoutInstance(instance.instanceName);
    return this.prisma.whatsappInstance.update({
      where: { id },
      data: { status: InstanceStatus.DISCONNECTED },
    });
  }

  async remove(tenantId: string, id: string) {
    const instance = await this.findOne(tenantId, id);
    try {
      await this.evolutionApi.deleteInstance(instance.instanceName);
    } catch { /* instance may not exist in Evolution API */ }
    return this.prisma.whatsappInstance.delete({ where: { id } });
  }
}
