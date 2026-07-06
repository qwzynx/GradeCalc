import { GoogleGenerativeAI } from "@google/generative-ai";
import { EclassSyncPlan, EclassPlanCourse, EclassPlanItem } from "../app/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const ECLASS_BASE = "https://eclass.yorku.ca";
export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0";

export class SyncError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export interface IncomingAssignment {
  id: string;
  name: string;
  weight: number | null;
  mark: number | null;
  eclass_item_name: string | null;
}

export interface IncomingCourse {
  id: string;
  name: string;
  semester: string;
  year: number;
  assignments: IncomingAssignment[];
}

export async function fetchPage(path: string, session: string, userAgent: string) {
  const res = await fetch(`${ECLASS_BASE}${path}`, {
    headers: {
      Cookie: `MoodleSession=${session}`,
      "User-Agent": userAgent,
    },
    redirect: "follow",
    cache: "no-store",
  });
  const html = await res.text();
  return { html, url: res.url };
}

export function isLoginPage(html: string, url: string) {
  return (
    url.includes("/login") ||
    /Passport York|id="loginform"|You are not logged in/i.test(html)
  );
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function stripTags(s: string) {
  return decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

// The dashboard/my-courses pages render their course lists with JavaScript, so
// plain fetches see no links. Enumerate courses the way the dashboard does:
// Moodle's AJAX API, authenticated by the sesskey embedded in any page's HTML.
export async function fetchEnrolledCourses(
  session: string,
  userAgent: string,
  sesskey: string
): Promise<{ id: string; name: string }[]> {
  const methodname = "core_course_get_enrolled_courses_by_timeline_classification";
  try {
    const res = await fetch(
      `${ECLASS_BASE}/lib/ajax/service.php?sesskey=${encodeURIComponent(sesskey)}&info=${methodname}`,
      {
        method: "POST",
        headers: {
          Cookie: `MoodleSession=${session}`,
          "User-Agent": userAgent,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            index: 0,
            methodname,
            args: {
              offset: 0,
              limit: 0,
              classification: "all",
              sort: "fullname",
              customfieldname: "",
              customfieldvalue: "",
            },
          },
        ]),
        cache: "no-store",
      }
    );
    const json = await res.json();
    if (!Array.isArray(json) || json[0]?.error) return [];
    return (json[0].data?.courses || [])
      .map((c: any) => ({
        id: String(c.id),
        name: stripTags(String(c.fullname || c.shortname || "")),
      }))
      .filter((c: { id: string; name: string }) => c.id && c.name);
  } catch {
    return [];
  }
}

// Course-code tokens like "eecs2200" from an app course name, used to scrape
// only the eClass courses that could plausibly match
export function courseCodeTokens(name: string): string[] {
  const tokens: string[] = [];
  const re = /([a-zA-Z]{2,6})\s*\/?\s*(\d{3,4})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(name)) !== null) tokens.push((m[1] + m[2]).toLowerCase());
  return tokens;
}

export function filterRelevantCourses(
  eclassCourses: { id: string; name: string }[],
  appCourseNames: string[]
): { id: string; name: string }[] {
  const tokens = appCourseNames.flatMap(courseCodeTokens);
  if (tokens.length === 0) return eclassCourses;
  const relevant = eclassCourses.filter((c) => {
    const norm = c.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return tokens.some((t) => norm.includes(t));
  });
  return relevant.length > 0 ? relevant : eclassCourses;
}

// Finds enrolled courses via grade-report or course-view links on a page
export function extractCourseLinks(html: string): { id: string; name: string }[] {
  const found = new Map<string, string>();
  const linkRegex =
    /<a[^>]*href="[^"]*(?:grade\/report\/user\/index\.php|course\/view\.php)\?id=(\d+)[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(html)) !== null) {
    const id = m[1];
    const name = stripTags(m[2]);
    if (id === "1" || !name) continue; // skip site home / empty anchors
    if (!found.has(id)) found.set(id, name);
  }
  return Array.from(found, ([id, name]) => ({ id, name }));
}

// Extracts the user grade report table from a Moodle grade page
export function extractGradeTable(html: string): string | null {
  const idx = html.indexOf("user-grade");
  if (idx === -1) return null;
  const start = html.lastIndexOf("<table", idx);
  const end = html.indexOf("</table>", idx);
  if (start === -1 || end === -1 || end < start) return null;
  return html.slice(start, end + "</table>".length);
}

// Strip attributes/scripts so the table costs fewer tokens but keeps structure
export function sanitizeTable(tableHtml: string): string {
  return decodeEntities(
    tableHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<img[^>]*>/gi, "")
      .replace(/<(\/?)([a-zA-Z0-9]+)[^>]*>/g, "<$1$2>")
  )
    .replace(/\s+/g, " ")
    .slice(0, 60000);
}

export function buildPrompt(
  appCourses: IncomingCourse[],
  eclassCourses: { eclass_course_id: string; name: string; grade_table_html: string | null }[]
) {
  return `You are the sync engine for a university grade tracker app. The app's courses and assignments were originally imported from course syllabi. Below you get (1) the app's current data and (2) grade report tables scraped from York University's eClass (Moodle).

APP COURSES (source of truth for weights, from the syllabus):
${JSON.stringify(appCourses, null, 1)}

ECLASS GRADE REPORTS (scraped HTML tables; null means grades are hidden):
${JSON.stringify(eclassCourses, null, 1)}

Produce a sync plan. Return ONLY valid JSON (no markdown, no code fences) in this exact structure:
{
  "courses": [
    {
      "eclass_course_id": "12345",
      "eclass_course_name": "name as shown on eClass",
      "app_course_id": "matching app course id, or null if no app course matches",
      "app_course_name": "matching app course name, or null",
      "confidence": "high" | "medium" | "low",
      "items": [
        {
          "eclass_item_name": "item name from the eClass table",
          "action": "update" | "create" | "skip",
          "assignment_id": "app assignment id for update, else null",
          "assignment_name": "name to use when action is create",
          "new_mark": 85.5,
          "old_mark": 72.0,
          "weight": 10,
          "warning": "optional short warning string, else null"
        }
      ]
    }
  ],
  "warnings": ["course-level or global warnings"]
}

RULES:

1. COURSE MATCHING: Match each eClass course to an app course by course code (e.g. "EECS 2030" matches "FW25-26 EECS2030 M - Advanced OOP"). Ignore term prefixes/section letters. Consider semester/year when ambiguous. If no app course plausibly matches, set app_course_id to null and leave items as an empty array.

2. GRADES: The eClass table columns are: "Grade item", "Calculated weight", "Grade", "Range", "Feedback", "Contribution to course total". There is NO percentage column — compute new_mark = (Grade / Range maximum) * 100. Example: Grade "35.00" with Range "0–35" -> new_mark 100. Grade "28" with Range "0–40" -> 70. If the Grade cell is "-" or empty (it may also contain stray menu text like "Actions" or "Grade analysis" — ignore that text), the item is ungraded -> action "skip". "Contribution to course total" is NOT the item's mark; never use it as new_mark.

2b. ITEM NAMES: The "Grade item" cell starts with the activity type followed by the actual name, e.g. "Assignment Homework 1" -> "Homework 1", "Manual item P1-7" -> "P1-7", "Quiz Quiz 2" -> "Quiz 2". Use the actual name (without the activity-type prefix) as eclass_item_name, consistently on every sync.

3. EXISTING SYNC KEYS: If an app assignment's eclass_item_name equals the eClass item name, that is ALWAYS the match — action "update" with that assignment_id. This prevents duplicates across repeated syncs.

4. NAME MATCHING: Otherwise match items to app assignments semantically ("Midterm Exam" ~ "Midterm 1" if there is only one midterm; "Quiz 1" ~ "Quiz 1").

5. AGGREGATES: The app often stores one combined assignment (e.g. "Labs" weight 10, "Assignments" weight 20) where eClass lists individual items (Lab 1..Lab 10). The table groups items under category header rows (a row with just the category name) and closes each group with a "<Category name> total" row. In that case match the app assignment to that CATEGORY TOTAL row's percentage (Grade / Range maximum * 100, computed only over graded items), action "update", and do NOT create the individual items.

5b. UNCATEGORIZED AGGREGATES: If the individual eClass items belonging to a combined app assignment sit at the TOP LEVEL with no category of their own (e.g. "Lab 1", "Lab 2" for the app's "Labs"), compute the aggregate yourself over the GRADED ones only: sum(grades) / sum(range maximums) * 100 -> one "update" for the combined app assignment. Use "<app assignment name> (aggregate)" as eclass_item_name so repeat syncs stay stable. Do NOT create the individual items.

6. CATEGORY/COURSE TOTALS: Apart from rule 5, ignore category header rows, "<Category> total" rows and the "Course total" row. Never create assignments from them.

7. NEW ITEMS: A graded eClass item with no plausible app assignment -> action "create" with a clean assignment_name and its eClass weight (number, no % sign) if shown, else null.

8. NO-OP: If new_mark is already equal to the app assignment's current mark (within 0.01), use action "skip".

9. SYLLABUS VERIFICATION: Moodle RENORMALIZES the "Calculated weight" column across graded items only, so mid-course calculated weights are usually inflated relative to the syllabus (e.g. 33% shown for a 5% homework) — that is NORMAL and must NOT produce a warning. "0.00 % ( Empty )" just means ungraded — never warn about those either. Only set an item warning when the weight structure genuinely contradicts the syllabus: the RELATIVE proportions between graded items clearly disagree with the syllabus proportions (e.g. eClass weighs the midterm twice the homework but the syllabus says they are equal). If eClass shows graded components that don't exist in the syllabus at all, or syllabus components missing from eClass, add a short note to the top-level "warnings" array.

10. Never invent grades. old_mark is the app assignment's current mark (null if none or for creates).

Return ONLY the JSON object.`;
}

export async function runSyncWithSession(
  session: string,
  appCourses: IncomingCourse[],
  userAgent: string = DEFAULT_USER_AGENT
): Promise<EclassSyncPlan> {
  // 1. Load the dashboard: validates the session and exposes the sesskey that
  //    the AJAX course-list API requires
  let dashboard;
  try {
    dashboard = await fetchPage("/my/", session, userAgent);
  } catch {
    throw new SyncError(
      "Could not reach eclass.yorku.ca. Check your internet connection.",
      502
    );
  }

  if (isLoginPage(dashboard.html, dashboard.url)) {
    throw new SyncError(
      "eClass session is invalid or expired. Please log in again.",
      401
    );
  }

  const sesskey = dashboard.html.match(/"sesskey":"([^"]+)"/)?.[1];

  let courseLinks = sesskey
    ? await fetchEnrolledCourses(session, userAgent, sesskey)
    : [];
  if (courseLinks.length === 0) {
    // Fallbacks: server-rendered links on the grades overview or dashboard
    const overview = await fetchPage("/grade/report/overview/index.php", session, userAgent);
    courseLinks = extractCourseLinks(overview.html);
  }
  if (courseLinks.length === 0) {
    courseLinks = extractCourseLinks(dashboard.html);
  }

  if (courseLinks.length === 0) {
    throw new SyncError("Logged into eClass but found no enrolled courses to scrape.", 404);
  }

  // Only scrape eClass courses that plausibly match the app's courses, so old
  // enrollments don't blow up the AI prompt (cap as a safety net)
  courseLinks = filterRelevantCourses(
    courseLinks,
    appCourses.map((c) => c.name)
  ).slice(0, 15);

  // 2. Scrape each course's user grade report
  const eclassCourses = await Promise.all(
    courseLinks.map(async (c) => {
      try {
        const page = await fetchPage(`/grade/report/user/index.php?id=${c.id}`, session, userAgent);
        const table = extractGradeTable(page.html);
        return {
          eclass_course_id: c.id,
          name: c.name,
          grade_table_html: table ? sanitizeTable(table) : null,
        };
      } catch {
        return { eclass_course_id: c.id, name: c.name, grade_table_html: null };
      }
    })
  );

  // 3. Ask Gemini to build the sync plan (match + verify against syllabus)
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
  const result = await model.generateContent(buildPrompt(appCourses, eclassCourses));

  let cleaned = result.response.text().trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "").trim();
  }
  const rawPlan = JSON.parse(cleaned);

  // 4. Post-process: drop skips, no-ops and invalid references so the client
  //    only ever applies safe, deduplicated changes
  const assignmentsById = new Map<string, IncomingAssignment>();
  const courseIds = new Set(appCourses.map((c) => c.id));
  appCourses.forEach((c) => c.assignments.forEach((a) => assignmentsById.set(a.id, a)));

  const planCourses: EclassPlanCourse[] = (rawPlan.courses || []).map((pc: any) => {
    const appCourseId =
      pc.app_course_id && courseIds.has(pc.app_course_id) ? pc.app_course_id : null;

    const items: EclassPlanItem[] = (pc.items || [])
      .filter((it: any) => it && it.action !== "skip" && it.eclass_item_name)
      .map((it: any): EclassPlanItem | null => {
        const newMark = typeof it.new_mark === "number" ? it.new_mark : null;
        if (it.action === "update") {
          const existing = it.assignment_id ? assignmentsById.get(it.assignment_id) : null;
          if (!existing || newMark === null) return null;
          if (existing.mark !== null && Math.abs(existing.mark - newMark) < 0.01) return null;
          return {
            eclass_item_name: String(it.eclass_item_name),
            action: "update",
            assignment_id: existing.id,
            assignment_name: existing.name,
            new_mark: newMark,
            old_mark: existing.mark,
            weight: existing.weight,
            warning: it.warning || null,
          };
        }
        if (it.action === "create") {
          if (newMark === null || !appCourseId) return null;
          return {
            eclass_item_name: String(it.eclass_item_name),
            action: "create",
            assignment_id: null,
            assignment_name: String(it.assignment_name || it.eclass_item_name),
            new_mark: newMark,
            old_mark: null,
            weight: typeof it.weight === "number" ? it.weight : null,
            warning: it.warning || null,
          };
        }
        return null;
      })
      .filter((it: EclassPlanItem | null): it is EclassPlanItem => it !== null);

    return {
      eclass_course_id: String(pc.eclass_course_id || ""),
      eclass_course_name: String(pc.eclass_course_name || ""),
      app_course_id: appCourseId,
      app_course_name: pc.app_course_name || null,
      confidence: pc.confidence || "low",
      items,
    };
  });

  const warnings: string[] = Array.isArray(rawPlan.warnings)
    ? rawPlan.warnings.map(String)
    : [];
  eclassCourses.forEach((c) => {
    if (c.grade_table_html === null) {
      warnings.push(`Grades for "${c.name}" are hidden on eClass or could not be read.`);
    }
  });

  return { courses: planCourses, warnings };
}
