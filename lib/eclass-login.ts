import type { Browser, Page } from "playwright-core";
import { ECLASS_BASE, SyncError } from "./eclass";

const LOGIN_TIMEOUT_MS = 3 * 60 * 1000; // Duo approval on a phone takes a while
const NAV_TIMEOUT_MS = 60 * 1000;

// A fixed, ordinary desktop UA: @sparticuz/chromium identifies itself as
// "HeadlessChrome", which SSO providers sometimes treat as a bot. Using an
// explicit UA also lets the scraper reuse the exact string the login used.
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

export type LoginEvent =
  | { type: "status"; stage: "opening" | "logging_in" | "duo_wait" | "scraping" }
  | { type: "duo_code"; code: string };

// Vercel functions have no display and no Playwright browser download, so the
// headful popup flow can never run there — instead drive @sparticuz/chromium's
// serverless-compatible binary with playwright-core, fully headless. Locally
// (dev / self-hosted) reuse the regular playwright install.
// Duo's Universal Prompt runs an automation/browser check that trips on the
// `navigator.webdriver` flag Chromium sets under automation; failing it aborts
// the prompt with "Something went wrong" (browser_check_failed). Disabling the
// AutomationControlled blink feature clears that flag so the check can pass.
const ANTI_AUTOMATION_ARGS = ["--disable-blink-features=AutomationControlled"];

async function launchHeadless(): Promise<Browser> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const sparticuz = (await import("@sparticuz/chromium")).default;
    const { chromium } = await import("playwright-core");
    return chromium.launch({
      args: [...sparticuz.args, ...ANTI_AUTOMATION_ARGS],
      executablePath: await sparticuz.executablePath(),
      headless: true,
    });
  }
  const { chromium } = await import("playwright");
  return chromium.launch({ headless: true, args: ANTI_AUTOMATION_ARGS });
}

interface DuoState {
  lastCode: string | null;
  pushClicked: boolean;
}

// Duo's Universal Prompt normally auto-sends a push, may display a
// verification code the user has to tap in Duo Mobile, and can end on an
// "Is this your device?" interstitial. All of it can live in the main page or
// an iframe depending on the IdP config, so scan every frame. Frames navigate
// underneath us constantly — every step is best-effort.
async function pumpDuoPrompt(
  page: Page,
  state: DuoState,
  onEvent: (event: LoginEvent) => void
) {
  for (const frame of page.frames()) {
    try {
      // The Universal Prompt (React app at duosecurity.com) shows the verified-
      // push code in `<span class="code-text">`; the legacy iframe prompt used
      // `.verification-code`. Try both so either experience surfaces the code.
      const codeEl = frame.locator(".code-text, .verification-code");
      if ((await codeEl.count()) > 0) {
        const code = ((await codeEl.first().innerText()) || "")
          .replace(/\s+/g, "")
          .trim();
        if (code && code !== state.lastCode) {
          state.lastCode = code;
          onEvent({ type: "duo_code", code });
        }
      }

      // The Universal Prompt auto-sends a verified push; only the legacy prompt
      // needs Duo Push chosen explicitly. Click at most once — re-clicking every
      // poll would spam the user's phone.
      if (!state.pushClicked) {
        const push = frame.locator(
          'button:has-text("Send Me a Push"), button:has-text("Duo Push")'
        );
        if ((await push.count()) > 0 && (await push.first().isVisible())) {
          await push.first().click({ timeout: 2000 });
          state.pushClicked = true;
        }
      }

      // After the push is approved, Duo asks whether to remember this browser;
      // login only completes once that's answered. Prefer "No" so this
      // throwaway server-side browser is never registered as a trusted device
      // on the user's Duo account. Fall back to any button that dismisses the
      // screen (Universal Prompt "Yes" or the legacy prompt's ids) so login
      // still completes if the "No" label ever changes.
      const declineTrust = frame.locator(
        'button:has-text("No, other people use this device"), #dont-trust-browser-button'
      );
      const anyTrust = frame.locator(
        'button:has-text("Yes, this is my device"), #trust-browser-button'
      );
      const trust =
        (await declineTrust.count()) > 0 ? declineTrust : anyTrust;
      if ((await trust.count()) > 0 && (await trust.first().isVisible())) {
        await trust.first().click({ timeout: 2000 });
      }
    } catch {
      // frame detached / navigated mid-poll — next iteration retries
    }
  }
}

// Signs into eClass via Passport York + Duo in a headless browser using the
// user's credentials, and returns the resulting MoodleSession cookie. Progress
// (including the Duo verification code the user must tap on their phone) is
// reported through onEvent so the client UI can mirror what's happening in the
// invisible browser.
export async function loginAndGetSession(
  username: string,
  password: string,
  onEvent: (event: LoginEvent) => void,
  signal?: AbortSignal
): Promise<{ session: string; userAgent: string }> {
  onEvent({ type: "status", stage: "opening" });
  const browser = await launchHeadless();
  const onAbort = () => browser.close().catch(() => {});
  signal?.addEventListener("abort", onAbort);

  try {
    const context = await browser.newContext({ userAgent: BROWSER_UA });
    const page = await context.newPage();
    page.setDefaultTimeout(NAV_TIMEOUT_MS);
    await page.goto(`${ECLASS_BASE}/my/`, { waitUntil: "domcontentloaded" });

    // eClass redirects to the Passport York form; some variants show an
    // interstitial login page with a "Passport York" link first.
    const passwordField = page.locator('input[type="password"]').first();
    try {
      await passwordField.waitFor({ state: "visible", timeout: 20_000 });
    } catch {
      await page
        .locator('a[href*="passportyork" i], a:has-text("Passport York")')
        .first()
        .click({ timeout: 10_000 });
      await passwordField.waitFor({ state: "visible", timeout: 20_000 });
    }

    onEvent({ type: "status", stage: "logging_in" });
    // Passport York names its username field "mli"; fall back to the form's
    // first text input in case that ever changes.
    const userField = page
      .locator('input[name="mli"], form input[type="text"], form input[type="email"]')
      .first();
    await userField.fill(username);
    await passwordField.fill(password);
    await passwordField.press("Enter");

    let duoAnnounced = false;
    const duoState: DuoState = { lastCode: null, pushClicked: false };
    const deadline = Date.now() + LOGIN_TIMEOUT_MS;

    while (Date.now() < deadline) {
      if (signal?.aborted) throw new SyncError("Sync cancelled.", 499);

      const url = page.url();

      // Landed back on eClass anywhere outside the login flow: signed in.
      if (url.includes("eclass.yorku.ca") && !url.includes("/login")) {
        const cookies = await context.cookies(ECLASS_BASE);
        const session = cookies.find((c) => c.name === "MoodleSession")?.value;
        if (!session) {
          throw new SyncError(
            "Logged in, but could not read the eClass session cookie."
          );
        }
        return { session, userAgent: BROWSER_UA };
      }

      // Still (or again) on Passport York with an error message: bad password.
      if (url.includes("passportyork.yorku.ca")) {
        const bodyText =
          (await page.locator("body").innerText().catch(() => "")) || "";
        if (
          /could not be authenticated|authentication (has )?failed|invalid (username|login|password)|incorrect (username|password)/i.test(
            bodyText
          )
        ) {
          throw new SyncError(
            "Passport York rejected that username or password. Double-check them and try again.",
            401
          );
        }
      }

      const onDuo =
        url.includes("duosecurity.com") ||
        page.frames().some((f) => f.url().includes("duosecurity.com"));
      if (onDuo) {
        if (!duoAnnounced) {
          duoAnnounced = true;
          onEvent({ type: "status", stage: "duo_wait" });
        }
        await pumpDuoPrompt(page, duoState, onEvent);
      }

      await page.waitForTimeout(1000).catch(() => {});
    }

    throw new SyncError(
      "Timed out waiting for the Duo approval. Please try again.",
      408
    );
  } catch (error) {
    if (signal?.aborted) throw new SyncError("Sync cancelled.", 499);
    if (error instanceof SyncError) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    throw new SyncError(
      /Target (page|closed)|has been closed/i.test(msg)
        ? "The login session closed unexpectedly. Please try again."
        : msg || "eClass login failed",
      502
    );
  } finally {
    signal?.removeEventListener("abort", onAbort);
    await browser.close().catch(() => {});
  }
}
