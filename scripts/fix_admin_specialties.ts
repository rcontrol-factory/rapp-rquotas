import { db } from "../server/db";
import { users, specialties, userSpecialties, companyUsers, trades } from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";

async function fixAdminSpecialties() {
  console.log("=== Fix Admin Specialties ===\n");

  const adminUser = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.username, "admin"))
    .then((r) => r[0]);

  if (!adminUser) {
    console.error("Admin user not found");
    process.exit(1);
  }

  const companyLink = await db
    .select({ companyId: companyUsers.companyId, role: companyUsers.role })
    .from(companyUsers)
    .where(eq(companyUsers.userId, adminUser.id))
    .then((r) => r[0]);

  if (!companyLink) {
    console.error("Admin has no company association");
    process.exit(1);
  }

  console.log(`Found admin: id=${adminUser.id}, company=${companyLink.companyId}, role=${companyLink.role}`);

  const carpentryTrade = await db
    .select({ id: trades.id })
    .from(trades)
    .where(eq(trades.slug, "carpentry"))
    .then((r) => r[0]);

  if (!carpentryTrade) {
    console.error("Carpentry trade not found");
    process.exit(1);
  }

  const requiredSlugs = ["framing", "roofing"];

  for (const slug of requiredSlugs) {
    let spec = await db
      .select({ id: specialties.id, name: specialties.name })
      .from(specialties)
      .where(and(eq(specialties.slug, slug), eq(specialties.tradeId, carpentryTrade.id)))
      .then((r) => r[0]);

    if (!spec) {
      const name = slug.charAt(0).toUpperCase() + slug.slice(1);
      const inserted = await db
        .insert(specialties)
        .values({ tradeId: carpentryTrade.id, slug, name })
        .returning({ id: specialties.id, name: specialties.name });
      spec = inserted[0];
      console.log(`Created specialty: ${spec.name} (id=${spec.id})`);
    }

    await db
      .insert(userSpecialties)
      .values({
        userId: adminUser.id,
        specialtyId: spec.id,
        companyId: companyLink.companyId,
      })
      .onConflictDoNothing();

    console.log(`Ensured admin has specialty: ${spec.name} (id=${spec.id})`);
  }

  const final = await db
    .select({
      username: users.username,
      specialtySlug: specialties.slug,
      specialtyName: specialties.name,
    })
    .from(userSpecialties)
    .innerJoin(users, eq(users.id, userSpecialties.userId))
    .innerJoin(specialties, eq(specialties.id, userSpecialties.specialtyId))
    .where(eq(userSpecialties.userId, adminUser.id))
    .orderBy(specialties.id);

  console.log("\n=== Admin specialties after fix ===");
  for (const row of final) {
    console.log(`  ${row.specialtyName} (${row.specialtySlug})`);
  }

  console.log("\nDone!");
  process.exit(0);
}

fixAdminSpecialties().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
