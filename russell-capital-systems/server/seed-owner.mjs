/**
 * Seed script: Create or update the owner account
 * samtheinsuranceman@gmail.com with password Mike1248(?) as admin
 *
 * Usage: node server/seed-owner.mjs
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const OWNER_EMAIL = "samtheinsuranceman@gmail.com";
const OWNER_PASSWORD = "Mike1248(?)";
const OWNER_NAME = "Sam Russell";
const OWNER_FIRST_NAME = "Sam";
const OWNER_LAST_NAME = "Russell";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const connection = await mysql.createConnection(dbUrl);
  console.log("[Seed] Connected to database");

  // Hash the password
  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 12);
  console.log("[Seed] Password hashed");

  // Check if user already exists
  const [rows] = await connection.execute(
    "SELECT id, openId, role, passwordHash FROM users WHERE email = ?",
    [OWNER_EMAIL]
  );

  if (rows.length > 0) {
    const user = rows[0];
    console.log(`[Seed] Found existing user id=${user.id}, openId=${user.openId}, role=${user.role}`);
    // Update password hash and ensure admin role
    await connection.execute(
      "UPDATE users SET passwordHash = ?, role = 'admin', name = ?, firstName = ?, lastName = ?, loginMethod = 'email' WHERE id = ?",
      [passwordHash, OWNER_NAME, OWNER_FIRST_NAME, OWNER_LAST_NAME, user.id]
    );
    console.log(`[Seed] Updated user id=${user.id} with new password hash and admin role`);
  } else {
    // Create new user with a local openId
    const openId = `local_owner_${Date.now()}`;
    await connection.execute(
      `INSERT INTO users (openId, email, name, firstName, lastName, passwordHash, role, loginMethod, lastSignedIn, createdAt, updatedAt, onboardingCompleted)
       VALUES (?, ?, ?, ?, ?, ?, 'admin', 'email', NOW(), NOW(), NOW(), true)`,
      [openId, OWNER_EMAIL, OWNER_NAME, OWNER_FIRST_NAME, OWNER_LAST_NAME, passwordHash]
    );
    console.log(`[Seed] Created new owner user with openId=${openId}`);
  }

  await connection.end();
  console.log("[Seed] Done! You can now log in with:");
  console.log(`  Email: ${OWNER_EMAIL}`);
  console.log(`  Password: ${OWNER_PASSWORD}`);
}

main().catch(err => {
  console.error("[Seed] Error:", err);
  process.exit(1);
});
