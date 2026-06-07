"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const bullmq_1 = require("@nestjs/bullmq");
const nestjs_cls_1 = require("nestjs-cls");
const env_validation_1 = require("./core/config/env.validation");
const database_1 = require("./core/database");
const auth_module_1 = require("./core/auth/auth.module");
const tenant_1 = require("./core/tenant");
const leads_module_1 = require("./modules/leads/leads.module");
const groups_module_1 = require("./modules/groups/groups.module");
const users_module_1 = require("./modules/users/users.module");
const campaigns_module_1 = require("./modules/campaigns/campaigns.module");
const whatsapp_module_1 = require("./modules/whatsapp/whatsapp.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const tenants_module_1 = require("./modules/tenants/tenants.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(tenant_1.TenantMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validate: env_validation_1.validate,
            }),
            nestjs_cls_1.ClsModule.forRoot({
                global: true,
                middleware: { mount: true },
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ([{
                        ttl: config.get('THROTTLE_TTL', 60000),
                        limit: config.get('THROTTLE_LIMIT', 100),
                    }]),
            }),
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    connection: {
                        host: config.get('REDIS_HOST'),
                        port: config.get('REDIS_PORT'),
                    },
                }),
            }),
            database_1.DatabaseModule,
            auth_module_1.AuthModule,
            leads_module_1.LeadsModule,
            groups_module_1.GroupsModule,
            users_module_1.UsersModule,
            campaigns_module_1.CampaignsModule,
            whatsapp_module_1.WhatsappModule,
            dashboard_module_1.DashboardModule,
            tenants_module_1.TenantsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map