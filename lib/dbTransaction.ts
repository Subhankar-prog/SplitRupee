import { prisma } from "@/lib/prisma";

export type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export function isTransactionNotFoundError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  const msg = typeof e?.message === "string" ? e.message : "";
  return (
    msg.includes("Transaction not found") ||
    (msg.includes("Transaction API error") && !msg.includes("already closed")) ||
    (e?.code === "P2028" && msg.includes("before disconnecting"))
  );
}

/**
 * Runs an interactive Prisma transaction with safe timeout defaults and a single retry
 * when Prisma encounters a stale/disconnected transaction ("Transaction not found").
 */
export async function runResilientTransaction<T>(
  fn: (tx: TxClient) => Promise<T>,
  options: { maxWait?: number; timeout?: number } = { maxWait: 15_000, timeout: 30_000 }
): Promise<T> {
  const txOpts = {
    maxWait: options.maxWait ?? 15_000,
    timeout: options.timeout ?? 30_000,
  };

  try {
    return await prisma.$transaction(fn, txOpts);
  } catch (err) {
    if (isTransactionNotFoundError(err)) {
      console.warn("[runResilientTransaction] Stale or disconnected transaction detected, retrying once...");
      await new Promise((resolve) => setTimeout(resolve, 120));
      return await prisma.$transaction(fn, txOpts);
    }
    throw err;
  }
}

