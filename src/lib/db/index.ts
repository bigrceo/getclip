import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null | undefined;
/** null when DATABASE_URL is unset: the site then runs on demo data. */
export function db() {
  if (_db !== undefined) return _db;
  const url = process.env.DATABASE_URL;
  _db = url ? drizzle(neon(url), { schema }) : null;
  return _db;
}
export { schema };
