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
const GROUP_CACHE_PREFIX = "splitrupee_cached_group_";
const GROUPS_LIST_CACHE_KEY = "splitrupee_cached_groups_list";
const ALL_EXPENSES_CACHE_KEY = "splitrupee_cached_all_expenses";

export function saveCachedGroup(groupId: string, groupData: any): void {
  if (typeof window === "undefined" || !groupId || !groupData) return;
  try {
    localStorage.setItem(`${GROUP_CACHE_PREFIX}${groupId}`, JSON.stringify(groupData));
    const groupsList = getCachedGroupsList();
    const idx = groupsList.findIndex((g: any) => g.id === groupId);
    const summaryItem = {
      id: groupData.id,
      name: groupData.name,
      description: groupData.description,
      type: groupData.type,
      currency: groupData.currency,
      members: groupData.members || [],
      expenses: groupData.expenses || [],
      inviteCode: groupData.inviteCode || groupData.id?.slice(0, 8),
      createdAt: groupData.createdAt,
      updatedAt: groupData.updatedAt,
    };
    if (idx >= 0) {
      groupsList[idx] = { ...groupsList[idx], ...summaryItem };
    } else {
      groupsList.push(summaryItem as any);
    }
    localStorage.setItem(GROUPS_LIST_CACHE_KEY, JSON.stringify(groupsList));
  } catch (e) {
    console.warn("Failed to cache group data in localStorage", e);
  }
}

export function getCachedGroup(groupId: string): any | null {
  if (typeof window === "undefined" || !groupId) return null;
  try {
    const raw = localStorage.getItem(`${GROUP_CACHE_PREFIX}${groupId}`);
    if (!raw) return null;
    const group = JSON.parse(raw);
    if (!group || !group.id) return null;

    const queue = getOfflineQueue().filter((item) => item.groupId === groupId);
    if (queue.length > 0) {
      const expenses = Array.isArray(group.expenses) ? [...group.expenses] : [];
      queue.forEach((item) => {
        if (item.isEdit && item.expenseId) {
          const eIdx = expenses.findIndex((e: any) => e.id === item.expenseId);
          if (eIdx >= 0) {
            expenses[eIdx] = {
              ...expenses[eIdx],
              title: item.title,
              totalAmount: item.totalAmount,
              ...item.payload,
              isOfflinePending: true,
            };
          }
        } else {
          if (!expenses.some((e: any) => e.id === item.id)) {
            expenses.unshift({
              id: item.id,
              groupId: item.groupId,
              paidById: item.payload?.paidById,
              title: item.title,
              totalAmount: item.totalAmount,
              splitType: item.payload?.splitType || "EQUAL",
              category: item.payload?.category || "Miscellaneous",
              notes: item.payload?.notes || "",
              date: item.payload?.date || new Date(item.createdAt).toISOString(),
              createdAt: new Date(item.createdAt).toISOString(),
              updatedAt: new Date(item.createdAt).toISOString(),
              paidBy: group.members?.find((m: any) => m.id === item.payload?.paidById) || {
                id: item.payload?.paidById,
                name: "You",
              },
              splits: (item.payload?.splits || []).map((s: any, idx: number) => ({
                id: `${item.id}_s_${idx}`,
                userId: s.userId,
                amount: s.amount,
                percentage: s.percentage,
                user: group.members?.find((m: any) => m.id === s.userId),
              })),
              isOfflinePending: true,
            });
          }
        }
      });
      return { ...group, expenses };
    }

    return group;
  } catch (e) {
    console.error("Failed to read cached group from localStorage", e);
    return null;
  }
}

export function saveCachedGroupsList(groups: any[]): void {
  if (typeof window === "undefined" || !Array.isArray(groups)) return;
  try {
    localStorage.setItem(GROUPS_LIST_CACHE_KEY, JSON.stringify(groups));
  } catch (e) {
    console.warn("Failed to cache groups list", e);
  }
}

export function getCachedGroupsList(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GROUPS_LIST_CACHE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

export function saveCachedAllExpenses(expenses: any[]): void {
  if (typeof window === "undefined" || !Array.isArray(expenses)) return;
  try {
    localStorage.setItem(ALL_EXPENSES_CACHE_KEY, JSON.stringify(expenses));
  } catch (e) {
    console.warn("Failed to cache all expenses", e);
  }
}

export function getCachedAllExpenses(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ALL_EXPENSES_CACHE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const expenses = Array.isArray(list) ? [...list] : [];
    
    const queue = getOfflineQueue();
    queue.forEach((item) => {
      if (!expenses.some((e: any) => e.id === item.id)) {
        expenses.unshift({
          id: item.id,
          groupId: item.groupId,
          groupName: item.groupName || "Group",
          paidById: item.payload?.paidById,
          title: item.title,
          totalAmount: item.totalAmount,
          splitType: item.payload?.splitType || "EQUAL",
          category: item.payload?.category || "Miscellaneous",
          notes: item.payload?.notes || "",
          date: item.payload?.date || new Date(item.createdAt).toISOString(),
          createdAt: new Date(item.createdAt).toISOString(),
          updatedAt: new Date(item.createdAt).toISOString(),
          paidBy: {
            id: item.payload?.paidById,
            name: "You",
          },
          splits: item.payload?.splits || [],
          isOfflinePending: true,
        });
      }
    });
    return expenses;
  } catch (e) {
    return [];
  }
}

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
    window.dispatchEvent(new Event("splitrupee_refresh"));
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
    let timeoutId: any = null;
    try {
      const url = item.isEdit && item.expenseId ? `/api/expenses/${item.expenseId}` : "/api/expenses";
      const method = item.isEdit ? "PUT" : "POST";

      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      if (controller) {
        timeoutId = setTimeout(() => controller.abort(), 8000);
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
        signal: controller?.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Server responded with status ${res.status}`);
      }

      syncedCount++;
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
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
