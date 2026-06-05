import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ClsServiceManager } from 'nestjs-cls';

/**
 * Extracts the current tenant ID from the CLS context.
 * Usage: @TenantId() tenantId: string
 */
export const TenantId = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string => {
    const cls = ClsServiceManager.getClsService();
    return cls.get('tenantId');
  },
);
