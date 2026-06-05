"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcrypt"));
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Seeding database...');
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'demo-company' },
        update: {},
        create: {
            name: 'Demo Company',
            slug: 'demo-company',
            plan: 'pro',
            active: true,
        },
    });
    console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);
    const passwordHash = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'Admin Demo',
            email: 'admin@demo.com',
            passwordHash,
            role: client_1.UserRole.COMPANY_ADMIN,
            active: true,
        },
    });
    console.log(`✅ Admin: ${admin.email} / admin123`);
    const groups = ['Clientes VIP', 'Empresários', 'Jovens', 'Newsletter'];
    for (const name of groups) {
        await prisma.group.upsert({
            where: { tenantId_name: { tenantId: tenant.id, name } },
            update: {},
            create: { tenantId: tenant.id, name, description: `Grupo ${name}` },
        });
    }
    console.log(`✅ ${groups.length} groups created`);
    const leads = [
        { name: 'João Silva', phone: '5511999990001', email: 'joao@email.com', source: 'website' },
        { name: 'Maria Santos', phone: '5511999990002', email: 'maria@email.com', source: 'referral' },
        { name: 'Pedro Costa', phone: '5511999990003', email: 'pedro@email.com', source: 'ads' },
        { name: 'Ana Oliveira', phone: '5511999990004', email: 'ana@email.com', source: 'website' },
        { name: 'Carlos Ferreira', phone: '5511999990005', email: 'carlos@email.com', source: 'organic' },
    ];
    for (const lead of leads) {
        await prisma.lead.upsert({
            where: { tenantId_phone: { tenantId: tenant.id, phone: lead.phone } },
            update: {},
            create: { ...lead, tenantId: tenant.id, tags: ['demo'] },
        });
    }
    console.log(`✅ ${leads.length} leads created`);
    console.log('🎉 Seed completed!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map