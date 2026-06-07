import { PrismaService } from '../../core/database/prisma.service';
export declare class TenantsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<any>;
}
