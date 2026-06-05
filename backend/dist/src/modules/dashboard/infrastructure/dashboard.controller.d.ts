import { DashboardService } from '../application/dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
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
