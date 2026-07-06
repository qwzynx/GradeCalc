import { GoogleGenerativeAI } from "@google/generative-ai";
import { EclassSyncPlan, EclassPlanCourse, EclassPlanItem, EclassSuggestedCourse } from "../app/types";
import { parseSyllabusDocument, ParsedSyllabusAssignment } from "./syllabus";

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
  eclass_course_id?: string | null;
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

async function fetchBinary(path: string, session: string, userAgent: string) {
  const res = await fetch(path.startsWith("http") ? path : `${ECLASS_BASE}${path}`, {
    headers: {
      Cookie: `MoodleSession=${session}`,
      "User-Agent": userAgent,
    },
    redirect: "follow",
    cache: "no-store",
  });
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const buf = Buffer.from(await res.arrayBuffer());
  return { buf, contentType };
}

const SYLLABUS_LABEL_RE = /syllabus|course\s*outline|^outline$/i;
const DOCUMENT_MIME_RE = /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats|application\/vnd\.ms-word)/i;

// Course pages list resource activities as links to mod/resource/view.php.
// Look for one whose visible label suggests it's the syllabus/course outline.
function findSyllabusResourceLink(courseHtml: string): string | null {
  const re = /<a[^>]*href="([^"]*\/mod\/resource\/view\.php\?id=\d+[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(courseHtml)) !== null) {
    const label = stripTags(m[2]);
    if (SYLLABUS_LABEL_RE.test(label)) {
      const href = decodeEntities(m[1]);
      return href.startsWith("http") ? href : `${ECLASS_BASE}${href}`;
    }
  }
  return null;
}

// When a resource isn't set to "automatic" display, view.php returns an HTML
// page with a "click here to download" link to the actual pluginfile instead
// of the file itself.
function findPluginfileLink(html: string): string | null {
  const m = html.match(/href="(https?:\/\/[^"]*pluginfile\.php[^"]*)"/i);
  return m ? decodeEntities(m[1]) : null;
}

// Best-effort: finds and downloads a course's syllabus/outline file, if any.
// Returns null (never throws) so a missing/unrecognizable syllabus never
// blocks the rest of the sync.
async function fetchCourseSyllabusFile(
  courseId: string,
  session: string,
  userAgent: string
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const coursePage = await fetchPage(`/course/view.php?id=${courseId}`, session, userAgent);
    const resourceUrl = findSyllabusResourceLink(coursePage.html);
    if (!resourceUrl) return null;

    let { buf, contentType } = await fetchBinary(resourceUrl, session, userAgent);

    if (!DOCUMENT_MIME_RE.test(contentType)) {
      const fileUrl = findPluginfileLink(buf.toString("utf-8"));
      if (!fileUrl) return null;
      ({ buf, contentType } = await fetchBinary(fileUrl, session, userAgent));
      if (!DOCUMENT_MIME_RE.test(contentType)) return null;
    }

    return { base64: buf.toString("base64"), mimeType: contentType.split(";")[0].trim() };
  } catch {
    return null;
  }
}

// Best-effort: finds a course's syllabus file and asks Gemini to extract its
// graded components, so the sync plan can be verified against the real
// syllabus instead of just guessing from the eClass grade table structure.
export async function fetchAndParseCourseSyllabus(
  courseId: string,
  session: string,
  userAgent: string
): Promise<ParsedSyllabusAssignment[] | null> {
  const file = await fetchCourseSyllabusFile(courseId, session, userAgent);
  if (!file) return null;
  try {
    const parsed = await parseSyllabusDocument(file.base64, file.mimeType);
    return parsed.assignments?.length ? parsed.assignments : null;
  } catch {
    return null;
  }
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

// --- Deterministic grade arithmetic -----------------------------------------
// Gemini is only ever asked to COPY the "Grade"/"Range" cell text verbatim for
// the row(s) behind an item — never to compute a percentage itself. LLM
// arithmetic across a large scraped table is unreliable (it has, in practice,
// divided a 75/75 points grade as if the range were 0-100); doing the actual
// division/summation here in code is exact every time.
export interface GradeComponent {
  raw_grade: string;
  raw_range: string;
  raw_weight?: string | null;
}

// A Moodle "Grade" cell is either a bare number (points, e.g. "75.00") or a
// number already suffixed with "%" (percentage-graded, e.g. "61.10 %") — the
// presence of that literal "%" is the one reliable signal for which it is.
function parseGradeCell(raw: string): { value: number; isPercentage: boolean } | null {
  const cleaned = String(raw).replace(/,/g, "").trim();
  const pctMatch = cleaned.match(/(-?\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) return { value: parseFloat(pctMatch[1]), isPercentage: true };
  const numMatch = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!numMatch) return null;
  return { value: parseFloat(numMatch[0]), isPercentage: false };
}

// Range cells look like "0–35" / "0-35" / "0 - 100" — ranges are never
// negative, so (unlike parseGradeCell) numbers here must NOT accept a
// leading "-": with an optional sign, "0-35" mis-parses as [0, -35] since the
// separating hyphen reads as a minus sign, making the max come out as 0
// instead of 35. The max is whichever number is largest either way.
function parseRangeMax(raw: string): number | null {
  const nums = Array.from(String(raw).matchAll(/\d+(?:\.\d+)?/g)).map((m) => parseFloat(m[0]));
  if (nums.length === 0) return null;
  return Math.max(...nums);
}

// "Calculated weight" cells look like "45.46 %" — just the number.
function parseWeight(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const m = String(raw).match(/\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

// Computes an item's final percentage from one or more raw (grade, range,
// weight) triples copied verbatim from eClass. A single component is the
// common case; more than one means an aggregate (e.g. a "Term Project"
// combining two separately-weighted eClass submission phases).
export function computeMarkFromComponents(components: GradeComponent[] | undefined | null): number | null {
  if (!Array.isArray(components) || components.length === 0) return null;

  const parsed = components
    .map((c) => {
      if (!c || typeof c.raw_grade !== "string") return null;
      const grade = parseGradeCell(c.raw_grade);
      if (!grade) return null;
      const weight = parseWeight(c.raw_weight);

      if (grade.isPercentage) return { pct: grade.value, points: null as number | null, max: null as number | null, weight };

      const max = parseRangeMax(c.raw_range);
      if (max === null || max === 0) return null;

      // A points score can never legitimately exceed its item's max — if it
      // does, the item's Range isn't actually the point scale (e.g. a manual
      // grade item whose max was set to its course weight, like "0-40" for a
      // 40%-weighted midterm, with the percentage typed directly into Grade
      // as "97.50"). That's the one reliable signal the number is already a
      // percentage rather than raw points, even with no "%" sign shown.
      if (grade.value > max) return { pct: grade.value, points: null as number | null, max: null as number | null, weight };

      return { pct: (grade.value / max) * 100, points: grade.value, max, weight };
    })
    .filter(
      (p): p is { pct: number; points: number | null; max: number | null; weight: number | null } => p !== null
    );

  if (parsed.length === 0) return null;
  if (parsed.length === 1) return parsed[0].pct;

  // Preferred, and correct in every case (including sub-parts worth different
  // amounts): a true weighted average using each component's own declared
  // "Calculated weight". This is exactly how Moodle itself combines graded
  // items into a category total ("Simple weighted mean of grades"), so it
  // stays accurate even when an aggregate's members carry different weights
  // — unlike summing raw points (which only works when every member is
  // worth the same per point) or a plain average (which assumes every
  // member counts equally regardless of its actual weight).
  const allWeighted = parsed.every((p) => p.weight !== null && (p.weight as number) > 0);
  if (allWeighted) {
    const sumWeighted = parsed.reduce((s, p) => s + p.pct * (p.weight as number), 0);
    const sumWeight = parsed.reduce((s, p) => s + (p.weight as number), 0);
    return sumWeighted / sumWeight;
  }

  // Fallback when weight text wasn't available for every member: if every
  // contributing item is points-graded, sum points over sum max (still
  // weights members with different point totals correctly); otherwise a
  // plain average of each member's own percentage.
  const allPoints = parsed.every((p) => p.points !== null && p.max !== null);
  if (allPoints) {
    const sumPoints = parsed.reduce((s, p) => s + (p.points as number), 0);
    const sumMax = parsed.reduce((s, p) => s + (p.max as number), 0);
    if (sumMax === 0) return null;
    return (sumPoints / sumMax) * 100;
  }
  return parsed.reduce((s, p) => s + p.pct, 0) / parsed.length;
}

export function buildPrompt(
  appCourses: IncomingCourse[],
  eclassCourses: {
    eclass_course_id: string;
    name: string;
    grade_table_html: string | null;
    syllabus: ParsedSyllabusAssignment[] | null;
  }[]
) {
  return `You are the sync engine for a university grade tracker app. The app's courses and assignments were originally imported from course syllabi. Below you get (1) the app's current data, (2) grade report tables scraped from York University's eClass (Moodle), and (3) graded components extracted by AI from each course's actual syllabus document on eClass, when one could be found.

APP COURSES (source of truth for weights, from the syllabus):
${JSON.stringify(appCourses, null, 1)}

ECLASS DATA (grade_table_html: scraped HTML table, null means grades are hidden. syllabus: ground-truth graded components extracted from the course's actual syllabus file on eClass, null if no syllabus file could be found/parsed):
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
      "suggested_course": {
        "name": "cleaned-up course name, e.g. 'EECS 2030 - Advanced OOP', only when app_course_id is null, else null",
        "semester": "Fall" | "Winter" | "Full Summer" | "Summer 1" | "Summer 2",
        "year": 2026,
        "credits": 3,
        "category": "LE/EECS" | "SC/MATH" | "SC/CHEM" | "LE/ENG" | "SC/PHYS" | null
      },
      "items": [
        {
          "eclass_item_name": "item name from the eClass table",
          "action": "update" | "create" | "skip",
          "assignment_id": "app assignment id for update, else null",
          "assignment_name": "name to use when action is create",
          "components": [
            { "raw_grade": "75.00", "raw_range": "0-75", "raw_weight": "22.73 %" }
          ],
          "weight": 10,
          "warning": "optional short warning string, else null"
        }
      ]
    }
  ],
  "warnings": ["course-level or global warnings"]
}

RULES:

0. ID MATCH FIRST (DEDUPE): Each app course may carry an "eclass_course_id" from a previous sync. If an eClass course's id equals an app course's "eclass_course_id", that is an AUTOMATIC, CERTAIN match — set app_course_id to that course, confidence "high", and NEVER populate suggested_course for it, even if the names look different now (course names can be renamed on eClass). This is the primary defense against creating duplicate courses across repeated syncs — prefer it over name-based matching whenever both could apply.

1. COURSE MATCHING: Match each eClass course to an app course by course code (e.g. "EECS 2030" matches "FW25-26 EECS2030 M - Advanced OOP"). Ignore term prefixes/section letters. Consider semester/year when ambiguous.

1b. NEW COURSES: If no app course plausibly matches, set app_course_id to null and fill in "suggested_course" so the app can create it: derive a clean "name" from the eClass title (strip the term/section prefix, e.g. "FW25-26 EECS2030 M - Advanced OOP" -> "EECS 2030 - Advanced OOP"), infer "semester" and "year" from the term prefix (e.g. "F25"/"FW25-26" -> Fall 2025/2026 depending which half of the code the course belongs to; "W26" -> Winter 2026; "S25"/"SU25" -> a Summer term), default credits to 3 and category to null if unclear. Then still populate "items" using the grading rules below (2-9), treating every graded item as brand new — there is no existing app assignment to match against, so every item's action is "create" (never "update") with assignment_id null. Do not leave items empty just because the course itself is new.

1c. EXISTING COURSES NEVER GET NEW ASSIGNMENTS: If app_course_id is NOT null, the app's assignment list (from the original syllabus import) is the complete, authoritative list of graded components for that course — never use action "create" for it. A graded eClass item that has no plausible existing app assignment must be action "skip" (not created). This is the ONLY way sync behaves for a course the user already has: it strictly updates the marks on assignments that already exist, and never invents or duplicates one. Rule 7 (NEW ITEMS) applies exclusively to courses being freshly drafted under 1b.

1d. KEEP NEW-COURSE ASSIGNMENTS SYLLABUS-SIMPLE: When drafting items for a brand-new course (1b), do not create one row per raw eClass grade item — a syllabus never lists "Lab 01", "Lab 02", "Tutorial 03" as separate lines. Before anything else, group the TOP-LEVEL graded items (whether or not eClass already grouped them under a category header) by their common base label (the item name with any trailing number/date stripped, e.g. "Lab 1"/"Lab 2"/"Lab 3" -> base "Lab", "Tutorial 01".."Tutorial 10" -> base "Tutorial"):
   - Labs, Tutorials, Assignments, Homework, Problem Sets, Participation/Attendance: combine every item sharing that base label into ONE create action named with the natural plural ("Labs", "Tutorials", "Assignments", ...). Put one components entry per GRADED member row, each with that row's raw_grade/raw_range/raw_weight copied verbatim (rule 2) — the app computes the combined percentage itself, correctly honoring each member's own weight even when they differ; you only need to supply every member's raw text, never do the math yourself. weight = sum of the group's eClass weights if shown, else null. Use "<plural label> (aggregate)" as eclass_item_name so a repeat sync recognizes it.
   - Quizzes, Tests, Midterms, Exams: keep as INDIVIDUAL entries, one per occurrence ("Quiz 1", "Quiz 2", "Midterm 1", "Midterm 2"), matching how a syllabus lists multiple tests separately. A single Final Exam is always its own entry.
   - Anything that doesn't fit a group of 2+ (a one-off item) stays as its own entry with its own clean name.
   This mirrors how this app's syllabus importer already splits/combines components, so a course created from eClass looks the same as one imported from its syllabus PDF.

1e. PREFER THE REAL SYLLABUS WHEN AVAILABLE (ALL COURSES, NOT JUST NEW ONES): If this eClass course has a non-null "syllabus" array, it was extracted directly from the course's actual syllabus document — it is ground truth, and applies whether app_course_id is null or not:
   - New courses (1b): use the syllabus's assignment names and weights as the item list instead of the grouping heuristics in 1d: for each syllabus assignment, find its matching row(s) on eClass using the same name-matching approach as rule 4 and copy their raw_grade/raw_range into components (leave components empty if nothing on eClass plausibly matches yet — ungraded), action "create", weight from the syllabus entry. Every syllabus assignment should appear as one item, even if ungraded so far.
   - Existing courses (app_course_id set): use the syllabus to correctly recognize multi-part deliverables whose eClass item names don't textually resemble the app assignment at all. E.g. if the syllabus describes "Term Project" as submitted in phases/parts with different deadlines (P1, P2, P3&P4), and eClass separately lists items like "Project Management Submission 1 (P1 & P2)" and "Project Management Submission 2 (P3 & P4)", recognize BOTH as belonging to the app's single "Term Project" assignment purely because the syllabus ties them together — don't rely on the eClass names resembling "Term Project" by themselves. Combine every such matching row into that one assignment's components per rule 5b, each with its own raw_weight (never leave one phase unmatched while only picking up the other, and never assume the phases are weighted equally — copy each one's actual weight so the app combines them correctly whether they match or differ).

2. GRADES — COPY, NEVER COMPUTE: The eClass table columns are: "Grade item", "Calculated weight", "Grade", "Range", "Feedback", "Contribution to course total". For every graded item, copy the "Grade", "Range", AND "Calculated weight" cell text VERBATIM, exactly as shown — including a "%" sign if the Grade cell has one (e.g. "61.10 %"), since that's how a percentage-graded item is distinguished from a points-graded one (e.g. "28.00" out of Range "0–40") — into that item's components as one {"raw_grade", "raw_range", "raw_weight"} entry. Always include raw_weight when the row shows a "Calculated weight" value: it's essential for combining multiple rows into one aggregate correctly when they carry different weights (see rules 5/5b) — never guess or omit it just because there's only one component. Do NOT divide, multiply, average, or otherwise compute a percentage yourself; the app does that arithmetic from what you copy, exactly and every time. If the Grade cell is "-" or empty (it may also contain stray menu text like "Actions" or "Grade analysis" — ignore that text), the item is ungraded -> action "skip" and omit components. "Contribution to course total" is never part of an item's grade; never copy it into raw_grade.

2b. ITEM NAMES: The "Grade item" cell starts with the activity type followed by the actual name, e.g. "Assignment Homework 1" -> "Homework 1", "Manual item P1-7" -> "P1-7", "Quiz Quiz 2" -> "Quiz 2". Use the actual name (without the activity-type prefix) as eclass_item_name, consistently on every sync.

3. EXISTING SYNC KEYS: If an app assignment's eclass_item_name equals the eClass item name, that is ALWAYS the match — action "update" with that assignment_id. This prevents duplicates across repeated syncs.

4. NAME MATCHING: Otherwise match items to app assignments semantically ("Midterm Exam" ~ "Midterm 1" if there is only one midterm; "Quiz 1" ~ "Quiz 1").

5. AGGREGATES: The app often stores one combined assignment (e.g. "Labs" weight 10, "Assignments" weight 20) where eClass lists individual items (Lab 1..Lab 10). The table groups items under category header rows (a row with just the category name) and closes each group with a "<Category name> total" row. In that case match the app assignment to that CATEGORY TOTAL row, action "update", with components = a single {raw_grade, raw_range, raw_weight} copied verbatim from that total row (rule 2), and do NOT create the individual items.

5b. UNCATEGORIZED AGGREGATES: If the individual eClass items belonging to a combined app assignment sit at the TOP LEVEL with no category of their own (e.g. "Lab 1", "Lab 2" for the app's "Labs"), or belong together only because the syllabus says so (rule 1e, e.g. a term project's separately-named submission phases), put one components entry per GRADED member row — raw_grade/raw_range/raw_weight copied verbatim, rule 2 — under a single "update" action for the combined app assignment. Copy each member's OWN weight exactly as shown even if the members' weights differ from each other; the app computes a proper weighted combination itself, so it comes out correct either way — never normalize, split evenly, or otherwise adjust the weights yourself. Use "<app assignment name> (aggregate)" as eclass_item_name so repeat syncs stay stable. Do NOT create the individual items.

6. CATEGORY/COURSE TOTALS: Apart from rule 5, ignore category header rows, "<Category> total" rows and the "Course total" row. Never create assignments from them.

7. NEW ITEMS (new courses only, see 1c/1d): A graded eClass item with no plausible existing assignment -> action "create" with a clean assignment_name, components = that row's raw_grade/raw_range/raw_weight (rule 2), and its eClass weight (number, no % sign) if shown, else null.

8. NO-OP: Don't worry about detecting no-ops yourself — always report an item's real components and let the app compute whether the mark actually changed; it silently skips applying anything that comes out equal to what's already stored.

9. SYLLABUS VERIFICATION: If this course's "syllabus" array is non-null, use it as the DIRECT ground truth: compare its assignment names/weights against the graded eClass items. Add a short note to the top-level "warnings" array for any syllabus component with no plausible matching graded item on eClass (e.g. "SC/MATH 2015: syllabus lists 'Midterm 2' but no matching graded item was found on eClass."), and for any eClass graded component that doesn't correspond to anything in the syllabus. If weights genuinely disagree (e.g. syllabus says a component is 10% but eClass's calculated weight, once un-renormalized, implies something very different), warn about that specific mismatch.
   If "syllabus" is null for this course, fall back to judging structure from the grade table alone: Moodle RENORMALIZES the "Calculated weight" column across graded items only, so mid-course calculated weights are usually inflated relative to the syllabus (e.g. 33% shown for a 5% homework) — that is NORMAL and must NOT produce a warning. "0.00 % ( Empty )" just means ungraded — never warn about those either. Only set an item warning when the RELATIVE proportions between graded items clearly disagree with plausible syllabus proportions (e.g. eClass weighs the midterm twice the homework but that seems implausible for the course).

10. Never invent grades: every components entry must be copied from a real row you can see in the eClass data. If you can't find an actual graded row for an item, leave its components empty (action "skip", or omit the item) rather than guessing a number.

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

  // 2. Scrape each course's user grade report, and (best-effort) its syllabus
  //    document so the plan can be verified against ground truth instead of
  //    just the grade table's structure.
  const eclassCourses = await Promise.all(
    courseLinks.map(async (c) => {
      let gradeTableHtml: string | null = null;
      try {
        const page = await fetchPage(`/grade/report/user/index.php?id=${c.id}`, session, userAgent);
        const table = extractGradeTable(page.html);
        gradeTableHtml = table ? sanitizeTable(table) : null;
      } catch {
        gradeTableHtml = null;
      }

      const syllabus = await fetchAndParseCourseSyllabus(c.id, session, userAgent);

      return {
        eclass_course_id: c.id,
        name: c.name,
        grade_table_html: gradeTableHtml,
        syllabus,
      };
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
  const appCourseByEclassId = new Map<string, IncomingCourse>();
  appCourses.forEach((c) => {
    c.assignments.forEach((a) => assignmentsById.set(a.id, a));
    if (c.eclass_course_id) appCourseByEclassId.set(c.eclass_course_id, c);
  });

  const planCourses: EclassPlanCourse[] = (rawPlan.courses || []).map((pc: any) => {
    // Hard dedupe backstop: an eClass id already linked to an app course always
    // wins, regardless of what the AI returned — never let a linked course be
    // (re-)drafted as new.
    const linkedCourse = appCourseByEclassId.get(String(pc.eclass_course_id || ""));
    const appCourseId =
      linkedCourse?.id ??
      (pc.app_course_id && courseIds.has(pc.app_course_id) ? pc.app_course_id : null);

    const items: EclassPlanItem[] = (pc.items || [])
      .filter((it: any) => it && it.action !== "skip" && it.eclass_item_name)
      .map((it: any): EclassPlanItem | null => {
        // The AI only ever copies raw grade/range text (rule 2) — the actual
        // percentage is always computed here in code, never trusted from the
        // model, since LLM arithmetic across a scraped table is unreliable.
        const newMark = computeMarkFromComponents(it.components);
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
          // A course that already exists in the app has its full assignment
          // list from the syllabus already — sync must never invent new ones
          // for it, only update marks on what's already there (rule 1c).
          if (newMark === null || appCourseId) return null;
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

    let suggestedCourse: EclassSuggestedCourse | null = null;
    if (!appCourseId && pc.suggested_course) {
      const sc = pc.suggested_course;
      suggestedCourse = {
        name: String(sc.name || pc.eclass_course_name || "Untitled Course"),
        prof_name: sc.prof_name || null,
        semester: String(sc.semester || "Fall"),
        year: typeof sc.year === "number" ? sc.year : new Date().getFullYear(),
        credits: typeof sc.credits === "number" ? sc.credits : 3,
        category: sc.category || null,
      };
    }

    return {
      eclass_course_id: String(pc.eclass_course_id || ""),
      eclass_course_name: String(pc.eclass_course_name || ""),
      app_course_id: appCourseId,
      app_course_name: linkedCourse?.name || pc.app_course_name || null,
      confidence: linkedCourse ? "high" : pc.confidence || "low",
      items,
      suggested_course: suggestedCourse,
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
