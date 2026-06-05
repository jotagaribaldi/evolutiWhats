import { PrismaService } from '../../../core/database/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getStats(tenantId: string): Promise<{
        leads: {
            total: any;
            last30Days: any;
        };
        groups: {
            total: any;
        };
        campaigns: {
            total: any;
            active: any;
            byStatus: any;
        };
        messages: {
            sent: any;
            failed: any;
            successRate: string;
        };
    }>;
}
