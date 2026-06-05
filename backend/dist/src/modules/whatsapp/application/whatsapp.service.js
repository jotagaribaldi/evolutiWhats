"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/database/prisma.service");
const evolution_api_client_1 = require("../infrastructure/evolution-api.client");
const client_1 = require("@prisma/client");
const STATUS_MAP = {
    open: client_1.InstanceStatus.CONNECTED,
    connecting: client_1.InstanceStatus.CONNECTING,
    close: client_1.InstanceStatus.DISCONNECTED,
};
let WhatsappService = WhatsappService_1 = class WhatsappService {
    prisma;
    evolutionApi;
    logger = new common_1.Logger(WhatsappService_1.name);
    constructor(prisma, evolutionApi) {
        this.prisma = prisma;
        this.evolutionApi = evolutionApi;
    }
    async syncFromEvolution(tenantId) {
        this.logger.log(`Starting Evolution API sync for tenant ${tenantId}`);
        const evolutionInstances = await this.evolutionApi.fetchInstances();
        this.logger.log(`Found ${evolutionInstances.length} instances in Evolution API`);
        const dbInstances = await this.prisma.whatsappInstance.findMany({
            where: { tenantId },
        });
        const dbByName = new Map(dbInstances.map((i) => [i.instanceName, i]));
        const results = {
            synced: evolutionInstances.length,
            created: 0,
            updated: 0,
            disconnected: 0,
        };
        for (const evo of evolutionInstances) {
            const status = STATUS_MAP[evo.connectionStatus] ?? client_1.InstanceStatus.DISCONNECTED;
            const connectionData = {
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
            }
            else {
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
            dbByName.delete(evo.name);
        }
        for (const [, orphan] of dbByName) {
            if (orphan.status !== client_1.InstanceStatus.DISCONNECTED) {
                await this.prisma.whatsappInstance.update({
                    where: { id: orphan.id },
                    data: { status: client_1.InstanceStatus.DISCONNECTED },
                });
                results.disconnected++;
                this.logger.warn(`Instance not in Evolution, marked DISCONNECTED: ${orphan.instanceName}`);
            }
        }
        this.logger.log(`Sync complete: ${JSON.stringify(results)}`);
        return results;
    }
    async createInstance(tenantId, instanceName, dailyLimit = 500) {
        const fullName = `${tenantId.substring(0, 8)}_${instanceName}`;
        const result = await this.evolutionApi.createInstance(fullName);
        const instance = await this.prisma.whatsappInstance.create({
            data: {
                tenantId,
                instanceName: fullName,
                status: client_1.InstanceStatus.CONNECTING,
                dailyLimit,
                connectionData: result.qrcode ? { qrcode: result.qrcode.base64 } : client_1.Prisma.JsonNull,
            },
        });
        return { instance, qrcode: result.qrcode?.base64 };
    }
    async getQrCode(tenantId, id) {
        const instance = await this.findOne(tenantId, id);
        const result = await this.evolutionApi.connectInstance(instance.instanceName);
        return { qrcode: result.base64 };
    }
    async getStatus(tenantId, id) {
        const instance = await this.findOne(tenantId, id);
        const state = await this.evolutionApi.getConnectionState(instance.instanceName);
        const newStatus = STATUS_MAP[state.state] ?? client_1.InstanceStatus.DISCONNECTED;
        if (newStatus !== instance.status) {
            await this.prisma.whatsappInstance.update({
                where: { id },
                data: { status: newStatus },
            });
        }
        return { ...instance, status: newStatus };
    }
    async findAll(tenantId) {
        return this.prisma.whatsappInstance.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(tenantId, id) {
        const instance = await this.prisma.whatsappInstance.findFirst({
            where: { id, tenantId },
        });
        if (!instance)
            throw new common_1.NotFoundException('Instance not found');
        return instance;
    }
    async disconnect(tenantId, id) {
        const instance = await this.findOne(tenantId, id);
        await this.evolutionApi.logoutInstance(instance.instanceName);
        return this.prisma.whatsappInstance.update({
            where: { id },
            data: { status: client_1.InstanceStatus.DISCONNECTED },
        });
    }
    async remove(tenantId, id) {
        const instance = await this.findOne(tenantId, id);
        try {
            await this.evolutionApi.deleteInstance(instance.instanceName);
        }
        catch { }
        return this.prisma.whatsappInstance.delete({ where: { id } });
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        evolution_api_client_1.EvolutionApiClient])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map