import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { PaginationDto, PaginatedResponseDto } from '../../../common/dtos';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateLeadDto) {
    // Check duplicate phone within tenant
    const existing = await this.prisma.lead.findUnique({
      where: { tenantId_phone: { tenantId, phone: dto.phone } },
    });

    if (existing) {
      throw new ConflictException('A lead with this phone number already exists');
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

  async findAll(tenantId: string, pagination: PaginationDto, filters?: { status?: string; groupId?: string; tag?: string }) {
    const where: Prisma.LeadWhereInput = { tenantId };

    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { phone: { contains: pagination.search } },
        { email: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status as any;
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

    return PaginatedResponseDto.create(data, total, pagination.page!, pagination.limit!);
  }

  async findOne(tenantId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
      include: { groups: { include: { group: true } } },
    });

    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async update(tenantId: string, id: string, dto: UpdateLeadDto) {
    await this.findOne(tenantId, id);

    if (dto.phone) {
      const existing = await this.prisma.lead.findFirst({
        where: { tenantId, phone: dto.phone, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('A lead with this phone number already exists');
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

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.lead.delete({ where: { id } });
  }

  async importCsv(tenantId: string, records: CreateLeadDto[]) {
    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    for (const record of records) {
      try {
        await this.create(tenantId, record);
        results.imported++;
      } catch (error) {
        if (error instanceof ConflictException) {
          results.skipped++;
        } else {
          results.errors.push(`Phone ${record.phone}: ${(error as Error).message}`);
        }
      }
    }

    return results;
  }
}
