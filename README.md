# 📊 GradeMatrix

**GradeMatrix** is a grade-tracking and academic-planning app for university students. It calculates live course averages, projects the score you need on remaining work to hit a target grade, converts between GPA scales, and can fill itself in automatically by parsing a syllabus with AI or by syncing directly with York University's eClass (Moodle).

<p>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres_%2B_Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white">
  <img alt="Google Gemini" src="https://img.shields.io/badge/Gemini_API-AI_parsing-8E75B2?style=flat-square&logo=googlegemini&logoColor=white">
  <img alt="Playwright" src="https://img.shields.io/badge/Playwright-eClass_sync-2EAD33?style=flat-square&logo=playwright&logoColor=white">
</p>

---

## ✨ Key Features

### 1. 🧮 Diagnostic Matrix per course
For every course, [`app/components/DiagnosticMatrix.tsx`](app/components/DiagnosticMatrix.tsx) computes:
* **Current average** — live-calculated from graded assignments only.
* **Remaining weight** — how much of the course's grade is still ungraded.
* **Target grade planner** — enter a desired final grade and see the exact average required on the remaining weight to reach it.
* **Maximum potential mark** — the best possible final grade if everything outstanding is scored 100%.
* **Forced grade overrides** — pin a course's final mark manually to simulate an outcome.
* **Bonus marks** — flag an assignment `is_bonus` (e.g. a 5% course bonus) and its weight sits outside the course's normal 100%; the earned share (`mark × weight`) is added on top of the final average, which also lowers the score needed on whatever's left to hit a target. See [`lib/calculations.ts`](lib/calculations.ts).

### 2. 🔁 eClass Sync (York University)
[`app/components/EclassSync.tsx`](app/components/EclassSync.tsx) can log into `eclass.yorku.ca` on your behalf and pull your real grades in:
* A headless browser (Playwright) drives the Passport York login and streams Duo two-factor push status back to the UI over NDJSON.
* Scraped grade items are matched against your existing courses/assignments by an AI-assisted plan, shown as a **diff-style review** (create vs. update, including any mark decreases) before anything is written.
* Unmatched eClass courses can be created directly from the sync plan.
* Sync attempts are rate-limited server-side ([`lib/rate-limit.ts`](lib/rate-limit.ts)) since each login triggers a real Duo push against Passport York.
* Implemented across [`app/api/eclass-sync/route.ts`](app/api/eclass-sync/route.ts), [`lib/eclass.ts`](lib/eclass.ts), and [`lib/eclass-login.ts`](lib/eclass-login.ts).

### 3. 🤖 AI-Powered Syllabus Parsing
Upload a syllabus PDF and [`app/components/SyllabusImport.tsx`](app/components/SyllabusImport.tsx) (backed by the Gemini API) will:
* Identify course metadata — code, name, professor, semester, year, and credits.
* Parse the grading scheme into individual weighted assignments.
* Split aggregated categories (e.g. "Quizzes 20%") into discrete trackable items.
* See [`app/api/parse-syllabus/route.ts`](app/api/parse-syllabus/route.ts) and [`lib/syllabus.ts`](lib/syllabus.ts).

### 4. 🎓 Dual-Scale GPA Calculations
* **Standard 4.0 scale** cumulative GPA using North American letter-grade mappings.
* **York University 9.0 scale** GPA (A+ = 9 … F = 0).
* Both are aggregated across courses weighted by credit hours in [`lib/calculations.ts`](lib/calculations.ts).

### 5. 📈 Dynamic Visualization Charts
Interactive charts on the dashboard, powered by **Recharts**:
* **Grade distribution** — a donut chart of course standing, weighted by credits.
* **Performance timeline** — a term-by-term GPA trend area chart.
* Implemented in [`app/components/DashboardMetrics.tsx`](app/components/DashboardMetrics.tsx).

### 6. 🔍 Multi-Tiered Filtering
Filter and search the course list by:
* Semester (Fall, Winter, Full Summer, Summer 1/2)
* Academic year
* Custom department category (e.g. `LE/EECS`, `SC/MATH`)
* Status (in-progress vs. archived)
* Filters persist in `localStorage`. See [`app/components/CourseFilters.tsx`](app/components/CourseFilters.tsx).

### 7. 🔐 Authentication
Email/password auth via Supabase, with API routes independently verifying the caller's session token server-side. See [`app/login/page.tsx`](app/login/page.tsx), [`components/AuthProvider.tsx`](components/AuthProvider.tsx), and [`lib/api-auth.ts`](lib/api-auth.ts).

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, [Lucide](https://lucide.dev/) icons, [Framer Motion](https://www.framer.com/motion/) |
| Charts | [Recharts](https://recharts.org/) |
| Database & Auth | [Supabase](https://supabase.com/) (Postgres, row-level security, auth) |
| AI | Google Gemini API (`@google/generative-ai`) — syllabus parsing & sync matching |
| Browser automation | Playwright / `playwright-core` + `@sparticuz/chromium` — headless eClass login |
| PDF parsing | `pdf-parse` |
| Linting | ESLint 9 (`eslint-config-next`) |

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18 or later
* A [Supabase](https://supabase.com/) project
* A [Google Gemini](https://ai.google.dev/) API key
* (Optional) A York University account, only if you want to use eClass Sync

### Installation

1. **Clone the repository and install dependencies**
   ```bash
   git clone https://github.com/qwzynx/GradeCalc.git
   cd GradeCalc
   npm install
   ```

2. **Configure environment variables**

   Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   GEMINI_API_KEY="your-gemini-api-key"
   ```

   | Variable | Purpose |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key (used client-side and to verify user JWTs server-side) |
   | `NEXT_PUBLIC_SITE_URL` | Base URL of the app (used in Supabase auth redirects) |
   | `GEMINI_API_KEY` | Google Gemini API key for syllabus parsing and eClass sync matching |

3. **Set up the database**

   Run the SQL migrations in [`supabase/migrations/`](supabase/migrations/) against your Supabase project, in order, via the SQL editor or `supabase db push`:

   | Migration | Adds |
   |---|---|
   | [`20260706_eclass_sync.sql`](supabase/migrations/20260706_eclass_sync.sql) | `eclass_course_id` / `eclass_item_name` sync keys, `eclass_syncs` history table + RLS |
   | [`20260706_eclass_dedup_constraints.sql`](supabase/migrations/20260706_eclass_dedup_constraints.sql) | Unique indexes preventing duplicate synced courses/assignments |
   | [`20260808_assignment_bonus.sql`](supabase/migrations/20260808_assignment_bonus.sql) | `is_bonus` boolean column on `assignments` |

   Your `courses` and `assignments` tables should end up with roughly this shape:

   * **`courses`**
     * `id` — uuid, primary key
     * `user_id` — uuid, references `auth.users`
     * `name` — text
     * `prof_name` — text, optional
     * `credits` — numeric, default `3.0`
     * `mark` — numeric, optional (manual override)
     * `in_progress` — boolean, default `true`
     * `year` — integer
     * `semester` — text
     * `category` — text, optional
     * `eclass_course_id` — text, optional (eClass sync key)

   * **`assignments`**
     * `id` — uuid, primary key
     * `course_id` — uuid, references `courses.id`, cascade delete
     * `name` — text
     * `mark` — numeric, optional
     * `weight` — numeric
     * `is_bonus` — boolean, default `false` — weight sits outside the course's 100%
     * `eclass_item_name` — text, optional (eClass sync key)

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Build for production |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## 📂 Project Structure

```
GradeCalc/
├── app/
│   ├── api/
│   │   ├── eclass-sync/route.ts      # eClass login, scrape, and AI-matched sync plan
│   │   └── parse-syllabus/route.ts   # Syllabus PDF -> AI-parsed courses/assignments
│   ├── components/
│   │   ├── AddCourseForm.tsx
│   │   ├── AssignmentForm.tsx
│   │   ├── CourseCard.tsx
│   │   ├── CourseFilters.tsx
│   │   ├── DashboardMetrics.tsx      # Recharts dashboard (distribution + timeline)
│   │   ├── DiagnosticMatrix.tsx      # Per-course grade diagnostics
│   │   ├── EclassSync.tsx            # eClass sync flow UI (login -> Duo -> review -> apply)
│   │   ├── EditCourseForm.tsx
│   │   ├── SyllabusImport.tsx        # AI syllabus import UI
│   │   └── ...                       # Shared UI: GlassCard, NeonButton, NumberInput, etc.
│   ├── course/[id]/page.tsx          # Course detail dashboard
│   ├── login/page.tsx                # Supabase auth (sign in / sign up)
│   ├── layout.tsx
│   ├── page.tsx                      # Main dashboard
│   └── types.ts                      # Shared TypeScript types
├── components/                       # App-wide providers
│   ├── AuthProvider.tsx
│   ├── ThemeProvider.tsx
│   └── ToastProvider.tsx
├── lib/
│   ├── api-auth.ts                   # Server-side Supabase JWT verification
│   ├── calculations.ts               # Grade math: averages, targets, GPA scales, bonuses
│   ├── eclass.ts                     # eClass scraping + AI sync-plan generation
│   ├── eclass-login.ts               # Playwright-driven Passport York + Duo login
│   ├── rate-limit.ts                 # In-memory sliding-window rate limiter
│   ├── supabase.ts                   # Supabase client (browser)
│   └── syllabus.ts                   # Gemini-based PDF syllabus parsing
├── supabase/migrations/              # SQL migrations (run manually against your project)
└── package.json
```

---

## 💻 Core Logic

### Grade calculations ([`lib/calculations.ts`](lib/calculations.ts))
* `calculateGrades(assignments, targetGradeInput)` — takes a course's assignments (with `weight`, optional `percentage`, and optional `is_bonus`) and a target grade, and returns the current average, remaining weight, bonus points earned/potential, the score needed on remaining work to hit the target (or just pass at 50), and the York 9.0-scale GPA/letter.
* `calculateCumulativeGPA4_0(courseGrades)` — aggregates final letter grades weighted by credit hours into a 4.0-scale cumulative GPA.
* `parseTargetGrade(input)` — accepts either a numeric percentage or a letter grade (`"A+"`, `"B"`, …) as the target.

### Data types ([`app/types.ts`](app/types.ts))
* `Course` — name, credits, semester, year, category, override mark, eClass sync key.
* `Assignment` — name, mark, weight, `is_bonus` flag, eClass sync key.
* `BackendMetrics` — the shape returned by `calculateGrades` (final average, bonus points, target requirements, GPA/letter, etc).
* `EclassSyncPlan` / `EclassPlanCourse` / `EclassPlanItem` — the reviewable diff produced by an eClass sync before it's applied.
