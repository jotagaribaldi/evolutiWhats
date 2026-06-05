import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';
export declare class TenantMiddleware implements NestMiddleware {
    private readonly cls;
    constructor(cls: ClsService);
    use(req: Request, _res: Response, next: NextFunction): void;
}
