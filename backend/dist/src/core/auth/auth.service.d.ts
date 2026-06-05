import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
export interface JwtPayload {
    sub: string;
    tenantId: string;
    role: string;
    email: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    login(email: string, password: string): Promise<{
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
            tenantId: any;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refreshTokens(refreshToken: string): Promise<{
        user: {
            id: any;
            name: any;
            email: any;
            role: any;
            tenantId: any;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    private generateTokens;
}
