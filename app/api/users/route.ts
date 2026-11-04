import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const cleanUPI = typeof upiId === "string" ? upiId.trim() : undefined;

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
        include: {
          memberships: true,
          splits: true,
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
        await prisma.$transaction(async (tx) => {
          for (const placeholder of collisions) {
            // 1. Group Memberships
            for (const membership of placeholder.memberships) {
              const userAlreadyMember = await tx.groupMember.findUnique({
                where: {
                  groupId_userId: {
                    groupId: membership.groupId,
                    userId,
                  },
                },
              });

              if (userAlreadyMember) {
                // Delete placeholder membership to avoid duplicate
                await tx.groupMember.delete({ where: { id: membership.id } });
              } else {
                // Reassign membership to active user
                await tx.groupMember.update({
                  where: { id: membership.id },
                  data: { userId },
                });
                claimedGroupsCount++;
              }

              // Activity Log in the group
              await tx.activityLog.create({
                data: {
                  groupId: membership.groupId,
                  userId,
                  action: "MEMBER_ADDED",
                  entityTitle: currentUser.name,
                  details: `${currentUser.name} linked mobile number and connected past expenses`,
                },
              });
            }

            // 2. Expenses paid by placeholder
            await tx.expense.updateMany({
              where: { paidById: placeholder.id },
              data: { paidById: userId },
            });

            // 3. Recurring expenses
            await tx.recurringExpense.updateMany({
              where: { paidById: placeholder.id },
              data: { paidById: userId },
            });

            // 4. Expense splits
            for (const split of placeholder.splits) {
              const existingTargetSplit = await tx.expenseSplit.findUnique({
                where: {
                  expenseId_userId: {
                    expenseId: split.expenseId,
                    userId,
                  },
                },
              });

              if (existingTargetSplit) {
                await tx.expenseSplit.update({
                  where: { id: existingTargetSplit.id },
                  data: {
                    amount: existingTargetSplit.amount + split.amount,
                    percentage:
                      existingTargetSplit.percentage !== null || split.percentage !== null
                        ? (existingTargetSplit.percentage || 0) + (split.percentage || 0)
                        : null,
                  },
                });
                await tx.expenseSplit.delete({ where: { id: split.id } });
              } else {
                await tx.expenseSplit.update({
                  where: { id: split.id },
                  data: { userId },
                });
                claimedExpensesCount++;
              }
            }

            // 5. Payments (Payer)
            const payerPayments = await tx.payment.findMany({
              where: { payerId: placeholder.id },
            });
            for (const p of payerPayments) {
              if (p.receiverId === userId) {
                await tx.payment.delete({ where: { id: p.id } });
              } else {
                await tx.payment.update({
                  where: { id: p.id },
                  data: { payerId: userId },
                });
              }
            }

            // 6. Payments (Receiver)
            const receiverPayments = await tx.payment.findMany({
              where: { receiverId: placeholder.id },
            });
            for (const p of receiverPayments) {
              if (p.payerId === userId) {
                await tx.payment.delete({ where: { id: p.id } });
              } else {
                await tx.payment.update({
                  where: { id: p.id },
                  data: { receiverId: userId },
                });
              }
            }

            // 7. Delete the placeholder account
            await tx.user.delete({ where: { id: placeholder.id } });
          }
        });
      }
    }

    // Update currentUser fields
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(cleanName ? { name: cleanName } : {}),
        ...(cleanPhone !== undefined ? { phone: cleanPhone } : {}),
        ...(cleanUPI !== undefined ? { upiId: cleanUPI || null } : {}),
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
