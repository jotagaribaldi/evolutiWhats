import { WhatsappService } from '../application/whatsapp.service';
export declare class WhatsappController {
    private readonly whatsappService;
    constructor(whatsappService: WhatsappService);
    sync(tenantId: string, role: string): Promise<{
        synced: number;
        created: number;
        updated: number;
        disconnected: number;
    }>;
    create(tenantId: string, role: string, name: string, dailyLimit?: number): Promise<{
        instance: any;
        qrcode: string | undefined;
    }>;
    findAll(tenantId: string, role: string): Promise<any>;
    getQrCode(tenantId: string, role: string, id: string): Promise<{
        qrcode: string;
    }>;
    getStatus(tenantId: string, role: string, id: string): Promise<any>;
    assignTenant(role: string, id: string, tenantId: string | null): Promise<any>;
    disconnect(tenantId: string, role: string, id: string): Promise<any>;
    remove(tenantId: string, role: string, id: string): Promise<any>;
}
