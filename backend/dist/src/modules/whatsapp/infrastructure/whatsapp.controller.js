"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../core/auth/guards/roles.guard");
const roles_decorator_1 = require("../../../common/decorators/roles.decorator");
const decorators_1 = require("../../../common/decorators");
const whatsapp_service_1 = require("../application/whatsapp.service");
let WhatsappController = class WhatsappController {
    whatsappService;
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
    }
    sync(tenantId, role) {
        return this.whatsappService.syncFromEvolution(tenantId, role);
    }
    create(tenantId, role, name, dailyLimit) {
        return this.whatsappService.createInstance(tenantId, role, name, dailyLimit);
    }
    findAll(tenantId, role) {
        return this.whatsappService.findAll(tenantId, role);
    }
    getQrCode(tenantId, role, id) {
        return this.whatsappService.getQrCode(tenantId, role, id);
    }
    getStatus(tenantId, role, id) {
        return this.whatsappService.getStatus(tenantId, role, id);
    }
    assignTenant(role, id, tenantId) {
        return this.whatsappService.assignTenant(role, id, tenantId ?? null);
    }
    disconnect(tenantId, role, id) {
        return this.whatsappService.disconnect(tenantId, role, id);
    }
    remove(tenantId, role, id) {
        return this.whatsappService.remove(tenantId, role, id);
    }
};
exports.WhatsappController = WhatsappController;
__decorate([
    (0, common_1.Post)('sync'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'COMPANY_ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Sync instances from Evolution API',
        description: 'SUPER_ADMIN: syncs all instances globally (new ones get tenantId=null). ' +
            'COMPANY_ADMIN: syncs only instances linked to their tenant.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sync completed',
        schema: { example: { synced: 3, created: 2, updated: 1, disconnected: 0 } },
    }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "sync", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'COMPANY_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new WhatsApp instance in Evolution API' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, common_1.Body)('instanceName')),
    __param(3, (0, common_1.Body)('dailyLimit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List WhatsApp instances',
        description: 'SUPER_ADMIN: returns all instances with tenant info. Others: only their tenant instances.',
    }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/qr'),
    (0, swagger_1.ApiOperation)({ summary: 'Get QR code for connection' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "getQrCode", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get instance connection status (live check against Evolution API)' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    (0, swagger_1.ApiOperation)({
        summary: 'Assign or unassign a tenant to a WhatsApp instance (SUPER_ADMIN only)',
        description: 'Set tenantId to link the instance to a company. Set null to unlink.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                tenantId: { type: 'string', nullable: true, description: 'UUID of the tenant, or null to unassign' },
            },
        },
    }),
    __param(0, (0, decorators_1.CurrentUser)('role')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "assignTenant", null);
__decorate([
    (0, common_1.Delete)(':id/disconnect'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'COMPANY_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and disconnect instance from Evolution API' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'COMPANY_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete instance from both Evolution API and local database' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "remove", null);
exports.WhatsappController = WhatsappController = __decorate([
    (0, swagger_1.ApiTags)('WhatsApp'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/whatsapp/instances'),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsappService])
], WhatsappController);
//# sourceMappingURL=whatsapp.controller.js.map