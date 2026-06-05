import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateCampaignDto } from './dto/campaign.dto';
import { PaginationDto, PaginatedResponseDto } from '../../../common/dtos';
import { CampaignStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('campaign-dispatch') private readonly campaignQueue: Queue,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateCampaignDto) {
    const { groupIds, ...campaignData } = dto;

    const campaign = await this.prisma.campaign.create({
      data: {
        ...campaignData,
        tenantId,
        createdById: userId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        groups: groupIds?.length
          ? { create: groupIds.map((groupId: string) => ({ groupId })) }
          : undefined,
      },
      include: { groups: { include: { group: true } } },
    });

    return campaign;
  }

  async findAll(tenantId: string, pagination: PaginationDto) {
    const where: any = { tenantId };
    if (pagination.search) {
      where.name = { contains: pagination.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        include: {
          groups: { include: { group: true } },
          createdBy: { select: { name: true, email: true } },
          instance: { select: { instanceName: true, status: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return PaginatedResponseDto.create(data, total, pagination.page!, pagination.limit!);
  }

  async findOne(tenantId: string, id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, tenantId },
      include: {
        groups: { include: { group: { include: { _count: { select: { leads: true } } } } } },
        createdBy: { select: { name: true, email: true } },
        instance: true,
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  /**
   * Build deduplicated recipient list from campaign groups.
   * A lead in multiple groups receives only ONE message.
   */
  async buildRecipientList(campaignId: string, groupIds: string[]) {
    // Get unique leads across all groups using DISTINCT on lead_id
    const leads = await this.prisma.lead.findMany({
      where: {
        groups: { some: { groupId: { in: groupIds } } },
      },
      distinct: ['id'],
      select: { id: true, phone: true, name: true },
    });

    this.logger.log(
      `Campaign ${campaignId}: ${leads.length} unique leads from ${groupIds.length} groups`,
    );

    // Create recipient records (skip if already exists)
    await this.prisma.campaignRecipient.createMany({
      data: leads.map((lead: { id: string; phone: string; name: string }) => ({
        campaignId,
        leadId: lead.id,
        status: 'PENDING' as const,
      })),
      skipDuplicates: true,
    });

    // Update total count
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { totalRecipients: leads.length },
    });

    return leads.length;
  }

  /**
   * Start campaign: build recipients → enqueue dispatch job
   */
  async start(tenantId: string, campaignId: string) {
    const campaign = await this.findOne(tenantId, campaignId);

    if (!campaign.instanceId) {
      throw new BadRequestException('Campaign must have a WhatsApp instance assigned');
    }

    if (campaign.instance?.status !== 'CONNECTED') {
      throw new BadRequestException('WhatsApp instance is not connected');
    }

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.PAUSED) {
      throw new BadRequestException(`Cannot start campaign with status: ${campaign.status}`);
    }

    // Build deduplicated recipient list
    const groupIds = campaign.groups.map((g: { groupId: string }) => g.groupId);
    const totalRecipients = await this.buildRecipientList(campaignId, groupIds);

    if (totalRecipients === 0) {
      throw new BadRequestException('No recipients found in selected groups');
    }

    // Update status
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.RUNNING, startedAt: new Date() },
    });

    // Enqueue campaign dispatch job
    const delay = campaign.scheduledAt
      ? Math.max(0, new Date(campaign.scheduledAt).getTime() - Date.now())
      : 0;

    await this.campaignQueue.add(
      'dispatch',
      { campaignId, tenantId },
      { delay, attempts: 1, removeOnComplete: true },
    );

    this.logger.log(`Campaign ${campaignId} started with ${totalRecipients} recipients`);

    return { message: 'Campaign started', totalRecipients };
  }

  async pause(tenantId: string, campaignId: string) {
    const campaign = await this.findOne(tenantId, campaignId);
    if (campaign.status !== CampaignStatus.RUNNING) {
      throw new BadRequestException('Only running campaigns can be paused');
    }

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.PAUSED },
    });

    return { message: 'Campaign paused' };
  }

  async getStats(tenantId: string, campaignId: string) {
    await this.findOne(tenantId, campaignId);

    const stats = await this.prisma.campaignRecipient.groupBy({
      by: ['status'],
      where: { campaignId },
      _count: true,
    });

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        totalRecipients: true,
        sentCount: true,
        failedCount: true,
        status: true,
        startedAt: true,
        completedAt: true,
      },
    });

    return {
      campaign,
      breakdown: stats.reduce((acc: Record<string, number>, s: { status: string; _count: number }) => {
        acc[s.status] = s._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
