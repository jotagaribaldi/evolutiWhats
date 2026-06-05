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
exports.LeadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../core/auth/guards/roles.guard");
const decorators_1 = require("../../../common/decorators");
const dtos_1 = require("../../../common/dtos");
const leads_service_1 = require("../application/leads.service");
const lead_dto_1 = require("../application/dto/lead.dto");
const sync_1 = require("csv-parse/sync");
let LeadsController = class LeadsController {
    leadsService;
    constructor(leadsService) {
        this.leadsService = leadsService;
    }
    create(tenantId, dto) {
        return this.leadsService.create(tenantId, dto);
    }
    findAll(tenantId, pagination, status, groupId, tag) {
        return this.leadsService.findAll(tenantId, pagination, { status, groupId, tag });
    }
    findOne(tenantId, id) {
        return this.leadsService.findOne(tenantId, id);
    }
    update(tenantId, id, dto) {
        return this.leadsService.update(tenantId, id, dto);
    }
    remove(tenantId, id) {
        return this.leadsService.remove(tenantId, id);
    }
    async importCsv(tenantId, file) {
        const content = file.buffer.toString('utf-8');
        const records = (0, sync_1.parse)(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });
        const leads = records.map((r) => ({
            name: r.name || r.nome,
            phone: r.phone || r.telefone,
            email: r.email || undefined,
            notes: r.notes || r.observacoes || undefined,
            source: r.source || r.origem || 'csv_import',
            tags: r.tags ? r.tags.split(';').map((t) => t.trim()) : [],
        }));
        return this.leadsService.importCsv(tenantId, leads);
    }
    async exportCsv(tenantId, res) {
        const result = await this.leadsService.findAll(tenantId, { page: 1, limit: 100000, get skip() { return 0; } });
        const leads = result.data;
        const header = 'name,phone,email,status,source,tags,created_at\n';
        const rows = leads.map((l) => `"${l.name}","${l.phone}","${l.email || ''}","${l.status}","${l.source || ''}","${(l.tags || []).join(';')}","${l.createdAt}"`).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
        res.send(header + rows);
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new lead' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, lead_dto_1.CreateLeadDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List leads with pagination and filters' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('groupId')),
    __param(4, (0, common_1.Query)('tag')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtos_1.PaginationDto, String, String, String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get lead by ID' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a lead' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, lead_dto_1.UpdateLeadDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a lead' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, swagger_1.ApiOperation)({ summary: 'Import leads from CSV' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Get)('export/csv'),
    (0, swagger_1.ApiOperation)({ summary: 'Export leads as CSV' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "exportCsv", null);
exports.LeadsController = LeadsController = __decorate([
    (0, swagger_1.ApiTags)('Leads'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/leads'),
    __metadata("design:paramtypes", [leads_service_1.LeadsService])
], LeadsController);
//# sourceMappingURL=leads.controller.js.map