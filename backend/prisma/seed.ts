import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)({ adapter }) as PrismaClient;

async function main() {
  console.log('🌱 Seeding database...');

  // Create default tenant
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

  // Create super admin
  const passwordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Admin Demo',
      email: 'admin@demo.com',
      passwordHash,
      role: UserRole.COMPANY_ADMIN,
      active: true,
    },
  });
  console.log(`✅ Admin: ${admin.email} / admin123`);

  // Create sample groups
  const groups = ['Clientes VIP', 'Empresários', 'Jovens', 'Newsletter'];
  for (const name of groups) {
    await prisma.group.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name } },
      update: {},
      create: { tenantId: tenant.id, name, description: `Grupo ${name}` },
    });
  }
  console.log(`✅ ${groups.length} groups created`);

  // Create sample leads
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
