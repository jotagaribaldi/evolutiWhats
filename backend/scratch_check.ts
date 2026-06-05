import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new (PrismaClient as any)({ adapter }) as PrismaClient;

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
