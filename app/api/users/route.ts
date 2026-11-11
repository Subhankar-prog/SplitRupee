import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runResilientTransaction } from "@/lib/dbTransaction";

export const dynamic = "force-dynamic";

/** GET /api/users: fetch user details with optional userId filter */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const where: any = {};
    if (userId) {
      where.id = userId;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        avatarColor: true,
        upiId: true,
        phone: true,
        isPro: true,
        _count: { select: { memberships: true } },
      },
    });
    return NextResponse.json({ ok: true, users });
  } catch (e) {
    console.error("[GET /api/users]", e);
    return NextResponse.json({ ok: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

/** POST /api/users: create a new user (register) */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, avatarColor, upiId } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ ok: false, error: "Valid email is required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ ok: true, user: existing, message: "Logged in as existing user" });
    }

    const colors = ["#10b981", "#f43f5e", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        avatarColor: avatarColor || randomColor,
        upiId: (upiId || "").trim() || null,
      },
    });

    return NextResponse.json({ ok: true, user: newUser, created: true });
  } catch (e) {
    console.error("[POST /api/users]", e);
    return NextResponse.json({ ok: false, error: "Could not create user" }, { status: 500 });
  }
}

/** PATCH /api/users: update user profile (name, phone, upiId, avatarColor) and smart auto-claim placeholder records */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, name, phone, upiId, avatarColor } = body;

    if (!userId) {
      return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const cleanName = typeof name === "string" ? name.trim() : undefined;

    let cleanUPI: string | null | undefined = undefined;
    if (upiId !== undefined) {
      if (typeof upiId === "string") {
        const trimmed = upiId.trim();
        cleanUPI = trimmed === "" ? null : trimmed;
      } else if (upiId === null) {
        cleanUPI = null;
      }
    }

    let cleanPhone: string | null | undefined = undefined;
    if (phone !== undefined) {
      if (typeof phone === "string" && phone.trim() !== "") {
        const digits = phone.trim().replace(/\D/g, "").slice(-10);
        if (digits.length !== 10) {
          return NextResponse.json(
            { ok: false, error: "INVALID_PHONE", message: "Please provide a valid 10-digit mobile number." },
            { status: 400 }
          );
        }
        cleanPhone = digits;
      } else {
        cleanPhone = null;
      }
    }

    let claimedGroupsCount = 0;
    let claimedExpensesCount = 0;

    // Smart Auto-Claim Placeholder Accounts if phone number is being attached/updated
    if (cleanPhone) {
      const collisions = await prisma.user.findMany({
        where: {
          id: { not: userId },
          OR: [
            { phone: cleanPhone },
            { email: `${cleanPhone}@splitrupee.in` },
          ],
        },
        select: {
          id: true,
          email: true,
          passwordHash: true,
        },
      });

      // Verify no collision with an already registered real account
      const realUserConflict = collisions.some(
        (u) =>
          u.passwordHash !== null ||
          (!u.email.endsWith("@splitrupee.in") && !u.email.startsWith("member_"))
      );

      if (realUserConflict) {
        return NextResponse.json(
          {
            ok: false,
            error: "PHONE_IN_USE",
            message: "This mobile number is already linked to another registered account.",
          },
          { status: 409 }
        );
      }

      // If placeholders exist, run transactional auto-claim into currentUser
      if (collisions.length > 0) {
        const placeholderIds = collisions.map((c) => c.id);

        const claimStats = await runResilientTransaction(async (tx) => {
          let txClaimedGroups = 0;
          let txClaimedExpenses = 0;

          // 1. Group Memberships (bulk check + transfer/delete + activity logs)
          const placeholderMemberships = await tx.groupMember.findMany({
            where: { userId: { in: placeholderIds } },
          });

          if (placeholderMemberships.length > 0) {
            const allGroupIds = Array.from(new Set(placeholderMemberships.map((m) => m.groupId)));
            const existingTargetMemberships = await tx.groupMember.findMany({
              where: {
                userId,
                groupId: { in: allGroupIds },
              },
              select: { groupId: true },
            });

            const seenGroupIds = new Set(existingTargetMemberships.map((m) => m.groupId));
            const transferMembershipIds: string[] = [];
            const deleteMembershipIds: string[] = [];

            for (const m of placeholderMemberships) {
              if (seenGroupIds.has(m.groupId)) {
                deleteMembershipIds.push(m.id);
              } else {
                seenGroupIds.add(m.groupId);
                transferMembershipIds.push(m.id);
              }
            }

            if (deleteMembershipIds.length > 0) {
              await tx.groupMember.deleteMany({
                where: { id: { in: deleteMembershipIds } },
              });
            }

            if (transferMembershipIds.length > 0) {
              await tx.groupMember.updateMany({
                where: { id: { in: transferMembershipIds } },
                data: { userId },
              });
              txClaimedGroups = transferMembershipIds.length;
            }

            await tx.activityLog.createMany({
              data: allGroupIds.map((gid) => ({
                groupId: gid,
                userId,
                action: "MEMBER_ADDED",
                entityTitle: currentUser.name,
                details: `${currentUser.name} linked mobile number and connected past expenses`,
              })),
            });
          }

          // 2. Expenses paid by placeholders (bulk)
          await tx.expense.updateMany({
            where: { paidById: { in: placeholderIds } },
            data: { paidById: userId },
          });

          // 3. Recurring expenses (bulk)
          await tx.recurringExpense.updateMany({
            where: { paidById: { in: placeholderIds } },
            data: { paidById: userId },
          });

          // 4. Expense splits (bulk fetch + consolidate overlapping + bulk reassign/delete)
          const placeholderSplits = await tx.expenseSplit.findMany({
            where: { userId: { in: placeholderIds } },
          });

          if (placeholderSplits.length > 0) {
            const splitExpenseIds = Array.from(new Set(placeholderSplits.map((s) => s.expenseId)));
            const existingTargetSplits = await tx.expenseSplit.findMany({
              where: {
                userId,
                expenseId: { in: splitExpenseIds },
              },
            });
            const targetSplitByExpenseId = new Map(existingTargetSplits.map((s) => [s.expenseId, s]));

            // Track placeholder splits per expense so multiple placeholders on same expense also merge cleanly
            const splitsByExpense = new Map<string, typeof placeholderSplits>();
            for (const s of placeholderSplits) {
              const list = splitsByExpense.get(s.expenseId) || [];
              list.push(s);
              splitsByExpense.set(s.expenseId, list);
            }

            const directTransferSplitIds: string[] = [];
            const deleteSplitIds: string[] = [];

            for (const [expenseId, groupSplits] of splitsByExpense.entries()) {
              const targetSplit = targetSplitByExpenseId.get(expenseId);
              if (targetSplit) {
                const addedAmount = groupSplits.reduce((sum, s) => sum + s.amount, 0);
                const hasPct =
                  targetSplit.percentage !== null || groupSplits.some((s) => s.percentage !== null);
                const addedPct = groupSplits.reduce((sum, s) => sum + (s.percentage || 0), 0);

                await tx.expenseSplit.update({
                  where: { id: targetSplit.id },
                  data: {
                    amount: targetSplit.amount + addedAmount,
                    percentage: hasPct ? (targetSplit.percentage || 0) + addedPct : null,
                  },
                });
                deleteSplitIds.push(...groupSplits.map((s) => s.id));
              } else if (groupSplits.length === 1) {
                directTransferSplitIds.push(groupSplits[0].id);
                txClaimedExpenses++;
              } else {
                // Multiple placeholders had splits on the same expense while user had none:
                // keep the first split, merge amounts from the rest, delete duplicates
                const [first, ...rest] = groupSplits;
                const totalAmount = groupSplits.reduce((sum, s) => sum + s.amount, 0);
                const hasPct = groupSplits.some((s) => s.percentage !== null);
                const totalPct = groupSplits.reduce((sum, s) => sum + (s.percentage || 0), 0);
                await tx.expenseSplit.update({
                  where: { id: first.id },
                  data: {
                    userId,
                    amount: totalAmount,
                    percentage: hasPct ? totalPct : null,
                  },
                });
                deleteSplitIds.push(...rest.map((s) => s.id));
                txClaimedExpenses += groupSplits.length;
              }
            }

            if (directTransferSplitIds.length > 0) {
              await tx.expenseSplit.updateMany({
                where: { id: { in: directTransferSplitIds } },
                data: { userId },
              });
            }

            if (deleteSplitIds.length > 0) {
              await tx.expenseSplit.deleteMany({
                where: { id: { in: deleteSplitIds } },
              });
            }
          }

          // 5. Payments (delete redundant self-payments + bulk reassign payer/receiver)
          await tx.payment.deleteMany({
            where: {
              OR: [
                { payerId: { in: placeholderIds }, receiverId: userId },
                { payerId: userId, receiverId: { in: placeholderIds } },
                { payerId: { in: placeholderIds }, receiverId: { in: placeholderIds } },
              ],
            },
          });

          await tx.payment.updateMany({
            where: { payerId: { in: placeholderIds } },
            data: { payerId: userId },
          });

          await tx.payment.updateMany({
            where: { receiverId: { in: placeholderIds } },
            data: { receiverId: userId },
          });

          // 6. Delete placeholder accounts in bulk
          await tx.user.deleteMany({
            where: { id: { in: placeholderIds } },
          });

          return { claimedGroups: txClaimedGroups, claimedExpenses: txClaimedExpenses };
        });

        claimedGroupsCount = claimStats.claimedGroups;
        claimedExpensesCount = claimStats.claimedExpenses;
      }
    }

    // Update currentUser fields
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(cleanName ? { name: cleanName } : {}),
        ...(cleanPhone !== undefined ? { phone: cleanPhone } : {}),
        ...(cleanUPI !== undefined ? { upiId: cleanUPI } : {}),
        ...(avatarColor ? { avatarColor } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarColor: true,
        upiId: true,
        phone: true,
        isPro: true,
      },
    });

    return NextResponse.json({
      ok: true,
      user: updated,
      claimedGroupsCount,
      claimedExpensesCount,
      message:
        claimedGroupsCount > 0
          ? `Linked your phone number! Automatically imported your expenses from ${claimedGroupsCount} group${claimedGroupsCount > 1 ? "s" : ""}.`
          : "Profile updated successfully!",
    });
  } catch (e: any) {
    console.error("[PATCH /api/users]", e);
    return NextResponse.json({ ok: false, error: e.message || "Failed to update user" }, { status: 500 });
  }
}
