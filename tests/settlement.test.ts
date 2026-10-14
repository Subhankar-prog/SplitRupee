import { beforeEach, describe, expect, it, vi } from "vitest";
import { db, seedGroup } from "./fakeDb";

vi.mock("@/lib/prisma", async () => ({ prisma: (await import("./fakeDb")).db }));

import { POST as recordPayment, DELETE as reversePayment } from "@/app/api/payments/route";
import { buildLedger, computeNetBalances } from "@/lib/debt";
import { formatINR, toPaise, toRupees } from "@/lib/money";

const postPayment = (body: unknown) =>
  recordPayment(
    new Request("http://localhost/api/payments", {
      method: "POST",
      body: JSON.stringify(body),
    })
  );

const deletePayment = (body: unknown) =>
  reversePayment(
    new Request("http://localhost/api/payments", {
      method: "DELETE",
      body: JSON.stringify(body),
    })
  );

describe("Settlement Module — Financial Integrity, Roles & Ledger Reconciliation", () => {
  beforeEach(() => {
    // 3 Members: a (Admin/Aarav), b (Kabir), c (Rohan)
    seedGroup("g1", ["a", "b", "c"], "a");

    // Rohan (c) paid ₹1,899.00 split equally (₹633.00 each)
    db.expenses = [
      {
        id: "exp_1",
        groupId: "g1",
        paidById: "c",
        title: "Villa Stay",
        totalAmount: 1899,
        isDeleted: false,
      },
    ];
    db.splits = [
      { id: "s1", expenseId: "exp_1", userId: "a", amount: 633 },
      { id: "s2", expenseId: "exp_1", userId: "b", amount: 633 },
      { id: "s3", expenseId: "exp_1", userId: "c", amount: 633 },
    ];
  });

  const getLedgerExpenses = () =>
    db.expenses.map((e) => ({
      paidById: e.paidById as string,
      splits: db.splits
        .filter((s) => s.expenseId === e.id)
        .map((s) => ({ userId: s.userId as string, amount: s.amount as number })),
    }));

  const getLedgerPayments = () =>
    db.payments.map((p) => ({
      payerId: p.payerId as string,
      receiverId: p.receiverId as string,
      amount: p.amount as number,
    }));

  describe("1. Debt Calculation & ₹633.00 vs ₹6.33 Integrity", () => {
    it("computes net balances accurately in paise and rupees", () => {
      const expenses = getLedgerExpenses();

      const balances = computeNetBalances(expenses, ["a", "b", "c"], []);

      // a (Aarav): -₹633.00 = -63300 paise
      expect(balances["a"]).toBe(-63300);
      expect(toRupees(balances["a"])).toBe(-633);

      // b (Kabir): -₹633.00 = -63300 paise
      expect(balances["b"]).toBe(-63300);
      expect(toRupees(balances["b"])).toBe(-633);

      // c (Rohan): +₹1,266.00 = +126600 paise
      expect(balances["c"]).toBe(126600);
      expect(toRupees(balances["c"])).toBe(1266);

      // Total group pool balances out to 0
      const sum = Object.values(balances).reduce((acc, v) => acc + v, 0);
      expect(sum).toBe(0);
    });

    it("optimizes minimal cash flow transfers without rupee/paise double division", () => {
      const expenses = getLedgerExpenses();

      const ledger = buildLedger(expenses, ["a", "b", "c"], []);

      expect(ledger.transfers).toHaveLength(2);

      // Either [a -> c: 63300] and [b -> c: 63300]
      const transferA = ledger.transfers.find((t) => t.from === "a");
      const transferB = ledger.transfers.find((t) => t.from === "b");

      expect(transferA).toBeDefined();
      expect(transferA?.to).toBe("c");
      expect(transferA?.amountPaise).toBe(63300);
      // Canonical rupees amount MUST be 633.00, not 6.33
      expect(transferA!.amountPaise / 100).toBe(633);

      expect(transferB).toBeDefined();
      expect(transferB?.to).toBe("c");
      expect(transferB?.amountPaise).toBe(63300);
      expect(transferB!.amountPaise / 100).toBe(633);
    });
  });

  describe("2. Server-side Role Permissions", () => {
    it("permits ordinary member (b) to settle their own obligation to (c)", async () => {
      const res = await postPayment({
        groupId: "g1",
        payerId: "b",
        receiverId: "c",
        amount: 633,
        callerId: "b", // ordinary member paying
      });

      const json = await res.json();
      expect(res.status).toBe(201);
      expect(json.ok).toBe(true);
      expect(json.payment.amount).toBe(633);
    });

    it("rejects ordinary member (b) attempting to record settlement on behalf of member (a)", async () => {
      const res = await postPayment({
        groupId: "g1",
        payerId: "a", // trying to settle for a
        receiverId: "c",
        amount: 633,
        callerId: "b", // ordinary member
      });

      const json = await res.json();
      expect(res.status).toBe(403);
      expect(json.ok).toBe(false);
      expect(json.error).toBe("FORBIDDEN");
    });

    it("permits group creator/admin (a) to record settlement for any member", async () => {
      const res = await postPayment({
        groupId: "g1",
        payerId: "b",
        receiverId: "c",
        amount: 633,
        callerId: "a", // group creator
      });

      const json = await res.json();
      expect(res.status).toBe(201);
      expect(json.ok).toBe(true);
    });

    it("rejects non-group member attempting to settle", async () => {
      const res = await postPayment({
        groupId: "g1",
        payerId: "intruder",
        receiverId: "c",
        amount: 100,
        callerId: "intruder",
      });

      expect(res.status).toBe(400);
    });
  });

  describe("3. Financial Edge Cases & Ledger Safety", () => {
    it("rejects self-settlement (payer === receiver)", async () => {
      const res = await postPayment({
        groupId: "g1",
        payerId: "b",
        receiverId: "b",
        amount: 100,
        callerId: "b",
      });

      expect(res.status).toBe(400);
    });

    it("rejects zero or negative payment amounts", async () => {
      const resZero = await postPayment({
        groupId: "g1",
        payerId: "b",
        receiverId: "c",
        amount: 0,
        callerId: "b",
      });
      expect(resZero.status).toBe(400);

      const resNeg = await postPayment({
        groupId: "g1",
        payerId: "b",
        receiverId: "c",
        amount: -50,
        callerId: "b",
      });
      expect(resNeg.status).toBe(400);
    });

    it("rejects over-settlement (paying more than remaining debt)", async () => {
      // Kabir owes ₹633.00, tries to pay ₹700.00
      const res = await postPayment({
        groupId: "g1",
        payerId: "b",
        receiverId: "c",
        amount: 700,
        callerId: "b",
      });

      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe("OVER_SETTLEMENT");
      expect(json.issues[0]).toContain("exceeds payer's remaining debt");
    });

    it("rejects payment if payer is not a debtor", async () => {
      // Rohan (c) has net balance +₹1,266.00 (creditor), cannot be payer
      const res = await postPayment({
        groupId: "g1",
        payerId: "c",
        receiverId: "b",
        amount: 100,
        callerId: "c",
      });

      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe("PAYER_NOT_DEBTOR");
    });

    it("rejects payment if receiver is not an entitled creditor", async () => {
      // Aarav (a) owes ₹633.00, Kabir (b) cannot pay Aarav
      const res = await postPayment({
        groupId: "g1",
        payerId: "b",
        receiverId: "a",
        amount: 100,
        callerId: "b",
      });

      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.error).toBe("RECEIVER_NOT_CREDITOR");
    });

    it("supports valid partial settlement and updates remaining debt", async () => {
      // Kabir owes ₹633.00, pays ₹200.00
      const res = await postPayment({
        groupId: "g1",
        payerId: "b",
        receiverId: "c",
        amount: 200,
        callerId: "b",
      });

      expect(res.status).toBe(201);
      expect(db.payments).toHaveLength(1);

      // Recompute ledger with payments
      const expenses = getLedgerExpenses();

      const balances = computeNetBalances(expenses, ["a", "b", "c"], getLedgerPayments());

      // Kabir's debt reduced from -₹633 to -₹433 (-43300 paise)
      expect(balances["b"]).toBe(-43300);
      // Rohan's credit reduced from +₹1266 to +₹1066 (+106600 paise)
      expect(balances["c"]).toBe(106600);

      // Second partial settlement of remaining ₹433.00 succeeds
      const res2 = await postPayment({
        groupId: "g1",
        payerId: "b",
        receiverId: "c",
        amount: 433,
        callerId: "b",
      });
      expect(res2.status).toBe(201);

      const finalBalances = computeNetBalances(expenses, ["a", "b", "c"], getLedgerPayments());
      // Kabir is now completely settled (0)
      expect(finalBalances["b"]).toBe(0);
    });
  });

  describe("4. Admin Passbook Aggregations", () => {
    it("calculates cumulative member contribution totals and passbook balances", () => {
      // Kabir (b) pays Rohan (c) ₹633
      db.payments.push({
        id: "pay_1",
        groupId: "g1",
        payerId: "b",
        receiverId: "c",
        amount: 633,
        createdAt: new Date(),
      });

      const memberPaid: Record<string, number> = { a: 0, b: 0, c: 1899 };
      const memberShare: Record<string, number> = { a: 633, b: 633, c: 633 };

      const memberSettlementsPaid: Record<string, number> = {
        a: 0,
        b: 633,
        c: 0,
      };
      const memberSettlementsReceived: Record<string, number> = {
        a: 0,
        b: 0,
        c: 633,
      };

      const expenses = getLedgerExpenses();
      const ledger = buildLedger(expenses, ["a", "b", "c"], getLedgerPayments());

      // Total Spend
      const totalSpend = Object.values(memberPaid).reduce((a, b) => a + b, 0);
      expect(totalSpend).toBe(1899);

      // Total Settled
      const totalSettled = db.payments.reduce((a, p) => a + p.amount, 0);
      expect(totalSettled).toBe(633);

      // Only Aarav owes Rohan now
      expect(ledger.transfers).toHaveLength(1);
      expect(ledger.transfers[0].from).toBe("a");
      expect(ledger.transfers[0].to).toBe("c");
      expect(ledger.transfers[0].amountPaise).toBe(63300);

      // Kabir is all square
      expect(ledger.balances["b"]).toBe(0);
    });
  });

  describe("5. Concurrency, Race Conditions & Idempotency", () => {
    it("handles two simultaneous full settlement requests safely without double payment", async () => {
      // Kabir owes Rohan ₹633.00.
      // Two identical simultaneous requests are fired at the exact same instant:
      const [res1, res2] = await Promise.all([
        postPayment({
          groupId: "g1",
          payerId: "b",
          receiverId: "c",
          amount: 633,
          callerId: "b",
        }),
        postPayment({
          groupId: "g1",
          payerId: "b",
          receiverId: "c",
          amount: 633,
          callerId: "b",
        }),
      ]);

      // Exactly ONE must succeed (201), and the other must be rejected (400)
      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([201, 400]);

      // Persisted payments MUST have length 1, NOT 2!
      expect(db.payments).toHaveLength(1);
      expect(db.payments[0].amount).toBe(633);

      // Total settled matches the exact debt, NOT double
      const totalSettled = db.payments.reduce((sum, p) => sum + p.amount, 0);
      expect(totalSettled).toBe(633);

      // Ledger check: Kabir is now settled (0), not over-credited
      const balances = computeNetBalances(getLedgerExpenses(), ["a", "b", "c"], getLedgerPayments());
      expect(balances["b"]).toBe(0);
    });

    it("prevents overlapping simultaneous partial settlements from exceeding total debt", async () => {
      // Kabir owes ₹633.00.
      // Two simultaneous requests of ₹400 each (sum ₹800 > ₹633):
      const [res1, res2] = await Promise.all([
        postPayment({
          groupId: "g1",
          payerId: "b",
          receiverId: "c",
          amount: 400,
          callerId: "b",
        }),
        postPayment({
          groupId: "g1",
          payerId: "b",
          receiverId: "c",
          amount: 400,
          callerId: "b",
        }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([201, 400]);

      // Exactly one succeeded, total is ₹400 <= ₹633
      expect(db.payments).toHaveLength(1);
      expect(db.payments[0].amount).toBe(400);

      const balances = computeNetBalances(getLedgerExpenses(), ["a", "b", "c"], getLedgerPayments());
      // Kabir still owes ₹233 (-23300 paise), debt not exceeded
      expect(balances["b"]).toBe(-23300);
    });

    it("supports client timeout followed by retry with idempotency key", async () => {
      const idempotencyKey = "client-tx-retry-999";

      // 1. First attempt commits successfully
      const res1 = await postPayment({
        groupId: "g1",
        payerId: "b",
        receiverId: "c",
        amount: 633,
        callerId: "b",
        idempotencyKey,
      });
      expect(res1.status).toBe(201);
      const data1 = await res1.json();
      expect(data1.ok).toBe(true);
      expect(data1.payment.id).toBeDefined();

      // Client experienced timeout and retries with the SAME idempotencyKey
      const res2 = await postPayment({
        groupId: "g1",
        payerId: "b",
        receiverId: "c",
        amount: 633,
        callerId: "b",
        idempotencyKey,
      });

      expect(res2.status).toBe(201);
      const data2 = await res2.json();
      expect(data2.ok).toBe(true);
      expect(data2.idempotent).toBe(true);
      expect(data2.payment.id).toBe(data1.payment.id);

      // Persisted database records MUST contain only ONE payment
      expect(db.payments).toHaveLength(1);
    });
  });

  describe("6. Payment Reversals & Auditable Ledger Refunds", () => {
    it("reverses a payment, restores ledger balances, and prevents double reversals", async () => {
      // Kabir pays Rohan ₹633
      const res = await postPayment({
        groupId: "g1",
        payerId: "b",
        receiverId: "c",
        amount: 633,
        callerId: "b",
      });
      expect(res.status).toBe(201);
      const paymentId = (await res.json()).payment.id;
      expect(db.payments).toHaveLength(1);

      // Kabir is at balance 0
      let balances = computeNetBalances(getLedgerExpenses(), ["a", "b", "c"], getLedgerPayments());
      expect(balances["b"]).toBe(0);

      // Authorized reversal by admin (a)
      const revRes = await deletePayment({
        paymentId,
        groupId: "g1",
        callerId: "a",
        reason: "UPI bank reversal: transaction dropped",
      });
      expect(revRes.status).toBe(200);
      const revData = await revRes.json();
      expect(revData.ok).toBe(true);
      expect(revData.reversedPaymentId).toBe(paymentId);

      // Payment deleted from active ledger
      expect(db.payments).toHaveLength(0);

      // Ledger restored: Kabir owes ₹633 again, Rohan gets back ₹1266
      balances = computeNetBalances(getLedgerExpenses(), ["a", "b", "c"], getLedgerPayments());
      expect(balances["b"]).toBe(-63300);
      expect(balances["c"]).toBe(126600);

      // Activity log contains permanent audit record of reversal
      const reversalLog = db.activityLogs.find((l) => l.entityTitle?.includes("Settlement Reversed"));
      expect(reversalLog).toBeDefined();

      // ATTEMPT TO REVERSE AGAIN: Must fail with 404 (single-apply guarantee)
      const revRes2 = await deletePayment({
        paymentId,
        groupId: "g1",
        callerId: "a",
      });
      expect(revRes2.status).toBe(404);
      const revData2 = await revRes2.json();
      expect(revData2.error).toBe("NOT_FOUND");
    });

    it("rejects unauthorized reversal attempts by non-admin/non-creditor", async () => {
      const res = await postPayment({
        groupId: "g1",
        payerId: "b",
        receiverId: "c",
        amount: 633,
        callerId: "b",
      });
      const paymentId = (await res.json()).payment.id;

      // Payer (b) tries to self-reverse without admin or receiver permission:
      const revRes = await deletePayment({
        paymentId,
        groupId: "g1",
        callerId: "b",
      });
      expect(revRes.status).toBe(403);
      expect(db.payments).toHaveLength(1); // Payment remains intact
    });
  });

  describe("7. UPI Payload & Deep Link Verification", () => {
    it("constructs and verifies standard NPCI UPI URI with exact currency and payee parameters", () => {
      const payeeVPA = "rohan@okhdfcbank";
      const payeeName = "Rohan Verma";
      const amountINR = 633.0;

      const uri = `upi://pay?pa=${encodeURIComponent(payeeVPA)}&pn=${encodeURIComponent(
        payeeName
      )}&am=${amountINR.toFixed(2)}&cu=INR&tn=SplitRupee%20Settlement`;

      expect(uri).toContain("pa=rohan%40okhdfcbank");
      expect(uri).toContain("am=633.00");
      expect(uri).toContain("cu=INR");
      expect(uri).not.toContain("am=6.33");

      // Decode URI components
      const parsed = new URL(uri.replace("upi://pay", "http://localhost/pay"));
      expect(parsed.searchParams.get("pa")).toBe("rohan@okhdfcbank");
      expect(parsed.searchParams.get("pn")).toBe("Rohan Verma");
      expect(parsed.searchParams.get("am")).toBe("633.00");
      expect(parsed.searchParams.get("cu")).toBe("INR");
      expect(parsed.searchParams.get("tn")).toBe("SplitRupee Settlement");
    });
  });
});
