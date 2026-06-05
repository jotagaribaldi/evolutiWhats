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
exports.LeadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/database/prisma.service");
const dtos_1 = require("../../../common/dtos");
let LeadsService = class LeadsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, dto) {
        const existing = await this.prisma.lead.findUnique({
            where: { tenantId_phone: { tenantId, phone: dto.phone } },
        });
        if (existing) {
            throw new common_1.ConflictException('A lead with this phone number already exists');
        }
        const { groupIds, ...leadData } = dto;
        return this.prisma.lead.create({
            data: {
                ...leadData,
                tenantId,
                groups: groupIds?.length
                    ? { create: groupIds.map((groupId) => ({ groupId })) }
                    : undefined,
            },
            include: { groups: { include: { group: true } } },
        });
    }
    async findAll(tenantId, pagination, filters) {
        const where = { tenantId };
        if (pagination.search) {
            where.OR = [
                { name: { contains: pagination.search, mode: 'insensitive' } },
                { phone: { contains: pagination.search } },
                { email: { contains: pagination.search, mode: 'insensitive' } },
            ];
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.groupId) {
            where.groups = { some: { groupId: filters.groupId } };
        }
        if (filters?.tag) {
            where.tags = { has: filters.tag };
        }
        const [data, total] = await Promise.all([
            this.prisma.lead.findMany({
                where,
                include: { groups: { include: { group: true } } },
                skip: pagination.skip,
                take: pagination.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.lead.count({ where }),
        ]);
        return dtos_1.PaginatedResponseDto.create(data, total, pagination.page, pagination.limit);
    }
    async findOne(tenantId, id) {
        const lead = await this.prisma.lead.findFirst({
            where: { id, tenantId },
            include: { groups: { include: { group: true } } },
        });
        if (!lead)
            throw new common_1.NotFoundException('Lead not found');
        return lead;
    }
    async update(tenantId, id, dto) {
        await this.findOne(tenantId, id);
        if (dto.phone) {
            const existing = await this.prisma.lead.findFirst({
                where: { tenantId, phone: dto.phone, NOT: { id } },
            });
            if (existing) {
                throw new common_1.ConflictException('A lead with this phone number already exists');
            }
        }
        const { groupIds, ...leadData } = dto;
        return this.prisma.lead.update({
            where: { id },
            data: {
                ...leadData,
                groups: groupIds
                    ? {
                        deleteMany: {},
                        create: groupIds.map((groupId) => ({ groupId })),
                    }
                    : undefined,
            },
            include: { groups: { include: { group: true } } },
        });
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        return this.prisma.lead.delete({ where: { id } });
    }
    async importCsv(tenantId, records) {
        const results = { imported: 0, skipped: 0, errors: [] };
        for (const record of records) {
            try {
                await this.create(tenantId, record);
                results.imported++;
            }
            catch (error) {
                if (error instanceof common_1.ConflictException) {
                    results.skipped++;
                }
                else {
                    results.errors.push(`Phone ${record.phone}: ${error.message}`);
                }
            }
        }
        return results;
    }
};
exports.LeadsService = LeadsService;
exports.LeadsService = LeadsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LeadsService);
//# sourceMappingURL=leads.service.js.map