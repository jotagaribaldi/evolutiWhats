import { WhatsappService } from '../application/whatsapp.service';
export declare class WhatsappController {
    private readonly whatsappService;
    constructor(whatsappService: WhatsappService);
    sync(tenantId: string): Promise<{
        synced: number;
        created: number;
        updated: number;
        disconnected: number;
    }>;
    create(tenantId: string, name: string, dailyLimit?: number): Promise<{
        instance: any;
        qrcode: string | undefined;
    }>;
    findAll(tenantId: string): Promise<any>;
    getQrCode(tenantId: string, id: string): Promise<{
        qrcode: string;
    }>;
    getStatus(tenantId: string, id: string): Promise<any>;
    disconnect(tenantId: string, id: string): Promise<any>;
    remove(tenantId: string, id: string): Promise<any>;
}
