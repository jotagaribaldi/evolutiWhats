import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(tenantId: string) {
    const [
      totalLeads,
      totalGroups,
      totalCampaigns,
      activeCampaigns,
      totalMessagesSent,
      totalMessagesFailed,
      recentLeads,
      campaignsByStatus,
    ] = await Promise.all([
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
        byStatus: campaignsByStatus.reduce((acc: Record<string, number>, s: { status: string; _count: number }) => {
          acc[s.status] = s._count;
          return acc;
        }, {} as Record<string, number>),
      },
      messages: {
        sent: totalSent,
        failed: totalFailed,
        successRate: `${successRate}%`,
      },
    };
  }
}
