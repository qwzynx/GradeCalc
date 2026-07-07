import { NextResponse } from "next/server";
import {
  SyncError,
  IncomingCourse,
  runSyncWithSession,
} from "@/lib/eclass";
import { loginAndGetSession } from "@/lib/eclass-login";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";

// The login action launches a headless browser and triggers a real Duo push
// against Passport York, so it's the most abuse-sensitive path. Cap it per user.
const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_WINDOW_MS = 60_000;

// The credential login flow runs Passport York + Duo + the full scrape inside
// one streaming request, so it needs headroom for the user to pick up their
// phone. On Vercel this requires Fluid Compute (on by default) — without it,
// Hobby caps invocations at 60s.
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req);
    if (!user) return unauthorized();

    const body = await req.json();
    const action: string = body.action || (body.session ? "manual" : "");

    // Credential login: the user's Passport York credentials drive a headless
    // browser on the server, Duo progress streams back as NDJSON events, and
    // the sync plan arrives on the same response. Everything happens in ONE
    // request so it works identically on a local server and on Vercel (which
    // gives no reliable way to keep a browser alive across invocations).
    if (action === "login") {
      const { allowed, retryAfterSeconds } = rateLimit(
        `eclass-login:${user.id}`,
        LOGIN_RATE_LIMIT,
        LOGIN_RATE_WINDOW_MS
      );
      if (!allowed) {
        return NextResponse.json(
          {
            error: `Too many login attempts. Please wait ${retryAfterSeconds}s and try again.`,
          },
          { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
        );
      }

      const username: string = (body.username || "").trim();
      const password: string = body.password || "";
      const appCourses: IncomingCourse[] = body.courses || [];
      if (!username || !password) {
        return NextResponse.json(
          { error: "Missing Passport York username or password" },
          { status: 400 }
        );
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const send = (event: object) => {
            try {
              controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            } catch {
              // client went away mid-stream — nothing to do
            }
          };
          try {
            const { session, userAgent } = await loginAndGetSession(
              username,
              password,
              send,
              req.signal
            );
            send({ type: "status", stage: "scraping" });
            const plan = await runSyncWithSession(session, appCourses, userAgent);
            send({ type: "done", plan });
          } catch (error: any) {
            console.error("eClass login sync error:", error);
            send({ type: "error", error: error?.message || "eClass login failed" });
          }
          try {
            controller.close();
          } catch {}
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
        },
      });
    }

    if (action === "manual") {
      const rawSession: string = (body.session || "").trim();
      const appCourses: IncomingCourse[] = body.courses || [];
      if (!rawSession) {
        return NextResponse.json({ error: "Missing eClass session cookie" }, { status: 400 });
      }

      // Accept "abc123", "MoodleSession=abc123" or a full pasted cookie header
      const session =
        rawSession.match(/MoodleSession=([^;\s]+)/)?.[1] ??
        (rawSession.includes("=") ? rawSession.split("=").pop()!.trim() : rawSession);

      const plan = await runSyncWithSession(session, appCourses);
      return NextResponse.json({ plan });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("eClass sync error:", error);
    const status = error instanceof SyncError ? error.status : 500;
    return NextResponse.json(
      { error: error.message || "Failed to sync with eClass" },
      { status }
    );
  }
}
