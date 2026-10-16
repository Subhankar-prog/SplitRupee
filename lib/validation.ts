import { z } from "zod";
import { CATEGORIES, SPLIT_TYPES } from "./types";

export const expensePayloadSchema = z.object({
  groupId: z.string().min(1, "groupId is required"),
  paidById: z.string().min(1, "paidById is required"),
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  totalAmount: z.number({ invalid_type_error: "totalAmount must be a number" }),
  originalAmount: z.number().optional().nullable(),
  currency: z.string().optional().default("INR"),
  exchangeRate: z.number().optional().nullable(),
  splitType: z.enum(SPLIT_TYPES),
  category: z.enum(CATEGORIES),
  notes: z.string().max(500).optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
  splits: z
    .array(
      z.object({
        userId: z.string().min(1),
        amount: z.number().nullable().optional(),
        percentage: z.number().nullable().optional(),
      })
    )
    .min(1, "At least one split is required")
    .max(100),
});

export type ExpensePayload = z.infer<typeof expensePayloadSchema>;
