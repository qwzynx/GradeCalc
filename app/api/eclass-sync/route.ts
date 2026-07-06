import { NextResponse } from "next/server";
import type { Browser } from "playwright";
import { EclassSyncPlan } from "../../types";
import {
  ECLASS_BASE,
  SyncError,
  IncomingCourse,
  runSyncWithSession,
} from "@/lib/eclass";

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000; // Passport York + Duo can take a while

// Scraping now also looks up and Gemini-parses each course's syllabus file,
// so the manual (no-popup) path needs more headroom than a plain grade fetch.
export const maxDuration = 120;

// ---------------------------------------------------------------------------
// Popup login jobs — the server launches a visible Chromium window on this
// machine, the user completes Passport York + Duo in it, then we scrape.
// Stored on globalThis so dev-mode HMR reloads don't orphan running jobs.
// ---------------------------------------------------------------------------

interface SyncJob {
  status: "waiting_login" | "scraping" | "done" | "error";
  plan?: EclassSyncPlan;
  error?: string;
  browser?: Browser;
  createdAt: number;
}

const jobs: Map<string, SyncJob> =
  ((globalThis as any).__eclassSyncJobs ??= new Map());

function cleanupStaleJobs() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > 15 * 60 * 1000) {
      job.browser?.close().catch(() => {});
      jobs.delete(id);
    }
  }
}

async function runLoginAndSync(jobId: string, appCourses: IncomingCourse[]) {
  const job = jobs.get(jobId);
  if (!job) return;
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: false });
    job.browser = browser;

    const context = await browser.newContext({ viewport: null });
    const page = await context.newPage();
    await page.goto(`${ECLASS_BASE}/my/`, { waitUntil: "domcontentloaded" });

    // Wait until the SSO round-trip (Passport York -> Duo -> eClass) lands the
    // user back on any eClass page that isn't the login flow
    await page.waitForURL(
      (url) =>
        url.hostname === "eclass.yorku.ca" && !url.pathname.startsWith("/login"),
      { timeout: LOGIN_TIMEOUT_MS }
    );

    const userAgent = await page.evaluate(() => navigator.userAgent);
    const cookies = await context.cookies(ECLASS_BASE);
    const session = cookies.find((c) => c.name === "MoodleSession")?.value;

    await browser.close();
    job.browser = undefined;

    if (!session) {
      throw new SyncError("Logged in, but could not read the eClass session cookie.");
    }

    job.status = "scraping";
    job.plan = await runSyncWithSession(session, appCourses, userAgent);
    job.status = "done";
  } catch (error: any) {
    const msg: string = error?.message || "";
    job.error =
      /Target (page|closed)|has been closed|browser has been closed/i.test(msg)
        ? "The login window was closed before signing in finished."
        : /Timeout.*exceeded/i.test(msg)
        ? "Timed out waiting for you to log into eClass. Please try again."
        : msg || "eClass login failed";
    job.status = "error";
    job.browser?.close().catch(() => {});
    job.browser = undefined;
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action: string = body.action || (body.session ? "manual" : "");
    cleanupStaleJobs();

    if (action === "start") {
      if (process.env.VERCEL) {
        return NextResponse.json(
          { error: "Popup login isn't available on this deployment. Use the manual cookie option instead." },
          { status: 400 }
        );
      }
      const appCourses: IncomingCourse[] = body.courses || [];

      const syncId = crypto.randomUUID();
      jobs.set(syncId, { status: "waiting_login", createdAt: Date.now() });
      // Fire and forget — the client polls with action: "status"
      runLoginAndSync(syncId, appCourses);
      return NextResponse.json({ syncId });
    }

    if (action === "status") {
      const job = jobs.get(body.syncId);
      if (!job) {
        return NextResponse.json({ error: "Sync session not found or expired." }, { status: 404 });
      }
      if (job.status === "done") {
        jobs.delete(body.syncId);
        return NextResponse.json({ status: "done", plan: job.plan });
      }
      if (job.status === "error") {
        jobs.delete(body.syncId);
        return NextResponse.json({ status: "error", error: job.error });
      }
      return NextResponse.json({ status: job.status });
    }

    if (action === "cancel") {
      const job = jobs.get(body.syncId);
      job?.browser?.close().catch(() => {});
      jobs.delete(body.syncId);
      return NextResponse.json({ ok: true });
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
