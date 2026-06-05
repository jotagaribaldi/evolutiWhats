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
exports.GroupsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../core/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../../core/auth/guards/roles.guard");
const decorators_1 = require("../../../common/decorators");
const dtos_1 = require("../../../common/dtos");
const groups_service_1 = require("../application/groups.service");
const group_dto_1 = require("../application/dto/group.dto");
let GroupsController = class GroupsController {
    groupsService;
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    create(tenantId, dto) {
        return this.groupsService.create(tenantId, dto);
    }
    findAll(tenantId, pagination) {
        return this.groupsService.findAll(tenantId, pagination);
    }
    findOne(tenantId, id) {
        return this.groupsService.findOne(tenantId, id);
    }
    update(tenantId, id, dto) {
        return this.groupsService.update(tenantId, id, dto);
    }
    remove(tenantId, id) {
        return this.groupsService.remove(tenantId, id);
    }
    getLeads(tenantId, id, pagination) {
        return this.groupsService.getLeads(tenantId, id, pagination);
    }
    addLeads(tenantId, id, body) {
        return this.groupsService.addLeads(tenantId, id, body.leadIds);
    }
    removeLeadFromGroup(tenantId, id, leadId) {
        return this.groupsService.removeLeadFromGroup(tenantId, id, leadId);
    }
};
exports.GroupsController = GroupsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new group' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, group_dto_1.CreateGroupDto]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List groups with lead count' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtos_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get group by ID' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a group' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, group_dto_1.UpdateGroupDto]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a group' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/leads'),
    (0, swagger_1.ApiOperation)({ summary: 'List leads in a group' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dtos_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "getLeads", null);
__decorate([
    (0, common_1.Post)(':id/leads'),
    (0, swagger_1.ApiOperation)({ summary: 'Add leads to a group in batch' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "addLeads", null);
__decorate([
    (0, common_1.Delete)(':id/leads/:leadId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a lead from a group' }),
    __param(0, (0, decorators_1.CurrentUser)('tenantId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('leadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "removeLeadFromGroup", null);
exports.GroupsController = GroupsController = __decorate([
    (0, swagger_1.ApiTags)('Groups'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/groups'),
    __metadata("design:paramtypes", [groups_service_1.GroupsService])
], GroupsController);
//# sourceMappingURL=groups.controller.js.map