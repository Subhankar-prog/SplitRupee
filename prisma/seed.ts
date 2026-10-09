import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with multi-user, multi-group, UPI IDs, expenses, payments & activity logs...");

  // 1. Create Users with UPI IDs
  const people = [
    { name: "Aarav Sharma", email: "aarav@splitrupee.in", avatarColor: "#10b981", upiId: "aarav@okaxis" },
    { name: "Diya Patel", email: "diya@splitrupee.in", avatarColor: "#f43f5e", upiId: "diya@okhdfcbank" },
    { name: "Kabir Mehta", email: "kabir@splitrupee.in", avatarColor: "#0ea5e9", upiId: "kabir@paytm" },
    { name: "Meera Iyer", email: "meera@splitrupee.in", avatarColor: "#f59e0b", upiId: "meera@icici" },
    { name: "Rohan Verma", email: "rohan@splitrupee.in", avatarColor: "#8b5cf6", upiId: "rohan@upi" },
    { name: "Priya Nair", email: "priya@splitrupee.in", avatarColor: "#ec4899", upiId: "priya@ybl" },
  ];

  const users: Record<string, any> = {};
  for (const p of people) {
    users[p.name] = await prisma.user.upsert({
      where: { email: p.email },
      update: { name: p.name, avatarColor: p.avatarColor, upiId: p.upiId },
      create: p,
    });
  }

  // 2. Create Groups with Invite Codes
  const goaGroup = await prisma.group.upsert({
    where: { id: "goa-beach-trip-2026" },
    update: { inviteCode: "goa2026" },
    create: {
      id: "goa-beach-trip-2026",
      name: "Goa Beach Trip 🌴",
      type: "TRIP",
      currency: "INR",
      inviteCode: "goa2026",
      members: {
        create: [
          { userId: users["Aarav Sharma"].id },
          { userId: users["Diya Patel"].id },
          { userId: users["Kabir Mehta"].id },
          { userId: users["Meera Iyer"].id },
        ],
      },
    },
  });

  const flatGroup = await prisma.group.upsert({
    where: { id: "flat-402-koramangala" },
    update: { inviteCode: "flat402" },
    create: {
      id: "flat-402-koramangala",
      name: "Flat 402 Koramangala 🏠",
      type: "HOME",
      currency: "INR",
      inviteCode: "flat402",
      members: {
        create: [
          { userId: users["Aarav Sharma"].id },
          { userId: users["Kabir Mehta"].id },
          { userId: users["Rohan Verma"].id },
        ],
      },
    },
  });

  const dinnerGroup = await prisma.group.upsert({
    where: { id: "weekend-foodies" },
    update: { inviteCode: "foodies" },
    create: {
      id: "weekend-foodies",
      name: "Weekend Foodies 🍕",
      type: "OTHER",
      currency: "INR",
      inviteCode: "foodies",
      members: {
        create: [
          { userId: users["Diya Patel"].id },
          { userId: users["Meera Iyer"].id },
          { userId: users["Priya Nair"].id },
        ],
      },
    },
  });

  // 3. Create Expenses for Goa Group
  await prisma.expense.create({
    data: {
      groupId: goaGroup.id,
      paidById: users["Aarav Sharma"].id,
      title: "Anjuna Beach Villa Booking",
      totalAmount: 12000,
      splitType: "EQUAL",
      category: "Rent",
      notes: "3 nights Airbnb stay with pool",
      createdAt: new Date(Date.now() - 3 * 86400000),
      splits: {
        create: [
          { userId: users["Aarav Sharma"].id, amount: 3000, percentage: 25 },
          { userId: users["Diya Patel"].id, amount: 3000, percentage: 25 },
          { userId: users["Kabir Mehta"].id, amount: 3000, percentage: 25 },
          { userId: users["Meera Iyer"].id, amount: 3000, percentage: 25 },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      groupId: goaGroup.id,
      paidById: users["Diya Patel"].id,
      title: "Curlies Beach Shack Dinner & Drinks",
      totalAmount: 4500,
      splitType: "EQUAL",
      category: "Food",
      notes: "Seafood platter + coolers",
      createdAt: new Date(Date.now() - 2 * 86400000),
      splits: {
        create: [
          { userId: users["Aarav Sharma"].id, amount: 1125, percentage: 25 },
          { userId: users["Diya Patel"].id, amount: 1125, percentage: 25 },
          { userId: users["Kabir Mehta"].id, amount: 1125, percentage: 25 },
          { userId: users["Meera Iyer"].id, amount: 1125, percentage: 25 },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      groupId: goaGroup.id,
      paidById: users["Kabir Mehta"].id,
      title: "Activa & Royal Enfield Rentals",
      totalAmount: 2400,
      splitType: "EQUAL",
      category: "Travel",
      notes: "2 scooters for 2 days + full tank fuel",
      createdAt: new Date(Date.now() - 1 * 86400000),
      splits: {
        create: [
          { userId: users["Aarav Sharma"].id, amount: 600, percentage: 25 },
          { userId: users["Diya Patel"].id, amount: 600, percentage: 25 },
          { userId: users["Kabir Mehta"].id, amount: 600, percentage: 25 },
          { userId: users["Meera Iyer"].id, amount: 600, percentage: 25 },
        ],
      },
    },
  });

  // 4. Create Expenses for Flat Group
  await prisma.expense.create({
    data: {
      groupId: flatGroup.id,
      paidById: users["Rohan Verma"].id,
      title: "High-Speed WiFi & ACT Broadband",
      totalAmount: 1899,
      splitType: "EQUAL",
      category: "Utilities",
      notes: "Monthly fiber 300 Mbps bill",
      createdAt: new Date(Date.now() - 4 * 86400000),
      splits: {
        create: [
          { userId: users["Aarav Sharma"].id, amount: 633, percentage: 33.33 },
          { userId: users["Kabir Mehta"].id, amount: 633, percentage: 33.33 },
          { userId: users["Rohan Verma"].id, amount: 633, percentage: 33.34 },
        ],
      },
    },
  });

  // 5. Settlement Payment
  await prisma.payment.create({
    data: {
      groupId: goaGroup.id,
      payerId: users["Meera Iyer"].id,
      receiverId: users["Aarav Sharma"].id,
      amount: 2000,
      notes: "Google Pay for villa advance",
      createdAt: new Date(Date.now() - 1 * 86400000),
    },
  });

  // 6. Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        groupId: goaGroup.id,
        userId: users["Aarav Sharma"].id,
        action: "GROUP_CREATED",
        entityTitle: "Goa Beach Trip 🌴",
        details: "Created group with 4 members",
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        groupId: goaGroup.id,
        userId: users["Aarav Sharma"].id,
        action: "EXPENSE_CREATED",
        entityTitle: "Anjuna Beach Villa Booking",
        details: "Added expense of ₹12,000.00 (Split equally between 4 people)",
        createdAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        groupId: goaGroup.id,
        userId: users["Diya Patel"].id,
        action: "EXPENSE_CREATED",
        entityTitle: "Curlies Beach Shack Dinner & Drinks",
        details: "Added expense of ₹4,500.00 (Split equally between 4 people)",
        createdAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        groupId: goaGroup.id,
        userId: users["Kabir Mehta"].id,
        action: "EXPENSE_CREATED",
        entityTitle: "Activa & Royal Enfield Rentals",
        details: "Added expense of ₹2,400.00 (Split equally between 4 people)",
        createdAt: new Date(Date.now() - 1 * 86400000),
      },
      {
        groupId: goaGroup.id,
        userId: users["Meera Iyer"].id,
        action: "PAYMENT_SETTLED",
        entityTitle: "Settled up ₹2,000.00",
        details: "Paid Aarav Sharma ₹2,000.00 via UPI",
        createdAt: new Date(Date.now() - 1 * 86400000),
      },
    ],
  });

  console.log("Database seeded successfully with UPI IDs and Invite Codes!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
