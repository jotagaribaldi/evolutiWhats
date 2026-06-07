import { PrismaService } from '../../../core/database/prisma.service';
import { EvolutionApiClient } from '../infrastructure/evolution-api.client';
export declare class WhatsappService {
    private readonly prisma;
    private readonly evolutionApi;
    private readonly logger;
    constructor(prisma: PrismaService, evolutionApi: EvolutionApiClient);
    syncFromEvolution(tenantId: string, role: string): Promise<{
        synced: number;
        created: number;
        updated: number;
        disconnected: number;
    }>;
    createInstance(tenantId: string, role: string, instanceName: string, dailyLimit?: number): Promise<{
        instance: any;
        qrcode: string | undefined;
    }>;
    getQrCode(tenantId: string, role: string, id: string): Promise<{
        qrcode: string;
    }>;
    getStatus(tenantId: string, role: string, id: string): Promise<any>;
    findAll(tenantId: string, role: string): Promise<any>;
    findOne(id: string): Promise<any>;
    findOneScoped(tenantId: string, role: string, id: string): Promise<any>;
    assignTenant(role: string, instanceId: string, newTenantId: string | null): Promise<any>;
    disconnect(tenantId: string, role: string, id: string): Promise<any>;
    remove(tenantId: string, role: string, id: string): Promise<any>;
}
