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
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/database/prisma.service");
const dtos_1 = require("../../../common/dtos");
let GroupsService = class GroupsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, dto) {
        const existing = await this.prisma.group.findUnique({
            where: { tenantId_name: { tenantId, name: dto.name } },
        });
        if (existing)
            throw new common_1.ConflictException('Group name already exists');
        return this.prisma.group.create({
            data: { ...dto, tenantId },
        });
    }
    async findAll(tenantId, pagination) {
        const where = { tenantId };
        if (pagination.search) {
            where.name = { contains: pagination.search, mode: 'insensitive' };
        }
        const [data, total] = await Promise.all([
            this.prisma.group.findMany({
                where,
                include: { _count: { select: { leads: true } } },
                skip: pagination.skip,
                take: pagination.limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.group.count({ where }),
        ]);
        return dtos_1.PaginatedResponseDto.create(data, total, pagination.page, pagination.limit);
    }
    async findOne(tenantId, id) {
        const group = await this.prisma.group.findFirst({
            where: { id, tenantId },
            include: { _count: { select: { leads: true } } },
        });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        return group;
    }
    async update(tenantId, id, dto) {
        await this.findOne(tenantId, id);
        return this.prisma.group.update({ where: { id }, data: dto });
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        return this.prisma.group.delete({ where: { id } });
    }
    async getLeads(tenantId, groupId, pagination) {
        await this.findOne(tenantId, groupId);
        const where = { groups: { some: { groupId } } };
        const [data, total] = await Promise.all([
            this.prisma.lead.findMany({
                where,
                skip: pagination.skip,
                take: pagination.limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.lead.count({ where }),
        ]);
        return dtos_1.PaginatedResponseDto.create(data, total, pagination.page, pagination.limit);
    }
    async addLeads(tenantId, groupId, leadIds) {
        await this.findOne(tenantId, groupId);
        const validLeads = await this.prisma.lead.findMany({
            where: { id: { in: leadIds }, tenantId },
            select: { id: true },
        });
        const validIds = validLeads.map((l) => l.id);
        if (validIds.length === 0) {
            return { added: 0, skipped: leadIds.length };
        }
        const result = await this.prisma.leadGroup.createMany({
            data: validIds.map((leadId) => ({ leadId, groupId })),
            skipDuplicates: true,
        });
        return { added: result.count, skipped: leadIds.length - result.count };
    }
    async removeLeadFromGroup(tenantId, groupId, leadId) {
        await this.findOne(tenantId, groupId);
        await this.prisma.leadGroup.delete({
            where: { leadId_groupId: { leadId, groupId } },
        });
        return { removed: true };
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GroupsService);
//# sourceMappingURL=groups.service.js.map