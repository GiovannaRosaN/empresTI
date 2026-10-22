import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o seed do banco de dados...');

  // 1. Criar o Tenant Padrão (Suporte TI)
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'suporte-ti' },
    update: {},
    create: {
      name: 'Suporte TI',
      slug: 'suporte-ti',
    },
  });

  console.log(`✅ Tenant criado/encontrado: ${tenant.name} (${tenant.id})`);

  // 2. Criar Equipamentos de Exemplo
  const equipment1 = await prisma.equipment.upsert({
    where: { assetTag: 'NOTE-001' },
    update: {},
    create: {
      tenantId: tenant.id,
      assetTag: 'NOTE-001',
      name: 'MacBook Pro 16"',
      category: 'Notebook',
      serialNumber: 'C02XL1234567',
      location: 'Armário A1',
      conditionStatus: 'EXCELLENT',
      notes: 'Equipamento de alta performance para desenvolvimento.',
    },
  });

  const equipment2 = await prisma.equipment.upsert({
    where: { assetTag: 'PERIF-002' },
    update: {},
    create: {
      tenantId: tenant.id,
      assetTag: 'PERIF-002',
      name: 'Monitor Dell 27 4K',
      category: 'Monitor',
      serialNumber: 'CN-0987654',
      location: 'Mesa TI',
      conditionStatus: 'GOOD',
      notes: 'Sem caixa original.',
    },
  });

  console.log('✅ Equipamentos de teste inseridos.');

  // 3. Registrar Log de Auditoria Inicial
  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: 'system-seed',
      action: 'SYSTEM_SEED',
      entity: 'DATABASE',
      details: 'População inicial de dados executada com sucesso.',
    },
  });

  console.log('✅ Log de auditoria inicial registrado.');
  console.log('🚀 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });