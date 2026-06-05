import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    private _client;
    constructor();
    get tenant(): any;
    get user(): any;
    get lead(): any;
    get group(): any;
    get leadGroup(): any;
    get whatsappInstance(): any;
    get campaign(): any;
    get campaignGroup(): any;
    get campaignRecipient(): any;
    get auditLog(): any;
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $transaction(...args: Parameters<PrismaClient['$transaction']>): any;
    $executeRawUnsafe(...args: Parameters<PrismaClient['$executeRawUnsafe']>): import("@prisma/client").Prisma.PrismaPromise<number>;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    withTenantContext<T>(tenantId: string, callback: (prisma: PrismaClient) => Promise<T>): Promise<T>;
}
