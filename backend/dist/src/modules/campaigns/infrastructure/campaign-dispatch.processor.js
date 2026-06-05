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
var CampaignDispatchProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignDispatchProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/database/prisma.service");
const evolution_api_client_1 = require("../../whatsapp/infrastructure/evolution-api.client");
const client_1 = require("@prisma/client");
function getHumanizedDelay(minMs, maxMs) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}
function personalizeMessage(template, leadName, leadPhone) {
    return template
        .replace(/\{\{nome\}\}/gi, leadName)
        .replace(/\{\{name\}\}/gi, leadName)
        .replace(/\{nome\}/gi, leadName)
        .replace(/\{name\}/gi, leadName)
        .replace(/\{\{telefone\}\}/gi, leadPhone)
        .replace(/\{\{phone\}\}/gi, leadPhone)
        .replace(/\{telefone\}/gi, leadPhone)
        .replace(/\{phone\}/gi, leadPhone);
}
let CampaignDispatchProcessor = CampaignDispatchProcessor_1 = class CampaignDispatchProcessor extends bullmq_1.WorkerHost {
    prisma;
    evolutionApi;
    logger = new common_1.Logger(CampaignDispatchProcessor_1.name);
    constructor(prisma, evolutionApi) {
        super();
        this.prisma = prisma;
        this.evolutionApi = evolutionApi;
    }
    async process(job) {
        const { campaignId } = job.data;
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { instance: true },
        });
        if (!campaign || !campaign.instance) {
            this.logger.error(`Campaign ${campaignId} not found or has no instance`);
            return;
        }
        if (campaign.status !== client_1.CampaignStatus.RUNNING) {
            this.logger.warn(`Campaign ${campaignId} is not in RUNNING state, skipping`);
            return;
        }
        const recipients = await this.prisma.campaignRecipient.findMany({
            where: { campaignId, status: client_1.RecipientStatus.PENDING },
            include: { lead: { select: { phone: true, name: true } } },
            orderBy: { lead: { name: 'asc' } },
        });
        this.logger.log(`Processing campaign ${campaignId}: ${recipients.length} pending messages`);
        let sentCount = campaign.sentCount;
        let failedCount = campaign.failedCount;
        for (const recipient of recipients) {
            const currentStatus = await this.prisma.campaign.findUnique({
                where: { id: campaignId },
                select: { status: true },
            });
            if (currentStatus?.status === client_1.CampaignStatus.PAUSED) {
                this.logger.log(`Campaign ${campaignId} was paused, stopping dispatch`);
                return;
            }
            const message = personalizeMessage(campaign.messageTemplate, recipient.lead.name, recipient.lead.phone);
            const result = await this.evolutionApi.sendText(campaign.instance.instanceName, recipient.lead.phone, message);
            if (result.success) {
                await this.prisma.campaignRecipient.update({
                    where: { id: recipient.id },
                    data: { status: client_1.RecipientStatus.SENT, sentAt: new Date() },
                });
                sentCount++;
            }
            else {
                await this.prisma.campaignRecipient.update({
                    where: { id: recipient.id },
                    data: {
                        status: client_1.RecipientStatus.FAILED,
                        errorMessage: result.error,
                    },
                });
                failedCount++;
            }
            await this.prisma.campaign.update({
                where: { id: campaignId },
                data: { sentCount, failedCount },
            });
            const delay = getHumanizedDelay(campaign.minDelayMs, campaign.maxDelayMs);
            this.logger.debug(`Waiting ${delay}ms before next message`);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        await this.prisma.campaign.update({
            where: { id: campaignId },
            data: {
                status: client_1.CampaignStatus.COMPLETED,
                completedAt: new Date(),
                sentCount,
                failedCount,
            },
        });
        this.logger.log(`Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`);
    }
};
exports.CampaignDispatchProcessor = CampaignDispatchProcessor;
exports.CampaignDispatchProcessor = CampaignDispatchProcessor = CampaignDispatchProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('campaign-dispatch'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        evolution_api_client_1.EvolutionApiClient])
], CampaignDispatchProcessor);
//# sourceMappingURL=campaign-dispatch.processor.js.map