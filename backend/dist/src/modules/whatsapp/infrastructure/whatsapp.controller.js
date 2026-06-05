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
    sync(tenantId) {
        return this.whatsappService.syncFromEvolution(tenantId);
    }
    create(tenantId, name, dailyLimit) {
        return this.whatsappService.createInstance(tenantId, name, dailyLimit);
    }
    findAll(tenantId) {
        return this.whatsappService.findAll(tenantId);
    }
    getQrCode(tenantId, id) {
        return this.whatsappService.getQrCode(tenantId, id);
    }
    getStatus(tenantId, id) {
        return this.whatsappService.getStatus(tenantId, id);
    }
    disconnect(tenantId, id) {
        return this.whatsappService.disconnect(tenantId, id);
    }
    remove(tenantId, id) {
        return this.whatsappService.remove(tenantId, id);
    }
};
exports.WhatsappController = WhatsappController;
__decorate([
    (0, common_1.Post)('sync'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'COMPANY_ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Sync instances from Evolution API',
        description: 'Fetches all instances from the Evolution API and upserts them into the local database. ' +
            'Creates new records, updates existing ones, and marks orphaned instances as DISCONNECTED.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Sync completed',
        schema: {
            example: { synced: 3, created: 2, updated: 1, disconnected: 0 },
        },
    }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "sync", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'COMPANY_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new WhatsApp instance in Evolution API' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Body)('instanceName')),
    __param(2, (0, common_1.Body)('dailyLimit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all WhatsApp instances' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/qr'),
    (0, swagger_1.ApiOperation)({ summary: 'Get QR code for connection' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "getQrCode", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get instance connection status (live check against Evolution API)' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Delete)(':id/disconnect'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'COMPANY_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and disconnect instance from Evolution API' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN', 'COMPANY_ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete instance from both Evolution API and local database' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
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