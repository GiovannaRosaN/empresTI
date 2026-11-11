import { createClient } from '@supabase/supabase-js';
import { PrismaPg } from '@prisma/adapter-pg';
import { pathToFileURL } from 'node:url';
import equipment from '../skills/imagens-equipamentos/equipment.json' with { type: 'json' };

const teacherEmail = 'marcelo.grilo@institutojef.org.br';
const tenantSlug = 'suporte_ti';
const localHosts = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const legacySeedTags = ['NOTE-001', 'PERIF-002'];

export function isLocalEndpoint(value) {
  try {
    const url = new URL(value);
    return localHosts.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function localSeedBlockReason(env = process.env) {
  if (env.NODE_ENV === 'production') {
    return 'O seed não pode ser executado com NODE_ENV=production.';
  }
  if (
    !env.DATABASE_URL ||
    !isLocalEndpoint(env.DATABASE_URL) ||
    !['postgres:', 'postgresql:'].includes(new URL(env.DATABASE_URL).protocol)
  ) {
    return 'DATABASE_URL precisa apontar para um banco local.';
  }
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  if (
    !supabaseUrl ||
    !isLocalEndpoint(supabaseUrl) ||
    !['http:', 'https:'].includes(new URL(supabaseUrl).protocol) ||
    new URL(supabaseUrl).username ||
    new URL(supabaseUrl).password
  ) {
    return 'NEXT_PUBLIC_SUPABASE_URL precisa apontar para Supabase local.';
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return 'SUPABASE_SERVICE_ROLE_KEY precisa estar configurada no ambiente local.';
  }
  if (!env.TEACHER_SEED_PASSWORD) {
    return 'TEACHER_SEED_PASSWORD precisa estar configurada no ambiente local.';
  }
  return null;
}

async function findAuthUserByEmail(admin, email) {
  const matches = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      throw new Error(`Não foi possível consultar usuários do Supabase local: ${error.message}`);
    }
    matches.push(...data.users.filter((user) => user.email?.toLowerCase() === email.toLowerCase()));
    if (data.users.length < 1000) {
      break;
    }
  }
  if (matches.length > 1) {
    throw new Error('Há identidades duplicadas para a conta do professor no Supabase local.');
  }
  return matches[0];
}

export async function provisionTeacher(admin, env) {
  const existingUser = await findAuthUserByEmail(admin, teacherEmail);
  if (existingUser) {
    const { data, error } = await admin.auth.admin.updateUserById(existingUser.id, {
      password: env.TEACHER_SEED_PASSWORD,
      email_confirm: true,
    });
    if (error) {
      throw new Error(`Não foi possível atualizar a conta local do professor: ${error.message}`);
    }
    return data.user.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: teacherEmail,
    password: env.TEACHER_SEED_PASSWORD,
    email_confirm: true,
  });
  if (error) {
    throw new Error(`Não foi possível criar a conta local do professor: ${error.message}`);
  }
  return data.user.id;
}

async function removeLegacySeedEquipment(transaction, tenantId) {
  for (const assetTag of legacySeedTags) {
    const existing = await transaction.equipment.findUnique({
      where: { tenantId_assetTag: { tenantId, assetTag } },
      select: { id: true },
    });
    if (!existing) {
      continue;
    }

    const activeLoan = await transaction.loan.findFirst({
      where: { equipmentId: existing.id, returnedAt: null },
      select: { id: true },
    });
    if (activeLoan) {
      throw new Error(`Equipamento legado ${assetTag} possui empréstimo aberto; seed interrompido sem alterá-lo.`);
    }

    await transaction.equipment.delete({ where: { id: existing.id } });
  }
}

export async function seedEquipmentAndMembership(prisma, tenantId, userId) {
  return prisma.$transaction(async (transaction) => {
    await removeLegacySeedEquipment(transaction, tenantId);

    for (const item of equipment) {
      await transaction.equipment.upsert({
        where: { tenantId_assetTag: { tenantId, assetTag: item.assetTag } },
        update: {
          name: item.name,
          category: item.category,
          conditionStatus: item.conditionStatus,
          serialNumber: null,
          location: 'Armário de TI',
          notes: null,
        },
        create: {
          tenantId,
          assetTag: item.assetTag,
          name: item.name,
          category: item.category,
          conditionStatus: item.conditionStatus,
          location: 'Armário de TI',
        },
      });
    }

    const memberships = await transaction.membership.findMany({
      where: { userId },
      select: { id: true, tenantId: true },
    });
    if (memberships.some((membership) => membership.tenantId !== tenantId) || memberships.length > 1) {
      throw new Error('A conta do professor já possui membership incompatível; seed interrompido.');
    }

    const openTeacherLoan = await transaction.loan.findFirst({
      where: { borrowerId: userId, returnedAt: null },
      select: { id: true },
    });
    if (openTeacherLoan) {
      throw new Error('A conta do professor possui empréstimos abertos; seed não altera empréstimos.');
    }

    await transaction.membership.upsert({
      where: { userId_tenantId: { userId, tenantId } },
      update: { role: 'COLLABORATOR' },
      create: { userId, tenantId, role: 'COLLABORATOR' },
    });
  });
}

export async function runSeed({ env = process.env, prisma, admin, logger = console } = {}) {
  const blockReason = localSeedBlockReason(env);
  if (blockReason) {
    throw new Error(blockReason);
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const supabase = admin ?? createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userId = await provisionTeacher(supabase, env);
  const tenant = await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: { name: 'Suporte TI' },
    create: { name: 'Suporte TI', slug: tenantSlug },
    select: { id: true },
  });
  await seedEquipmentAndMembership(prisma, tenant.id, userId);
  logger.info('Seed local concluído: 12 equipamentos e membership do professor atualizados.');
}

async function main() {
  const blockReason = localSeedBlockReason();
  if (blockReason) {
    console.error(`Seed não executado: ${blockReason}`);
    process.exitCode = 1;
    return;
  }

  const { PrismaClient } = await import('@prisma/client');
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  try {
    await runSeed({ prisma });
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : 'erro desconhecido';
    console.error(`Falha no seed local: ${message}`);
    process.exitCode = 1;
  });
}
