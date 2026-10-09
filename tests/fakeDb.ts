/**
 * In-memory stand-in for the slice of Prisma the expense route uses.
 * $transaction snapshots state and restores it if the callback throws, which
 * mirrors Postgres ROLLBACK semantics, so tests can observe "no dangling rows".
 */
type Row = Record<string, any>;

export interface FakeDb {
  expenses: Row[];
  splits: Row[];
  members: Row[];
  transactionCalls: number;
  /** Insert this many split rows, then throw (simulated connection drop). */
  failAfterSplitRows: number | null;
  /** Throw a Prisma-style P2028 timeout inside the transaction. */
  timeoutInTransaction: boolean;
  reset(): void;
  [key: string]: any;
}

let seq = 0;

export const db: FakeDb = {
  expenses: [],
  splits: [],
  members: [],
  transactionCalls: 0,
  failAfterSplitRows: null,
  timeoutInTransaction: false,

  reset() {
    this.expenses = [];
    this.splits = [];
    this.members = [];
    this.transactionCalls = 0;
    this.failAfterSplitRows = null;
    this.timeoutInTransaction = false;
    seq = 0;
  },

  async $transaction(fn: (tx: any) => Promise<any>) {
    db.transactionCalls++;
    const snapshot = {
      expenses: db.expenses.map((r) => ({ ...r })),
      splits: db.splits.map((r) => ({ ...r })),
    };
    const tx = {
      groupMember: {
        findMany: async ({ where }: Row) => db.members.filter((m) => m.groupId === where.groupId),
      },
      expense: {
        create: async ({ data }: Row) => {
          const row = { id: `exp_${++seq}`, createdAt: new Date(), ...data };
          db.expenses.push(row);
          return row;
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
    };
    try {
      return await fn(tx);
    } catch (e) {
      db.expenses = snapshot.expenses;
      db.splits = snapshot.splits;
      throw e;
    }
  },

  expense: {
    findMany: async ({ where }: Row) => db.expenses.filter((e) => e.groupId === where.groupId),
  },
};

export function seedGroup(groupId = "g1", userIds = ["a", "b", "c"]) {
  db.reset();
  db.members = userIds.map((userId) => ({ groupId, userId }));
}
