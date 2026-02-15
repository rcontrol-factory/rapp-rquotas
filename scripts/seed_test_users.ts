import pg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

const PASSWORD = "test1234";
const SALT_ROUNDS = 10;
const TARGET_COMPANY_NAME = "Mateus Santana Finish Carpentry";

interface TestUser {
  username: string;
  role: string;
  isGlobalAdmin: boolean;
  tradeSlug: string | null;
  specialtySlugs: string[];
}

const testUsers: TestUser[] = [
  { username: "admintest", role: "OWNER", isGlobalAdmin: false, tradeSlug: "carpentry", specialtySlugs: ["finish", "deck", "stairs", "doors", "windows", "baseboard"] },
  { username: "mateustest", role: "USER", isGlobalAdmin: false, tradeSlug: "carpentry", specialtySlugs: ["finish", "deck", "stairs", "doors", "windows", "baseboard"] },
  { username: "brothertest", role: "USER", isGlobalAdmin: false, tradeSlug: "carpentry", specialtySlugs: ["finish", "deck"] },
  { username: "painttest", role: "USER", isGlobalAdmin: false, tradeSlug: "painting", specialtySlugs: ["general"] },
  { username: "cleantest", role: "USER", isGlobalAdmin: false, tradeSlug: "house_cleaning", specialtySlugs: ["general"] },
];

const OLD_TEST_USERNAMES = [
  "admintest@test.com", "cleantest@test.com", "painttest@test.com",
  "carptest@test.com", "floortest@test.com", "frametest@test.com",
  "rooftest@test.com", "admin@test.com", "floor@test.com",
  "finish@test.com", "frame@test.com", "roof@test.com",
  "floorfinish@test.com", "frameroof@test.com", "carpadmin@test.com",
  "paint@test.com", "clean@test.com",
];

async function resolveCompanyId(): Promise<number> {
  const res = await pool.query("SELECT id FROM companies WHERE name = $1", [TARGET_COMPANY_NAME]);
  if (res.rows.length === 0) {
    throw new Error(`Company "${TARGET_COMPANY_NAME}" not found. Run the app once to seed default data.`);
  }
  return res.rows[0].id;
}

async function cleanupOldTestUsers() {
  let deleted = 0;
  for (const uname of OLD_TEST_USERNAMES) {
    const res = await pool.query("SELECT id FROM users WHERE username = $1", [uname]);
    if (res.rows.length > 0) {
      const uid = res.rows[0].id;
      await pool.query("DELETE FROM user_specialties WHERE user_id = $1", [uid]);
      await pool.query("DELETE FROM company_users WHERE user_id = $1", [uid]);
      await pool.query("DELETE FROM users WHERE id = $1", [uid]);
      deleted++;
      console.log(`   Deleted old test user: ${uname}`);
    }
  }
  return deleted;
}

async function seedTestUsers(companyId: number) {
  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
  let created = 0;
  let passwordUpdated = 0;
  const details: string[] = [];

  for (const tu of testUsers) {
    const existingRes = await pool.query("SELECT id FROM users WHERE username = $1", [tu.username]);
    let userId: number;

    if (existingRes.rows.length === 0) {
      const insertRes = await pool.query(
        "INSERT INTO users (username, password_hash, role, is_global_admin) VALUES ($1, $2, $3, $4) RETURNING id",
        [tu.username, passwordHash, tu.role, tu.isGlobalAdmin]
      );
      userId = insertRes.rows[0].id;
      created++;
      details.push(`${tu.username} (${tu.role}) CREATED`);
    } else {
      userId = existingRes.rows[0].id;
      await pool.query(
        "UPDATE users SET password_hash = $1, role = $2, is_global_admin = $3 WHERE id = $4",
        [passwordHash, tu.role, tu.isGlobalAdmin, userId]
      );
      passwordUpdated++;
      details.push(`${tu.username} (${tu.role}) PASSWORD UPDATED`);
    }

    const cuRes = await pool.query(
      "SELECT id, role FROM company_users WHERE company_id = $1 AND user_id = $2",
      [companyId, userId]
    );
    if (cuRes.rows.length === 0) {
      await pool.query(
        "INSERT INTO company_users (company_id, user_id, role, is_active) VALUES ($1, $2, $3, true)",
        [companyId, userId, tu.role]
      );
      details.push(`  -> added to company ${companyId}`);
    } else if (cuRes.rows[0].role !== tu.role) {
      await pool.query(
        "UPDATE company_users SET role = $1 WHERE company_id = $2 AND user_id = $3",
        [tu.role, companyId, userId]
      );
      details.push(`  -> company role updated to ${tu.role}`);
    }

    if (tu.specialtySlugs.length === 0) continue;

    let tradeId: number | null = null;
    if (tu.tradeSlug) {
      const tradeRes = await pool.query("SELECT id FROM trades WHERE slug = $1", [tu.tradeSlug]);
      tradeId = tradeRes.rows.length > 0 ? tradeRes.rows[0].id : null;
    }

    for (const specSlug of tu.specialtySlugs) {
      let specQuery = "SELECT id FROM specialties WHERE slug = $1";
      const specParams: any[] = [specSlug];
      if (tradeId) {
        specQuery += " AND trade_id = $2";
        specParams.push(tradeId);
      }
      const specRes = await pool.query(specQuery, specParams);
      if (specRes.rows.length === 0) {
        details.push(`  -> WARNING: specialty ${specSlug} not found, skipped`);
        continue;
      }
      const specialtyId = specRes.rows[0].id;

      const usRes = await pool.query(
        "SELECT user_id FROM user_specialties WHERE user_id = $1 AND specialty_id = $2 AND company_id = $3",
        [userId, specialtyId, companyId]
      );
      if (usRes.rows.length === 0) {
        await pool.query(
          "INSERT INTO user_specialties (user_id, specialty_id, company_id) VALUES ($1, $2, $3)",
          [userId, specialtyId, companyId]
        );
        details.push(`  -> specialty ${specSlug} ASSIGNED`);
      } else {
        details.push(`  -> specialty ${specSlug} ok`);
      }
    }
  }

  return { created, passwordUpdated, details };
}

async function main() {
  try {
    console.log("=== Seed Test Users ===\n");

    console.log("0) Resolving company...");
    const companyId = await resolveCompanyId();
    console.log(`   Company: "${TARGET_COMPANY_NAME}" (id=${companyId})\n`);

    console.log("1) Cleaning up old email-based test users...");
    const deleted = await cleanupOldTestUsers();
    console.log(`   Deleted ${deleted} old test users\n`);

    console.log("2) Creating/updating test users...");
    const { created, passwordUpdated, details } = await seedTestUsers(companyId);
    details.forEach((d) => console.log(`   ${d}`));

    console.log(`\n=== Summary ===`);
    console.log(`Created: ${created}`);
    console.log(`Password updated: ${passwordUpdated}`);
    console.log(`Old users cleaned up: ${deleted}`);
    console.log(`Password for ALL: ${PASSWORD}`);

    console.log("\n3) Verification...");
    const countRes = await pool.query(
      `SELECT u.username, u.role, u.is_global_admin, array_agg(s.name ORDER BY s.name) as specialties 
       FROM users u 
       LEFT JOIN user_specialties us ON us.user_id = u.id AND us.company_id = $1 
       LEFT JOIN specialties s ON s.id = us.specialty_id 
       WHERE u.username LIKE '%test' 
       GROUP BY u.id, u.username, u.role, u.is_global_admin 
       ORDER BY u.username`,
      [companyId]
    );
    console.log("\nTest users in database:");
    for (const row of countRes.rows) {
      const specs = row.specialties.filter((s: any) => s !== null);
      const globalTag = row.is_global_admin ? " [GLOBAL ADMIN]" : "";
      console.log(`  ${row.username} (${row.role}${globalTag}) -> ${specs.length > 0 ? specs.join(", ") : "no specialties"}`);
    }
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
