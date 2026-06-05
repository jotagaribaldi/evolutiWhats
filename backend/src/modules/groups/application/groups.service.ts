import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
import { PaginationDto, PaginatedResponseDto } from '../../../common/dtos';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateGroupDto) {
    const existing = await this.prisma.group.findUnique({
      where: { tenantId_name: { tenantId, name: dto.name } },
    });
    if (existing) throw new ConflictException('Group name already exists');

    return this.prisma.group.create({
      data: { ...dto, tenantId },
    });
  }

  async findAll(tenantId: string, pagination: PaginationDto) {
    const where: any = { tenantId };
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

    return PaginatedResponseDto.create(data, total, pagination.page!, pagination.limit!);
  }

  async findOne(tenantId: string, id: string) {
    const group = await this.prisma.group.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { leads: true } } },
    });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async update(tenantId: string, id: string, dto: UpdateGroupDto) {
    await this.findOne(tenantId, id);
    return this.prisma.group.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.group.delete({ where: { id } });
  }

  async getLeads(tenantId: string, groupId: string, pagination: PaginationDto) {
    await this.findOne(tenantId, groupId);

    const where: any = { groups: { some: { groupId } } };
    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return PaginatedResponseDto.create(data, total, pagination.page!, pagination.limit!);
  }

  async addLeads(tenantId: string, groupId: string, leadIds: string[]) {
    await this.findOne(tenantId, groupId);

    // Verify all leads belong to the same tenant
    const validLeads = await this.prisma.lead.findMany({
      where: { id: { in: leadIds }, tenantId },
      select: { id: true },
    });

    const validIds = validLeads.map((l: { id: string }) => l.id);

    if (validIds.length === 0) {
      return { added: 0, skipped: leadIds.length };
    }

    // Use createMany with skipDuplicates to handle already-assigned leads
    const result = await this.prisma.leadGroup.createMany({
      data: validIds.map((leadId: string) => ({ leadId, groupId })),
      skipDuplicates: true,
    });

    return { added: result.count, skipped: leadIds.length - result.count };
  }

  async removeLeadFromGroup(tenantId: string, groupId: string, leadId: string) {
    await this.findOne(tenantId, groupId);

    await this.prisma.leadGroup.delete({
      where: { leadId_groupId: { leadId, groupId } },
    });

    return { removed: true };
  }
}
