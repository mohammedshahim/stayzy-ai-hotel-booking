import { db } from "./db";
import { env } from "./env";
import { authAdmin } from "./auth-admin";

async function seedAdmin(): Promise<void> {
  if (!env.ADMIN_SEED_EMAIL || !env.ADMIN_SEED_PASSWORD) {
    throw new Error("ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set to seed the initial admin account");
  }

  const { rows } = await db.query<{ id: string }>('SELECT id FROM admin_user WHERE email = $1', [
    env.ADMIN_SEED_EMAIL,
  ]);

  if (rows.length > 0) {
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
  .then(() => db.end())
  .catch(async (error) => {
    console.error("[seed-admin] error", error);
    await db.end();
    process.exit(1);
  });
