import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
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
    refresh(dto: RefreshTokenDto): Promise<{
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
    logout(req: import('express').Request): Promise<void>;
}
