import crypto from "node:crypto";

export const DUPLICATE_WINDOW_MS = 30_000;
export const RATE_WINDOW_MS = 5 * 60_000;
export const MAX_PER_IP_IN_WINDOW = 8;

const recentSignatures = new Map<string, number>();
const ipHits = new Map<string, number[]>();

export function pruneContactRateStores(now: number) {
  for (const [sig, ts] of recentSignatures.entries()) {
    if (now - ts > DUPLICATE_WINDOW_MS) {
      recentSignatures.delete(sig);
    }
  }
  for (const [ip, hits] of ipHits.entries()) {
    const active = hits.filter((ts) => now - ts <= RATE_WINDOW_MS);
    if (active.length === 0) {
      ipHits.delete(ip);
    } else {
      ipHits.set(ip, active);
    }
  }
}

export function buildSubmissionSignature(email: string, topicKey: string, message: string): string {
  return crypto
    .createHash("sha256")
    .update(`${email.toLowerCase()}|${topicKey}|${message}`)
    .digest("hex");
}

export function checkContactRateAndDuplicate(params: {
  clientIp: string;
  signature: string;
  now: number;
}): "ok" | "rate_limited" | "duplicate" {
  pruneContactRateStores(params.now);

  const hits = ipHits.get(params.clientIp) || [];
  if (hits.length >= MAX_PER_IP_IN_WINDOW) {
    return "rate_limited";
  }

  const previousTs = recentSignatures.get(params.signature);
  if (previousTs && params.now - previousTs < DUPLICATE_WINDOW_MS) {
    return "duplicate";
  }

  return "ok";
}

export function recordContactSubmission(params: {
  clientIp: string;
  signature: string;
  now: number;
}) {
  recentSignatures.set(params.signature, params.now);
  const hits = ipHits.get(params.clientIp) || [];
  ipHits.set(params.clientIp, [...hits, params.now]);
}

export function resetContactRateLimiterForTests() {
  recentSignatures.clear();
  ipHits.clear();
}

