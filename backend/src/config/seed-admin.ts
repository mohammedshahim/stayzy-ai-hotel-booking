import { eq } from "drizzle-orm";
import { admin_user } from "../models/admin-auth.schema";
import { authAdmin } from "./auth-admin";
import { db, pool } from "./db";
import { env } from "./env";

async function seedAdmin(): Promise<void> {
  if (!env.ADMIN_SEED_EMAIL || !env.ADMIN_SEED_PASSWORD) {
    throw new Error("ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set to seed the initial admin account");
  }

  const [existing] = await db
    .select({ id: admin_user.id })
    .from(admin_user)
    .where(eq(admin_user.email, env.ADMIN_SEED_EMAIL));

  if (existing) {
    console.log(`[seed-admin] admin account already exists for ${env.ADMIN_SEED_EMAIL}, skipping`);
    return;
  }

  await authAdmin.api.signUpEmail({
    body: {
      email: env.ADMIN_SEED_EMAIL,
      password: env.ADMIN_SEED_PASSWORD,
      name: "Admin",
    },
  });

  console.log(`[seed-admin] created initial admin account for ${env.ADMIN_SEED_EMAIL}`);
}

seedAdmin()
  .then(() => pool.end())
  .catch(async (error) => {
    console.error("[seed-admin] error", error);
    await pool.end();
    process.exit(1);
  });
