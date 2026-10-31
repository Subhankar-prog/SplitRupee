import { prisma } from "../lib/prisma";

async function main() {
  const args = process.argv.slice(2);
  const isRevoke = args.includes("--revoke");
  const query = args.find((arg) => !arg.startsWith("--"));

  if (!query) {
    console.log("--------------------------------------------------");
    console.log("SplitRupee Pro Access Manager");
    console.log("--------------------------------------------------");
    console.log("Grant Pro:  npm run pro <email | phone | name>");
    console.log("Revoke Pro: npm run pro <email | phone | name> --revoke");
    console.log("--------------------------------------------------");
    process.exit(1);
  }

  const cleanQuery = query.trim();
  const cleanPhone = cleanQuery.replace(/\D/g, "").slice(-10);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: cleanQuery, mode: "insensitive" } },
        ...(cleanPhone.length === 10 ? [{ phone: cleanPhone }] : []),
        { name: { equals: cleanQuery, mode: "insensitive" } },
      ],
    },
  });

  if (!user) {
    console.error(`\n❌ No user found matching "${cleanQuery}"`);
    console.log("Please check the email address, 10-digit mobile number, or full name.");
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isPro: !isRevoke },
  });

  console.log("--------------------------------------------------");
  if (!isRevoke) {
    console.log(`🎉 Pro Access Successfully GRANTED!`);
  } else {
    console.log(`ℹ️ Pro Access REVOKED.`);
  }
  console.log(`👤 Name:   ${updated.name}`);
  console.log(`📧 Email:  ${updated.email}`);
  console.log(`📱 Phone:  ${updated.phone || "Not set"}`);
  console.log(`⭐ Status: ${updated.isPro ? "PRO ACTIVE (isPro: true)" : "STANDARD (isPro: false)"}`);
  console.log("--------------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

