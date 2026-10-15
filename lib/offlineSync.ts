// SplitRupee Offline Synchronization Engine
export interface OfflineExpenseItem {
  id: string; // client temporary ID
  isEdit: boolean;
  expenseId?: string;
  groupId: string;
  groupName?: string;
  title: string;
  totalAmount: number;
  payload: any;
  createdAt: number;
}

const STORAGE_KEY = "splitrupee_offline_expenses_queue";

export function getOfflineQueue(): OfflineExpenseItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    return Array.isArray(items) ? items : [];
  } catch (e) {
    console.error("Failed to read offline expense queue", e);
    return [];
  }
}

export function addOfflineExpense(
  data: Omit<OfflineExpenseItem, "id" | "createdAt">
): OfflineExpenseItem {
  const queue = getOfflineQueue();
  const newItem: OfflineExpenseItem = {
    ...data,
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
  };

  // If editing an item already in the queue, replace it
  if (data.isEdit && data.expenseId) {
    const existingIndex = queue.findIndex(
      (item) => item.isEdit && item.expenseId === data.expenseId
    );
    if (existingIndex >= 0) {
      queue[existingIndex] = newItem;
    } else {
      queue.push(newItem);
    }
  } else {
    queue.push(newItem);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new Event("splitrupee_offline_queue_changed"));
  } catch (e) {
    console.error("Failed to write offline expense queue", e);
  }

  return newItem;
}

export function removeOfflineExpense(id: string): void {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new Event("splitrupee_offline_queue_changed"));
  } catch (e) {
    console.error("Failed to remove item from offline queue", e);
  }
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("splitrupee_offline_queue_changed"));
  } catch (e) {
    console.error("Failed to clear offline queue", e);
  }
}

export async function syncOfflineQueue(): Promise<{
  syncedCount: number;
  errors: string[];
}> {
  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, errors: [] };
  }

  let syncedCount = 0;
  const errors: string[] = [];
  const remainingItems: OfflineExpenseItem[] = [];

  for (const item of queue) {
    try {
      const url = item.isEdit && item.expenseId ? `/api/expenses/${item.expenseId}` : "/api/expenses";
      const method = item.isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Server rejected offline expense");
      }

      syncedCount++;
    } catch (err: any) {
      console.error(`Failed to sync item ${item.title}:`, err);
      errors.push(`${item.title}: ${err.message || "Failed to sync"}`);
      remainingItems.push(item);
    }
  }

  try {
    if (remainingItems.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingItems));
    }
    window.dispatchEvent(new Event("splitrupee_offline_queue_changed"));
    window.dispatchEvent(new Event("splitrupee_refresh"));
  } catch (e) {
    console.error("Failed to update queue after sync", e);
  }

  return { syncedCount, errors };
}
