import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    // tenantId is extracted from the JWT payload by the JwtStrategy
    // and stored in req.user by Passport
    const user = req.user as { tenantId?: string } | undefined;
    if (user?.tenantId) {
      this.cls.set('tenantId', user.tenantId);
    }
    next();
  }
}
