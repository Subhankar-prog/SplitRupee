# SplitRupee

Multi-user expense splitting in ₹ (Next.js 14 App Router, Prisma/PostgreSQL, Tailwind, Lucide).

## Run it
```bash
cp .env.example .env        # set DATABASE_URL to a Postgres instance
npm install
npx prisma db push
npm run db:seed             # sample "Goa Trip" group with 4 members
npm run dev
npm test                    # 29 tests: targets A-D plus money/export
```

## Design notes
- **Money is integer paise internally.** Floats exist only at the JSON/Prisma `Float` boundary and are
  rounded on the way through (`lib/money.ts`).
- **Percentage splits** use the largest-remainder method, so allocations always sum to the bill exactly.
  Percentages must total exactly 100.00 (hundredths are compared as integers).
  Three members at a literal 33.33% total 99.99% and are rejected; use "Split equally"
  (33.34 / 33.33 / 33.33).
- **Server never trusts client amounts**: percentage rows are recomputed server-side, group membership is
  verified inside the transaction, and the stored split sum is re-read before commit.
- **Debt minimisation** (`lib/debt.ts`): net balances, exact-match pairing, then a two-heap greedy match
  (at most n-1 transfers). The true minimum is NP-hard; this is the standard heuristic.

## Not included (out of scope of the brief)
- Authentication. The dashboard has a "Viewing as" selector; the API does not identify callers. Add
  NextAuth/Clerk and check membership of the session user before exposing a group.
- Real-time sync is 8-second polling plus refetch on tab focus, not websockets.
