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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CampaignsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/database/prisma.service");
const dtos_1 = require("../../../common/dtos");
const client_1 = require("@prisma/client");
const bullmq_1 = require("bullmq");
const bullmq_2 = require("@nestjs/bullmq");
let CampaignsService = CampaignsService_1 = class CampaignsService {
    prisma;
    campaignQueue;
    logger = new common_1.Logger(CampaignsService_1.name);
    constructor(prisma, campaignQueue) {
        this.prisma = prisma;
        this.campaignQueue = campaignQueue;
    }
    async create(tenantId, userId, dto) {
        const { groupIds, ...campaignData } = dto;
        const campaign = await this.prisma.campaign.create({
            data: {
                ...campaignData,
                tenantId,
                createdById: userId,
                scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
                groups: groupIds?.length
                    ? { create: groupIds.map((groupId) => ({ groupId })) }
                    : undefined,
            },
            include: { groups: { include: { group: true } } },
        });
        return campaign;
    }
    async findAll(tenantId, pagination) {
        const where = { tenantId };
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
        return dtos_1.PaginatedResponseDto.create(data, total, pagination.page, pagination.limit);
    }
    async findOne(tenantId, id) {
        const campaign = await this.prisma.campaign.findFirst({
            where: { id, tenantId },
            include: {
                groups: { include: { group: { include: { _count: { select: { leads: true } } } } } },
                createdBy: { select: { name: true, email: true } },
                instance: true,
            },
        });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        return campaign;
    }
    async buildRecipientList(campaignId, groupIds) {
        const leads = await this.prisma.lead.findMany({
            where: {
                groups: { some: { groupId: { in: groupIds } } },
            },
            distinct: ['id'],
            select: { id: true, phone: true, name: true },
        });
        this.logger.log(`Campaign ${campaignId}: ${leads.length} unique leads from ${groupIds.length} groups`);
        await this.prisma.campaignRecipient.createMany({
            data: leads.map((lead) => ({
                campaignId,
                leadId: lead.id,
                status: 'PENDING',
            })),
            skipDuplicates: true,
        });
        await this.prisma.campaign.update({
            where: { id: campaignId },
            data: { totalRecipients: leads.length },
        });
        return leads.length;
    }
    async start(tenantId, campaignId) {
        const campaign = await this.findOne(tenantId, campaignId);
        if (!campaign.instanceId) {
            throw new common_1.BadRequestException('Campaign must have a WhatsApp instance assigned');
        }
        if (campaign.instance?.status !== 'CONNECTED') {
            throw new common_1.BadRequestException('WhatsApp instance is not connected');
        }
        if (campaign.status !== client_1.CampaignStatus.DRAFT && campaign.status !== client_1.CampaignStatus.PAUSED) {
            throw new common_1.BadRequestException(`Cannot start campaign with status: ${campaign.status}`);
        }
        const groupIds = campaign.groups.map((g) => g.groupId);
        const totalRecipients = await this.buildRecipientList(campaignId, groupIds);
        if (totalRecipients === 0) {
            throw new common_1.BadRequestException('No recipients found in selected groups');
        }
        await this.prisma.campaign.update({
            where: { id: campaignId },
            data: { status: client_1.CampaignStatus.RUNNING, startedAt: new Date() },
        });
        const delay = campaign.scheduledAt
            ? Math.max(0, new Date(campaign.scheduledAt).getTime() - Date.now())
            : 0;
        await this.campaignQueue.add('dispatch', { campaignId, tenantId }, { delay, attempts: 1, removeOnComplete: true });
        this.logger.log(`Campaign ${campaignId} started with ${totalRecipients} recipients`);
        return { message: 'Campaign started', totalRecipients };
    }
    async pause(tenantId, campaignId) {
        const campaign = await this.findOne(tenantId, campaignId);
        if (campaign.status !== client_1.CampaignStatus.RUNNING) {
            throw new common_1.BadRequestException('Only running campaigns can be paused');
        }
        await this.prisma.campaign.update({
            where: { id: campaignId },
            data: { status: client_1.CampaignStatus.PAUSED },
        });
        return { message: 'Campaign paused' };
    }
    async getStats(tenantId, campaignId) {
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
            breakdown: stats.reduce((acc, s) => {
                acc[s.status] = s._count;
                return acc;
            }, {}),
        };
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = CampaignsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_2.InjectQueue)('campaign-dispatch')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_1.Queue])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map