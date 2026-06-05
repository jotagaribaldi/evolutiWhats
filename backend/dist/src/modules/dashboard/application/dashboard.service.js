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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/database/prisma.service");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats(tenantId) {
        const [totalLeads, totalGroups, totalCampaigns, activeCampaigns, totalMessagesSent, totalMessagesFailed, recentLeads, campaignsByStatus,] = await Promise.all([
            this.prisma.lead.count({ where: { tenantId } }),
            this.prisma.group.count({ where: { tenantId } }),
            this.prisma.campaign.count({ where: { tenantId } }),
            this.prisma.campaign.count({ where: { tenantId, status: 'RUNNING' } }),
            this.prisma.campaign.aggregate({ where: { tenantId }, _sum: { sentCount: true } }),
            this.prisma.campaign.aggregate({ where: { tenantId }, _sum: { failedCount: true } }),
            this.prisma.lead.count({
                where: {
                    tenantId,
                    createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                },
            }),
            this.prisma.campaign.groupBy({
                by: ['status'],
                where: { tenantId },
                _count: true,
            }),
        ]);
        const totalSent = totalMessagesSent._sum.sentCount || 0;
        const totalFailed = totalMessagesFailed._sum.failedCount || 0;
        const successRate = totalSent + totalFailed > 0
            ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1)
            : '0';
        return {
            leads: { total: totalLeads, last30Days: recentLeads },
            groups: { total: totalGroups },
            campaigns: {
                total: totalCampaigns,
                active: activeCampaigns,
                byStatus: campaignsByStatus.reduce((acc, s) => {
                    acc[s.status] = s._count;
                    return acc;
                }, {}),
            },
            messages: {
                sent: totalSent,
                failed: totalFailed,
                successRate: `${successRate}%`,
            },
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map