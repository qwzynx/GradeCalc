import { createClient, type User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// A dedicated, stateless client for verifying request tokens on the server.
// It never persists or refreshes a session — each call just validates the JWT
// the client sent in its Authorization header.
const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Verify the Supabase access token on an incoming API request.
 *
 * The client sends its session token as `Authorization: Bearer <jwt>`; we ask
 * Supabase to validate it and return the authenticated user. Returns `null`
 * when the header is missing or the token is invalid/expired.
 */
export async function getRequestUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/** Standard 401 response for unauthenticated API requests. */
export function unauthorized() {
  return NextResponse.json(
    { error: "You must be signed in to do that." },
    { status: 401 }
  );
}
