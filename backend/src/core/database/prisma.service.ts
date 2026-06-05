import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (PrismaClient as any)({ adapter }) as PrismaClient;
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private _client: PrismaClient;

  constructor() {
    this._client = createPrismaClient();
  }

  // Proxy all Prisma model accessors via getter
  get tenant() { return (this._client as any).tenant; }
  get user() { return (this._client as any).user; }
  get lead() { return (this._client as any).lead; }
  get group() { return (this._client as any).group; }
  get leadGroup() { return (this._client as any).leadGroup; }
  get whatsappInstance() { return (this._client as any).whatsappInstance; }
  get campaign() { return (this._client as any).campaign; }
  get campaignGroup() { return (this._client as any).campaignGroup; }
  get campaignRecipient() { return (this._client as any).campaignRecipient; }
  get auditLog() { return (this._client as any).auditLog; }

  $connect() { return this._client.$connect(); }
  $disconnect() { return this._client.$disconnect(); }
  $transaction(...args: Parameters<PrismaClient['$transaction']>) {
    return (this._client.$transaction as any)(...args);
  }
  $executeRawUnsafe(...args: Parameters<PrismaClient['$executeRawUnsafe']>) {
    return this._client.$executeRawUnsafe(...args);
  }

  async onModuleInit() {
    await this._client.$connect();
  }

  async onModuleDestroy() {
    await this._client.$disconnect();
  }

  /**
   * Execute queries within tenant context using PostgreSQL RLS.
   * Sets the session variable before executing the callback.
   */
  async withTenantContext<T>(
    tenantId: string,
    callback: (prisma: PrismaClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx: any) => {
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );
      return callback(tx as unknown as PrismaClient);
    });
  }
}
