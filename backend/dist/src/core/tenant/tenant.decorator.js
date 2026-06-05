"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantId = void 0;
const common_1 = require("@nestjs/common");
const nestjs_cls_1 = require("nestjs-cls");
exports.TenantId = (0, common_1.createParamDecorator)((_data, _ctx) => {
    const cls = nestjs_cls_1.ClsServiceManager.getClsService();
    return cls.get('tenantId');
});
//# sourceMappingURL=tenant.decorator.js.map