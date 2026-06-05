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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
function createPrismaClient() {
    const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
    return new client_1.PrismaClient({ adapter });
}
let PrismaService = class PrismaService {
    _client;
    constructor() {
        this._client = createPrismaClient();
    }
    get tenant() { return this._client.tenant; }
    get user() { return this._client.user; }
    get lead() { return this._client.lead; }
    get group() { return this._client.group; }
    get leadGroup() { return this._client.leadGroup; }
    get whatsappInstance() { return this._client.whatsappInstance; }
    get campaign() { return this._client.campaign; }
    get campaignGroup() { return this._client.campaignGroup; }
    get campaignRecipient() { return this._client.campaignRecipient; }
    get auditLog() { return this._client.auditLog; }
    $connect() { return this._client.$connect(); }
    $disconnect() { return this._client.$disconnect(); }
    $transaction(...args) {
        return this._client.$transaction(...args);
    }
    $executeRawUnsafe(...args) {
        return this._client.$executeRawUnsafe(...args);
    }
    async onModuleInit() {
        await this._client.$connect();
    }
    async onModuleDestroy() {
        await this._client.$disconnect();
    }
    async withTenantContext(tenantId, callback) {
        return this.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
            return callback(tx);
        });
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map