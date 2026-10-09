export const CATEGORIES = [
  "Food",
  "Rent",
  "Travel",
  "Utilities",
  "Shopping",
  "Entertainment",
  "Miscellaneous",
] as const;
export type CategoryName = (typeof CATEGORIES)[number];

export const SPLIT_TYPES = ["EQUAL", "EXACT", "PERCENTAGE"] as const;
export type SplitTypeName = (typeof SPLIT_TYPES)[number];

export const GROUP_TYPES = ["TRIP", "HOME", "COUPLE", "OTHER"] as const;
export type GroupTypeName = (typeof GROUP_TYPES)[number];

export const ACTION_TYPES = [
  "EXPENSE_CREATED",
  "EXPENSE_UPDATED",
  "EXPENSE_DELETED",
  "PAYMENT_SETTLED",
  "MEMBER_ADDED",
  "MEMBER_REMOVED",
  "GROUP_CREATED",
] as const;
export type ActionTypeName = (typeof ACTION_TYPES)[number];

export interface MemberDTO {
  id: string;
  name: string;
  email?: string;
  avatarColor: string;
  phone?: string | null;
  upiId?: string | null;
}

export interface GroupDTO {
  id: string;
  name: string;
  type: GroupTypeName;
  currency: string;
  createdAt: string;
  updatedAt: string;
  members: MemberDTO[];
  _count?: {
    expenses: number;
    members: number;
  };
}

export interface ExpenseSplitDTO {
  id: string;
  userId: string;
  amount: number;
  percentage: number | null;
  user: MemberDTO;
}

export interface ExpenseDTO {
  id: string;
  groupId: string;
  paidById: string;
  title: string;
  totalAmount: number;
  splitType: SplitTypeName;
  category: CategoryName;
  notes?: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  paidBy: MemberDTO;
  splits: ExpenseSplitDTO[];
}

export interface PaymentDTO {
  id: string;
  groupId: string;
  payerId: string;
  receiverId: string;
  amount: number;
  notes?: string | null;
  createdAt: string;
  payer: MemberDTO;
  receiver: MemberDTO;
}

export interface ActivityLogDTO {
  id: string;
  groupId: string;
  userId: string;
  action: ActionTypeName;
  entityTitle: string;
  details?: string | null;
  createdAt: string;
  user: MemberDTO;
  group?: {
    id: string;
    name: string;
  };
}
