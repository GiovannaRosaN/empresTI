import { describe, expect, it, vi } from 'vitest';
import equipment from '../skills/imagens-equipamentos/equipment.json' with { type: 'json' };
import {
  isLocalEndpoint,
  localSeedBlockReason,
  provisionTeacher,
  seedEquipmentAndMembership,
} from './seed.mjs';

const localEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://postgres:local@localhost:54322/postgres',
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY: 'test-local-only',
  TEACHER_SEED_PASSWORD: 'test-password-only',
};

function createInMemoryPrisma() {
  const equipmentRows = new Map();
  const membershipRows = new Map();
  const transaction = {
    equipment: {
      findUnique: vi.fn(async ({ where }) => equipmentRows.get(where.tenantId_assetTag.assetTag) ?? null),
      upsert: vi.fn(async ({ where, create, update }) => {
        const tag = where.tenantId_assetTag.assetTag;
        const existing = equipmentRows.get(tag);
        const row = { id: tag, ...(existing ? { ...existing, ...update } : create) };
        equipmentRows.set(tag, row);
        return row;
      }),
      delete: vi.fn(async ({ where }) => {
        for (const [tag, row] of equipmentRows) {
          if (row.id === where.id) equipmentRows.delete(tag);
        }
      }),
    },
    loan: { findFirst: vi.fn(async () => null) },
    membership: {
      findMany: vi.fn(async ({ where }) =>
        [...membershipRows.values()].filter((item) => item.userId === where.userId)),
      upsert: vi.fn(async ({ where, create, update }) => {
        const key = `${where.userId_tenantId.userId}:${where.userId_tenantId.tenantId}`;
        const row = { id: 'membership-1', ...(membershipRows.get(key) ?? create), ...update };
        membershipRows.set(key, row);
        return row;
      }),
    },
  };
  return {
    transaction,
    state: { equipmentRows, membershipRows },
    prisma: { $transaction: (callback) => callback(transaction) },
  };
}

describe('seed local de dados iniciais', () => {
  it('[DADOS-CA-01] usa exatamente 12 equipamentos com as categorias aprovadas', () => {
    expect(equipment).toHaveLength(12);
    expect(equipment.filter((item) => item.category === 'notebook')).toHaveLength(4);
    expect(equipment.filter((item) => item.category === 'monitor')).toHaveLength(3);
    expect(equipment.filter((item) => item.category === 'cabo')).toHaveLength(3);
    expect(equipment.filter((item) => item.category === 'camera')).toHaveLength(2);
  });

  it('[DADOS-CA-02] mantém TI-0004 e TI-0007 em manutenção e os outros disponíveis', () => {
    const maintenance = equipment.filter((item) => item.conditionStatus === 'MAINTENANCE').map((item) => item.assetTag);
    expect(maintenance.sort()).toEqual(['TI-0004', 'TI-0007']);
  });

  it('[DADOS-CA-03] cria os equipamentos e membership idempotentemente', async () => {
    const { prisma, transaction, state } = createInMemoryPrisma();
    await seedEquipmentAndMembership(prisma, 'tenant-1', 'user-1');
    await seedEquipmentAndMembership(prisma, 'tenant-1', 'user-1');
    expect(state.equipmentRows.size).toBe(12);
    expect(state.membershipRows.size).toBe(1);
    expect(transaction.equipment.upsert).toHaveBeenCalledTimes(24);
    expect(transaction.membership.upsert).toHaveBeenCalledTimes(2);
  });

  it('[DADOS-CA-04] localiza o usuário existente por e-mail e atualiza senha sem registrar valor', async () => {
    const updateUserById = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    const admin = {
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: { users: [{ id: 'user-1', email: 'MARCELO.GRILO@INSTITUTOJEF.ORG.BR' }] },
            error: null,
          }),
          updateUserById,
        },
      },
    };
    await expect(provisionTeacher(admin, localEnv)).resolves.toBe('user-1');
    expect(updateUserById).toHaveBeenCalledWith('user-1', {
      password: localEnv.TEACHER_SEED_PASSWORD,
      email_confirm: true,
    });
  });

  it('[DADOS-CA-05] bloqueia qualquer host de banco ou Supabase que não seja local', () => {
    expect(isLocalEndpoint('http://localhost:54321')).toBe(true);
    expect(isLocalEndpoint('postgresql://postgres:pw@127.0.0.1:54322/postgres')).toBe(true);
    expect(isLocalEndpoint('https://project.supabase.co')).toBe(false);
    expect(localSeedBlockReason({
      ...localEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
    })).toMatch(/Supabase local/);
    expect(localSeedBlockReason(localEnv)).toBeNull();
  });

  it('[DADOS-CA-06] não cria empréstimos para a conta do professor', async () => {
    const { prisma, transaction } = createInMemoryPrisma();
    await seedEquipmentAndMembership(prisma, 'tenant-1', 'user-1');
    expect(transaction.loan.findFirst).toHaveBeenCalledWith({
      where: { borrowerId: 'user-1', returnedAt: null },
      select: { id: true },
    });
  });
});
