# Phase 6 Language & Product Copy Audit

## 1. Principles
- **Direct & Friendly**: Plain language suitable for real friends splitting expenses.
- **No Developer Jargon**: Eliminate terms like "reconciliation", "audit log", "pending sync", "API failure", and "payload".
- **Contextual Guidance**: Clear directions on what went wrong and how to fix it without displaying stack traces.

## 2. Before / After Copy Mapping

| Area / File | Original Technical Copy | Human-Centered Replacement |
| :--- | :--- | :--- |
| `app/groups/[id]/page.tsx` | Admin Passbook & Master Financial Reconciliation | Group Ledger & Balance Summary |
| `app/groups/[id]/page.tsx` | Traveler / Member Reconciliation Matrix | Member Balances & Settlements |
| `app/groups/[id]/page.tsx` | Pending Sync | Waiting to sync |
| `app/expenses/page.tsx` | Pending Sync | Waiting to sync |
| `app/offline/page.tsx` | Pending Sync | waiting to sync |
| `components/ActivityLogList.tsx` | Matching audit log events | matching updates |
| `components/ActivityLogList.tsx` | No matching audit log events | No updates match this filter |
| `components/OfflineSyncModal.tsx` | Sync Offline Expenses? | Update Saved Expenses? |
| `components/OfflineSyncModal.tsx` | Sync Now | Update Groups Now |
| `components/PwaRegister.tsx` | Offline (Pending Sync) | You're currently offline. Your changes are saved locally ({n} waiting to sync) |
| `app/groups/page.tsx` | Login Required | Please log in to continue |
| `app/itinerary/page.tsx` | Admin Privilege | Group Admins: Only group admins can link itineraries and add trip expenses |
| `lib/displayLabels.ts` | Server / Fetch error exceptions | `getFriendlyErrorMessage()`: Human guidance (e.g. "We could not connect to the network. Please check your internet connection and try again.") |
| `app/page.tsx` | Hero & marketing buzzwords | "Share expenses. Plan better trips. Stay friends." with 3-step splitting flow and standalone trip planner spotlight |

## 3. Verification
- 19 Vitest test suites (124 tests) passing.
- Friendly error helper validated with unit tests in `tests/displayLabels.test.ts`.

