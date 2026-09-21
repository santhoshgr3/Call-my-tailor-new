// Loads the home-visit service catalogue (from the old booking app) into the database.
// Safe to re-run: existing rows are matched by legacyId and left as the admin edited them.
import { PrismaClient } from "@prisma/client";
import services from "./booking-services.json";

const db = new PrismaClient();

async function main() {
  let created = 0;
  for (const s of services) {
    const exists = await db.serviceItem.findUnique({ where: { legacyId: s.legacyId } });
    if (exists) continue;
    await db.serviceItem.create({ data: s });
    created++;
  }
  console.log(`services created: ${created}, total: ${await db.serviceItem.count()}`);
}

main().finally(() => db.$disconnect());
