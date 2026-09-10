/**
 * Add an existing Supabase Auth user to the `public.admins` allow-list.
 *
 *   node --env-file=.env.local scripts/grant-admin.mjs you@example.com
 *   node --env-file=.env       scripts/grant-admin.mjs you@example.com "founder"
 *
 * This does NOT create the auth user and NEVER handles a password — create the
 * user first (Supabase dashboard → Authentication → Users → Add user, or
 * `supabase auth admin create-user`). Passwords are hashed by Supabase Auth.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the
 * environment (loaded via `--env-file`). The service-role key is used only to
 * look the user up and insert one row; it is never printed.
 */
import { createClient } from "@supabase/supabase-js";

const email = (process.argv[2] || "").trim().toLowerCase();
const note = (process.argv[3] || "granted via scripts/grant-admin.mjs").trim();

if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/grant-admin.mjs <email> [note]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. " +
      "Pass them with:  node --env-file=.env.local scripts/grant-admin.mjs <email>",
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Find the auth user by email (paginate defensively for small projects).
let user;
for (let page = 1; page <= 20 && !user; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error(`Could not list auth users: ${error.message}`);
    process.exit(1);
  }
  user = data.users.find((u) => (u.email || "").toLowerCase() === email);
  if (data.users.length < 200) break;
}

if (!user) {
  console.error(
    `No auth user with email "${email}". Create it first (dashboard → Authentication → Users → Add user), then re-run.`,
  );
  process.exit(1);
}

const { error } = await db
  .from("admins")
  .upsert({ user_id: user.id, note }, { onConflict: "user_id" });

if (error) {
  console.error(`Failed to add to public.admins: ${error.message}`);
  process.exit(1);
}

console.log(`OK — ${email} (${user.id}) is now an admin. Visit /admin/login.`);
