import { PrismaService } from '../../../core/database/prisma.service';
import { EvolutionApiClient } from '../infrastructure/evolution-api.client';
export declare class WhatsappService {
    private readonly prisma;
    private readonly evolutionApi;
    private readonly logger;
    constructor(prisma: PrismaService, evolutionApi: EvolutionApiClient);
    syncFromEvolution(tenantId: string): Promise<{
        synced: number;
        created: number;
        updated: number;
        disconnected: number;
    }>;
    createInstance(tenantId: string, instanceName: string, dailyLimit?: number): Promise<{
        instance: any;
        qrcode: string | undefined;
    }>;
    getQrCode(tenantId: string, id: string): Promise<{
        qrcode: string;
    }>;
    getStatus(tenantId: string, id: string): Promise<any>;
    findAll(tenantId: string): Promise<any>;
    findOne(tenantId: string, id: string): Promise<any>;
    disconnect(tenantId: string, id: string): Promise<any>;
    remove(tenantId: string, id: string): Promise<any>;
}
