import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: { email: "owner@example.com", passwordHash: "dev-only" }
  });

  const organization = await prisma.organization.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: {},
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Demo Workspace",
      members: {
        create: {
          userId: user.id,
          role: "OWNER"
        }
      },
      subscription: {
        create: {
          planCode: "free",
          status: "active"
        }
      }
    }
  });

  console.log("Seeded organization:", organization.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
