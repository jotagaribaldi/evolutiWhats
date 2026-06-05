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
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.join(__dirname, '.env') });
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const campaigns = await prisma.campaign.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
    });
    console.log('--- LATEST CAMPAIGNS ---');
    for (const c of campaigns) {
        console.log(`Campaign: ${c.name} (${c.id})`);
        console.log(`Status: ${c.status}`);
        console.log(`Total Recipients: ${c.totalRecipients}`);
        console.log(`Sent: ${c.sentCount}, Failed: ${c.failedCount}`);
        console.log(`Instance ID: ${c.instanceId}`);
        console.log('----------------');
    }
    const recipients = await prisma.campaignRecipient.findMany({
        orderBy: { id: 'desc' },
        take: 5,
        include: {
            lead: true,
            campaign: true,
        }
    });
    console.log('--- RECIPIENTS ---');
    for (const r of recipients) {
        console.log(`Recipient ID: ${r.id}`);
        console.log(`Campaign Name: ${r.campaign.name} (${r.campaign.id})`);
        console.log(`Lead Name: ${r.lead.name}, Phone: ${r.lead.phone}`);
        console.log(`Status: ${r.status}`);
        console.log(`Error Message: ${r.errorMessage}`);
        console.log('----------------');
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=scratch_check.js.map