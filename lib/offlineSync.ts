// SplitRupee Offline Synchronization Engine
export type OfflineActionType =
  | "CREATE_EXPENSE"
  | "UPDATE_EXPENSE"
  | "DELETE_EXPENSE"
  | "CREATE_PAYMENT";

export interface OfflineExpenseItem {
  id: string; // client temporary ID
  actionType?: OfflineActionType;
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
const ACTIVITIES_CACHE_PREFIX = "splitrupee_cached_activities_";
const ITINERARIES_CACHE_PREFIX = "splitrupee_cached_itineraries_";
const ACTIVE_ITINERARY_DRAFT_KEY = "splitrupee_cached_active_itinerary";

export function resolveOfflineActionType(item: OfflineExpenseItem): OfflineActionType {
  if (item.actionType) return item.actionType;
  return item.isEdit ? "UPDATE_EXPENSE" : "CREATE_EXPENSE";
}

function dispatchOfflineUpdates() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("splitrupee_offline_queue_changed"));
  window.dispatchEvent(new Event("splitrupee_refresh"));
}

export function saveCachedGroup(groupId: string, groupData: any): void {
  if (typeof window === "undefined" || !groupId || !groupData) return;
  try {
    const serialized = JSON.stringify(groupData);
    localStorage.setItem(`${GROUP_CACHE_PREFIX}${groupId}`, serialized);
    if (groupData.id && groupData.id !== groupId) {
      localStorage.setItem(`${GROUP_CACHE_PREFIX}${groupData.id}`, serialized);
    }
    if (groupData.inviteCode && groupData.inviteCode !== groupId) {
      localStorage.setItem(`${GROUP_CACHE_PREFIX}${groupData.inviteCode}`, serialized);
    }

    const groupsList = getCachedGroupsList();
    const idx = groupsList.findIndex((g: any) => g.id === groupId || g.id === groupData.id);
    const summaryItem = {
      id: groupData.id,
      name: groupData.name,
      description: groupData.description,
      type: groupData.type,
      currency: groupData.currency,
      members: groupData.members || [],
      expenses: groupData.expenses || [],
      payments: groupData.payments || [],
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
    let group: any = null;
    const raw = localStorage.getItem(`${GROUP_CACHE_PREFIX}${groupId}`);
    if (raw) {
      try {
        group = JSON.parse(raw);
      } catch {
        group = null;
      }
    }

    // Fallback: If not found individually, retrieve from cached groups list
    if (!group || !group.id) {
      const list = getCachedGroupsList();
      const fromList = list.find((g: any) => g.id === groupId || g.inviteCode === groupId);
      if (fromList) {
        group = {
          id: fromList.id,
          name: fromList.name,
          description: fromList.description || null,
          type: fromList.type || "OTHER",
          currency: fromList.currency || "INR",
          inviteCode: fromList.inviteCode || fromList.id?.slice(0, 8),
          members: fromList.members || [],
          expenses: fromList.expenses || [],
          payments: fromList.payments || [],
          activityLogs: fromList.activityLogs || [],
          itineraries: fromList.itineraries || [],
          createdAt: fromList.createdAt || new Date().toISOString(),
          updatedAt: fromList.updatedAt || new Date().toISOString(),
        };
      }
    }

    if (!group || !group.id) return null;

    const queue = getOfflineQueue().filter(
      (item) => item.groupId === groupId || item.groupId === group.id
    );
    if (queue.length === 0) return group;

    let expenses = Array.isArray(group.expenses) ? [...group.expenses] : [];
    const payments = Array.isArray(group.payments) ? [...group.payments] : [];
    const activityLogs = Array.isArray(group.activityLogs) ? [...group.activityLogs] : [];

    queue.forEach((item) => {
      const actionType = resolveOfflineActionType(item);
      const memberLookup = (uid: string) =>
        group.members?.find((m: any) => m.id === uid) || { id: uid, name: "Member" };

      if (actionType === "DELETE_EXPENSE" && item.expenseId) {
        expenses = expenses.filter((e: any) => e.id !== item.expenseId);
        activityLogs.unshift({
          id: `${item.id}_log`,
          groupId: group.id,
          userId: item.payload?.deletedById || "",
          action: "EXPENSE_DELETED",
          entityTitle: item.title,
          details: `Deleted expense "${item.title}" locally (Pending sync)`,
          createdAt: new Date(item.createdAt).toISOString(),
          user: memberLookup(item.payload?.deletedById || ""),
          isOfflinePending: true,
        });
      } else if (actionType === "UPDATE_EXPENSE" && item.expenseId) {
        const eIdx = expenses.findIndex((e: any) => e.id === item.expenseId);
        const mappedSplits = (item.payload?.splits || []).map((s: any, idx: number) => ({
          id: `${item.id}_s_${idx}`,
          userId: s.userId,
          amount: s.amount,
          percentage: s.percentage,
          user: memberLookup(s.userId),
        }));
        if (eIdx >= 0) {
          expenses[eIdx] = {
            ...expenses[eIdx],
            ...item.payload,
            title: item.title,
            totalAmount: item.totalAmount,
            paidBy: memberLookup(item.payload?.paidById || expenses[eIdx].paidById),
            splits: mappedSplits.length > 0 ? mappedSplits : expenses[eIdx].splits,
            isOfflinePending: true,
          };
        }
      } else if (actionType === "CREATE_EXPENSE") {
        if (!expenses.some((e: any) => e.id === item.id)) {
          expenses.unshift({
            id: item.id,
            groupId: item.groupId,
            paidById: item.payload?.paidById,
            title: item.title,
            totalAmount: item.totalAmount,
            originalAmount: item.payload?.originalAmount ?? null,
            currency: item.payload?.currency || "INR",
            exchangeRate: item.payload?.exchangeRate || 1.0,
            splitType: item.payload?.splitType || "EQUAL",
            category: item.payload?.category || "Miscellaneous",
            notes: item.payload?.notes || "",
            date: item.payload?.date || new Date(item.createdAt).toISOString(),
            createdAt: new Date(item.createdAt).toISOString(),
            updatedAt: new Date(item.createdAt).toISOString(),
            paidBy: memberLookup(item.payload?.paidById),
            splits: (item.payload?.splits || []).map((s: any, idx: number) => ({
              id: `${item.id}_s_${idx}`,
              userId: s.userId,
              amount: s.amount,
              percentage: s.percentage,
              user: memberLookup(s.userId),
            })),
            isOfflinePending: true,
          });
          activityLogs.unshift({
            id: `${item.id}_log`,
            groupId: group.id,
            userId: item.payload?.paidById || "",
            action: "EXPENSE_CREATED",
            entityTitle: item.title,
            details: `Added offline expense "${item.title}" of ₹${Math.round(item.totalAmount).toLocaleString("en-IN")} (Pending sync)`,
            createdAt: new Date(item.createdAt).toISOString(),
            user: memberLookup(item.payload?.paidById),
            isOfflinePending: true,
          });
        }
      } else if (actionType === "CREATE_PAYMENT") {
        if (!payments.some((p: any) => p.id === item.id)) {
          const payer = memberLookup(item.payload?.payerId);
          const receiver = memberLookup(item.payload?.receiverId);
          payments.unshift({
            id: item.id,
            groupId: item.groupId,
            payerId: item.payload?.payerId,
            receiverId: item.payload?.receiverId,
            amount: item.totalAmount,
            notes: item.payload?.notes || "Offline Cash Payment",
            createdAt: new Date(item.createdAt).toISOString(),
            payer,
            receiver,
            isOfflinePending: true,
          });
          activityLogs.unshift({
            id: `${item.id}_log`,
            groupId: group.id,
            userId: item.payload?.payerId || "",
            action: "PAYMENT_SETTLED",
            entityTitle: `Payment of ₹${Math.round(item.totalAmount).toLocaleString("en-IN")}`,
            details: `${payer.name} paid ${receiver.name} ₹${Math.round(item.totalAmount).toLocaleString("en-IN")} offline (Pending sync)`,
            createdAt: new Date(item.createdAt).toISOString(),
            user: payer,
            isOfflinePending: true,
          });
        }
      }
    });

    return { ...group, expenses, payments, activityLogs };
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
  } catch {
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
    let expenses = Array.isArray(list) ? [...list] : [];
    const groupsList = getCachedGroupsList();

    const findMemberInGroups = (groupId: string, uid: string) => {
      const grp = groupsList.find((g: any) => g.id === groupId);
      return grp?.members?.find((m: any) => m.id === uid) || { id: uid, name: "You" };
    };

    const queue = getOfflineQueue();
    queue.forEach((item) => {
      const actionType = resolveOfflineActionType(item);

      if (actionType === "DELETE_EXPENSE" && item.expenseId) {
        expenses = expenses.filter((e: any) => e.id !== item.expenseId);
      } else if (actionType === "UPDATE_EXPENSE" && item.expenseId) {
        const idx = expenses.findIndex((e: any) => e.id === item.expenseId);
        if (idx >= 0) {
          expenses[idx] = {
            ...expenses[idx],
            ...item.payload,
            title: item.title,
            totalAmount: item.totalAmount,
            paidBy: findMemberInGroups(item.groupId, item.payload?.paidById || expenses[idx].paidById),
            splits: (item.payload?.splits || []).map((s: any, sIdx: number) => ({
              id: `${item.id}_s_${sIdx}`,
              userId: s.userId,
              amount: s.amount,
              percentage: s.percentage,
              user: findMemberInGroups(item.groupId, s.userId),
            })),
            isOfflinePending: true,
          };
        }
      } else if (actionType === "CREATE_EXPENSE") {
        if (!expenses.some((e: any) => e.id === item.id)) {
          expenses.unshift({
            id: item.id,
            groupId: item.groupId,
            groupName: item.groupName || "Group",
            paidById: item.payload?.paidById,
            title: item.title,
            totalAmount: item.totalAmount,
            originalAmount: item.payload?.originalAmount ?? null,
            currency: item.payload?.currency || "INR",
            exchangeRate: item.payload?.exchangeRate || 1.0,
            splitType: item.payload?.splitType || "EQUAL",
            category: item.payload?.category || "Miscellaneous",
            notes: item.payload?.notes || "",
            date: item.payload?.date || new Date(item.createdAt).toISOString(),
            createdAt: new Date(item.createdAt).toISOString(),
            updatedAt: new Date(item.createdAt).toISOString(),
            paidBy: findMemberInGroups(item.groupId, item.payload?.paidById),
            splits: (item.payload?.splits || []).map((s: any, sIdx: number) => ({
              id: `${item.id}_s_${sIdx}`,
              userId: s.userId,
              amount: s.amount,
              percentage: s.percentage,
              user: findMemberInGroups(item.groupId, s.userId),
            })),
            isOfflinePending: true,
          });
        }
      }
    });
    return expenses;
  } catch {
    return [];
  }
}

export function saveCachedActivities(userId: string, activities: any[]): void {
  if (typeof window === "undefined" || !userId || !Array.isArray(activities)) return;
  try {
    localStorage.setItem(`${ACTIVITIES_CACHE_PREFIX}${userId}`, JSON.stringify(activities));
  } catch (e) {
    console.warn("Failed to cache activity logs", e);
  }
}

export function getCachedActivities(userId?: string): any[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(`${ACTIVITIES_CACHE_PREFIX}${userId}`);
    const list = raw ? JSON.parse(raw) : [];
    const baseActivities = Array.isArray(list) ? [...list] : [];

    const queue = getOfflineQueue();
    const pendingLogs = [...queue].reverse().map((item) => {
      const actionType = resolveOfflineActionType(item);
      let action = "EXPENSE_CREATED";
      let entityTitle = item.title;
      let details = `${item.title} (₹${Math.round(item.totalAmount).toLocaleString("en-IN")}) — Pending sync`;

      if (actionType === "UPDATE_EXPENSE") {
        action = "EXPENSE_UPDATED";
      } else if (actionType === "DELETE_EXPENSE") {
        action = "EXPENSE_DELETED";
      } else if (actionType === "CREATE_PAYMENT") {
        action = "PAYMENT_SETTLED";
        entityTitle = `Payment of ₹${Math.round(item.totalAmount).toLocaleString("en-IN")}`;
        details = `${item.payload?.payerName || "Member"} paid ${item.payload?.receiverName || "Member"} ₹${Math.round(item.totalAmount).toLocaleString("en-IN")} — Pending sync`;
      }

      return {
        id: `${item.id}_act`,
        groupId: item.groupId,
        userId: item.payload?.paidById || item.payload?.payerId || item.payload?.deletedById || userId,
        action,
        entityTitle,
        details,
        createdAt: new Date(item.createdAt).toISOString(),
        group: { id: item.groupId, name: item.groupName || "Group" },
        user: { id: userId, name: "You" },
        isOfflinePending: true,
      };
    });

    return [...pendingLogs, ...baseActivities];
  } catch {
    return [];
  }
}

export function saveCachedItineraries(userId: string | undefined, itineraries: any[]): void {
  if (typeof window === "undefined" || !Array.isArray(itineraries)) return;
  try {
    localStorage.setItem(`${ITINERARIES_CACHE_PREFIX}${userId || "anon"}`, JSON.stringify(itineraries));
  } catch (e) {
    console.warn("Failed to cache itineraries list", e);
  }
}

export function getCachedItineraries(userId?: string): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${ITINERARIES_CACHE_PREFIX}${userId || "anon"}`);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveCachedItineraryDraft(draft: {
  form?: any;
  result?: any;
  savedItineraryId?: string | null;
  chatMessages?: any[];
}): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_ITINERARY_DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {
    console.warn("Failed to save itinerary draft locally", e);
  }
}

export function getCachedItineraryDraft(): {
  form?: any;
  result?: any;
  savedItineraryId?: string | null;
  chatMessages?: any[];
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_ITINERARY_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
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

  // Editing an unsynced offline_ expense: update the original queued creation item in-place
  if (data.isEdit && data.expenseId && data.expenseId.startsWith("offline_")) {
    const localIdx = queue.findIndex((item) => item.id === data.expenseId);
    if (localIdx >= 0) {
      const updatedItem: OfflineExpenseItem = {
        ...queue[localIdx],
        ...data,
        id: data.expenseId,
        isEdit: false,
        actionType: "CREATE_EXPENSE",
        expenseId: undefined,
        createdAt: queue[localIdx].createdAt,
      };
      queue[localIdx] = updatedItem;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        dispatchOfflineUpdates();
      } catch (e) {
        console.error("Failed to update local offline expense in queue", e);
      }
      return updatedItem;
    }
  }

  const newItem: OfflineExpenseItem = {
    ...data,
    actionType: data.isEdit ? "UPDATE_EXPENSE" : "CREATE_EXPENSE",
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
  };

  if (data.isEdit && data.expenseId) {
    const existingIndex = queue.findIndex(
      (item) => resolveOfflineActionType(item) === "UPDATE_EXPENSE" && item.expenseId === data.expenseId
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
    dispatchOfflineUpdates();
  } catch (e) {
    console.error("Failed to write offline expense queue", e);
  }

  return newItem;
}

export function addOfflineDeleteExpense(params: {
  expenseId: string;
  groupId: string;
  groupName?: string;
  title: string;
  totalAmount: number;
  deletedById?: string;
}): { removedLocal: boolean } {
  let queue = getOfflineQueue();

  // If the expense only existed locally in queue, remove it directly
  if (params.expenseId.startsWith("offline_")) {
    queue = queue.filter((item) => item.id !== params.expenseId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      dispatchOfflineUpdates();
    } catch (e) {
      console.error("Failed to remove local offline expense", e);
    }
    return { removedLocal: true };
  }

  // Drop any queued edits for this deleted expense
  queue = queue.filter(
    (item) => !(resolveOfflineActionType(item) === "UPDATE_EXPENSE" && item.expenseId === params.expenseId)
  );

  // Avoid duplicate DELETE entries
  if (!queue.some((item) => resolveOfflineActionType(item) === "DELETE_EXPENSE" && item.expenseId === params.expenseId)) {
    queue.push({
      id: `offline_del_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actionType: "DELETE_EXPENSE",
      isEdit: false,
      expenseId: params.expenseId,
      groupId: params.groupId,
      groupName: params.groupName || "Group",
      title: params.title,
      totalAmount: params.totalAmount,
      payload: { deletedById: params.deletedById || "" },
      createdAt: Date.now(),
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    dispatchOfflineUpdates();
  } catch (e) {
    console.error("Failed to queue offline delete", e);
  }

  return { removedLocal: false };
}

export function addOfflinePayment(params: {
  groupId: string;
  groupName?: string;
  payerId: string;
  payerName?: string;
  receiverId: string;
  receiverName?: string;
  amount: number;
  notes?: string;
  callerId?: string;
  idempotencyKey?: string;
}): OfflineExpenseItem {
  const queue = getOfflineQueue();
  const newItem: OfflineExpenseItem = {
    id: `offline_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    actionType: "CREATE_PAYMENT",
    isEdit: false,
    groupId: params.groupId,
    groupName: params.groupName || "Group",
    title: `Settlement: ${params.payerName || "Payer"} → ${params.receiverName || "Receiver"}`,
    totalAmount: params.amount,
    payload: {
      groupId: params.groupId,
      payerId: params.payerId,
      payerName: params.payerName,
      receiverId: params.receiverId,
      receiverName: params.receiverName,
      amount: params.amount,
      notes: params.notes,
      callerId: params.callerId,
      idempotencyKey: params.idempotencyKey,
    },
    createdAt: Date.now(),
  };

  queue.push(newItem);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    dispatchOfflineUpdates();
  } catch (e) {
    console.error("Failed to queue offline cash settlement", e);
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
      const actionType = resolveOfflineActionType(item);
      let url = "/api/expenses";
      let method = "POST";
      let fetchBody: string | undefined = JSON.stringify(item.payload);

      if (actionType === "UPDATE_EXPENSE" && item.expenseId) {
        url = `/api/expenses/${item.expenseId}`;
        method = "PUT";
      } else if (actionType === "DELETE_EXPENSE" && item.expenseId) {
        const delBy = encodeURIComponent(item.payload?.deletedById || "");
        url = `/api/expenses/${item.expenseId}?deletedById=${delBy}`;
        method = "DELETE";
        fetchBody = undefined;
      } else if (actionType === "CREATE_PAYMENT") {
        url = "/api/payments";
        method = "POST";
        fetchBody = JSON.stringify({
          groupId: item.payload.groupId,
          payerId: item.payload.payerId,
          receiverId: item.payload.receiverId,
          amount: item.payload.amount,
          notes: item.payload.notes,
          callerId: item.payload.callerId,
          idempotencyKey: item.payload.idempotencyKey,
        });
      }

      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      if (controller) {
        timeoutId = setTimeout(() => controller.abort(), 10000);
      }

      const res = await fetch(url, {
        method,
        headers: fetchBody ? { "Content-Type": "application/json" } : undefined,
        body: fetchBody,
        signal: controller?.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (data?.offline) {
        throw new Error("Still offline");
      }

      if (!res.ok || !data?.ok) {
        const msg =
          (Array.isArray(data?.issues) && data.issues[0]) ||
          data?.error ||
          `Server responded with status ${res.status}`;
        throw new Error(msg);
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
    dispatchOfflineUpdates();
  } catch (e) {
    console.error("Failed to update queue after sync", e);
  }

  return { syncedCount, errors };
}
