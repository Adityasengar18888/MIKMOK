import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user (you'll need to match this clerkId to your Clerk account)
  const admin = await prisma.user.upsert({
    where: { email: "admin@mikmok.app" },
    update: {},
    create: {
      clerkId: "admin_clerk_id_placeholder",
      username: "admin",
      email: "admin@mikmok.app",
      name: "MikMok Admin",
      bio: "Official MikMok admin account",
      role: "admin",
    },
  });

  console.log("✅ Admin user created:", admin.username);

  // Create sample users
  const users = await Promise.all(
    [
      {
        clerkId: "demo_user_1",
        username: "creative_sarah",
        email: "sarah@demo.com",
        name: "Sarah Creative",
        bio: "🎨 Digital artist & content creator",
      },
      {
        clerkId: "demo_user_2",
        username: "tech_mike",
        email: "mike@demo.com",
        name: "Mike Tech",
        bio: "💻 Tech reviews & tutorials",
      },
      {
        clerkId: "demo_user_3",
        username: "foodie_anna",
        email: "anna@demo.com",
        name: "Anna Foodie",
        bio: "🍜 Food adventures around the world",
      },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: u,
      })
    )
  );

  console.log(`✅ ${users.length} demo users created`);
  console.log("🌱 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
