/**
 * In-memory stand-in for the slice of Prisma the expense and settlement routes use.
 * $transaction snapshots state and restores it if the callback throws, which
 * mirrors Postgres ROLLBACK semantics, so tests can observe "no dangling rows".
 */
type Row = Record<string, any>;

export interface FakeDb {
  groups: Row[];
  expenses: Row[];
  splits: Row[];
  members: Row[];
  payments: Row[];
  activityLogs: Row[];
  transactionCalls: number;
  failAfterSplitRows: number | null;
  timeoutInTransaction: boolean;
  reset(): void;
  [key: string]: any;
}

let seq = 0;
let txQueue: Promise<any> = Promise.resolve();

export const db: FakeDb = {
  groups: [],
  expenses: [],
  splits: [],
  members: [],
  payments: [],
  activityLogs: [],
  transactionCalls: 0,
  failAfterSplitRows: null,
  timeoutInTransaction: false,

  reset() {
    this.groups = [];
    this.expenses = [];
    this.splits = [];
    this.members = [];
    this.payments = [];
    this.activityLogs = [];
    this.transactionCalls = 0;
    this.failAfterSplitRows = null;
    this.timeoutInTransaction = false;
    seq = 0;
    txQueue = Promise.resolve();
  },

  async $transaction(fn: (tx: any) => Promise<any>) {
    db.transactionCalls++;
    const run = async () => {
      const snapshot = {
        expenses: db.expenses.map((r) => ({ ...r })),
        splits: db.splits.map((r) => ({ ...r })),
        payments: db.payments.map((r) => ({ ...r })),
        activityLogs: db.activityLogs.map((r) => ({ ...r })),
      };
      const tx = {
        groupMember: {
          findMany: async ({ where }: Row) => db.members.filter((m) => m.groupId === where.groupId),
        },
        expense: {
          create: async ({ data }: Row) => {
            const row = { id: `exp_${++seq}`, createdAt: new Date(), isDeleted: false, ...data };
            db.expenses.push(row);
            return row;
          },
          findMany: async ({ where }: Row) => {
            let filtered = db.expenses;
            if (where?.groupId) filtered = filtered.filter((e) => e.groupId === where.groupId);
            if (where?.isDeleted !== undefined) filtered = filtered.filter((e) => e.isDeleted === where.isDeleted);
            return filtered.map((e) => ({
              ...e,
              splits: db.splits.filter((s) => s.expenseId === e.id),
            }));
          },
        },
        expenseSplit: {
          createMany: async ({ data }: Row) => {
            let inserted = 0;
            for (const d of data) {
              if (db.failAfterSplitRows !== null && inserted >= db.failAfterSplitRows) {
                throw new Error("ECONNRESET: connection dropped mid-insert");
              }
              db.splits.push({ id: `spl_${++seq}`, ...d });
              inserted++;
            }
            if (db.timeoutInTransaction) {
              throw Object.assign(new Error("Transaction already closed: timeout"), { code: "P2028" });
            }
            return { count: inserted };
          },
          aggregate: async ({ where }: Row) => ({
            _sum: {
              amount: db.splits.filter((s) => s.expenseId === where.expenseId).reduce((a, s) => a + s.amount, 0),
            },
          }),
        },
        payment: {
          create: async ({ data }: Row) => {
            const row = {
              id: `pay_${++seq}`,
              createdAt: new Date(),
              ...data,
              payer: { id: data.payerId, name: `User ${data.payerId}`, avatarColor: "#10b981" },
              receiver: { id: data.receiverId, name: `User ${data.receiverId}`, avatarColor: "#0ea5e9" },
              group: { id: data.groupId, name: "Test Group" },
            };
            db.payments.push(row);
            return row;
          },
          findMany: async ({ where }: Row) => {
            let filtered = db.payments;
            if (where?.groupId) filtered = filtered.filter((p) => p.groupId === where.groupId);
            return filtered;
          },
          findFirst: async ({ where }: Row) => {
            let filtered = db.payments;
            if (where?.groupId) filtered = filtered.filter((p) => p.groupId === where.groupId);
            if (where?.notes?.contains) {
              filtered = filtered.filter((p) => p.notes && p.notes.includes(where.notes.contains));
            }
            const row = filtered[0] || null;
            if (row && !row.payer) {
              row.payer = { id: row.payerId, name: `User ${row.payerId}`, avatarColor: "#10b981" };
              row.receiver = { id: row.receiverId, name: `User ${row.receiverId}`, avatarColor: "#0ea5e9" };
              row.group = { id: row.groupId, name: "Test Group" };
            }
            return row;
          },
          findUnique: async ({ where }: Row) => {
            const p = db.payments.find((x) => x.id === where.id);
            if (!p) return null;
            const g = db.groups.find((x) => x.id === p.groupId);
            return {
              ...p,
              payer: { id: p.payerId, name: `User ${p.payerId}`, avatarColor: "#10b981" },
              receiver: { id: p.receiverId, name: `User ${p.receiverId}`, avatarColor: "#0ea5e9" },
              group: g
                ? {
                    ...g,
                    members: db.members.filter((m) => m.groupId === g.id),
                    activityLogs: db.activityLogs.filter((a) => a.groupId === g.id),
                  }
                : null,
            };
          },
          delete: async ({ where }: Row) => {
            const idx = db.payments.findIndex((p) => p.id === where.id);
            if (idx === -1) throw new Error("Record to delete does not exist.");
            const [removed] = db.payments.splice(idx, 1);
            return removed;
          },
        },
        activityLog: {
          create: async ({ data }: Row) => {
            const row = { id: `act_${++seq}`, createdAt: new Date(), ...data };
            db.activityLogs.push(row);
            return row;
          },
        },
        group: {
          update: async ({ where, data }: Row) => {
            const g = db.groups.find((x) => x.id === where.id);
            if (g) Object.assign(g, data);
            return g || { id: where.id, ...data };
          },
          findUnique: async ({ where }: Row) => {
            const g = db.groups.find((x) => x.id === where.id);
            if (!g) return null;
            return {
              ...g,
              members: db.members.filter((m) => m.groupId === g.id),
              activityLogs: db.activityLogs.filter((a) => a.groupId === g.id),
            };
          },
        },
      };
      try {
        return await fn(tx);
      } catch (e) {
        db.expenses = snapshot.expenses;
        db.splits = snapshot.splits;
        db.payments = snapshot.payments;
        db.activityLogs = snapshot.activityLogs;
        throw e;
      }
    };

    // Serialize transactions sequentially to simulate row-level locking
    const execution = txQueue.then(run, run);
    txQueue = execution.catch(() => {});
    return execution;
  },

  group: {
    findUnique: async ({ where }: Row) => {
      const g = db.groups.find((x) => x.id === where.id);
      if (!g) return null;
      return {
        ...g,
        members: db.members.filter((m) => m.groupId === g.id),
        activityLogs: db.activityLogs.filter((a) => a.groupId === g.id),
      };
    },
  },

  expense: {
    findMany: async ({ where }: Row) => {
      let filtered = db.expenses;
      if (where?.groupId) filtered = filtered.filter((e) => e.groupId === where.groupId);
      if (where?.isDeleted !== undefined) filtered = filtered.filter((e) => e.isDeleted === where.isDeleted);
      return filtered.map((e) => ({
        ...e,
        splits: db.splits.filter((s) => s.expenseId === e.id),
      }));
    },
  },

  payment: {
    findMany: async ({ where }: Row) => {
      let filtered = db.payments;
      if (where?.groupId) filtered = filtered.filter((p) => p.groupId === where.groupId);
      return filtered;
    },
    findUnique: async ({ where }: Row) => {
      const p = db.payments.find((x) => x.id === where.id);
      if (!p) return null;
      const g = db.groups.find((x) => x.id === p.groupId);
      return {
        ...p,
        payer: { id: p.payerId, name: `User ${p.payerId}`, avatarColor: "#10b981" },
        receiver: { id: p.receiverId, name: `User ${p.receiverId}`, avatarColor: "#0ea5e9" },
        group: g
          ? {
              ...g,
              members: db.members.filter((m) => m.groupId === g.id),
              activityLogs: db.activityLogs.filter((a) => a.groupId === g.id),
            }
          : null,
      };
    },
  },
};

export function seedGroup(groupId = "g1", userIds = ["a", "b", "c"], creatorId = "a") {
  db.reset();
  db.groups = [
    {
      id: groupId,
      name: "Goa Beach Trip",
      type: "TRIP",
      currency: "INR",
      creatorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  db.members = userIds.map((userId, idx) => ({
    groupId,
    userId,
    joinedAt: new Date(Date.now() + idx * 1000),
  }));
  db.activityLogs = [
    {
      id: "act_init",
      groupId,
      userId: creatorId,
      action: "GROUP_CREATED",
      entityTitle: "Goa Beach Trip",
      createdAt: new Date(),
    },
  ];
}
