# 📊 GradeMatrix

GradeMatrix is an advanced, high-performance academic tracker and syllabus parsing platform. It features a modern neon-glassmorphic user interface, AI-powered syllabus extraction, interactive grading diagnostics, and robust authentication. Designed with students in mind, it simplifies academic planning and target-grade calculations.

---

## ✨ Key Features

### 1. 🤖 AI-Powered Syllabus Parsing
Upload any university syllabus in PDF format, and GradeMatrix's AI service (integrated with Gemini) will automatically:
* Identify course metadata (course code, name, professor, semester, calendar year, and credits).
* Parse the grading scheme and individual assignments.
* Apply splitting rules to subdivide exams, projects, and quiz aggregates into discrete tracking items.
* Check out the implementation in [app/api/parse-syllabus/route.ts](file:///G:/main-projects/grade-calc-2/app/api/parse-syllabus/route.ts) and the frontend wrapper [app/components/SyllabusImport.tsx](file:///G:/main-projects/grade-calc-2/app/components/SyllabusImport.tsx).

### 2. 🧮 Dual-Scale GPA Calculations
GradeMatrix supports dual GPA calculations simultaneously:
* **Standard 4.0 Scale Cumulative GPA**: Uses standard North American Letter Grade mappings.
* **York University 9.0 Scale GPA**: Converts averages according to York University's specific 9-point grading system (where A+=9, A=8, B+=7, B=6, C+=5, C=4, D+=3, D=2, F=0).
* Powered by core logic in [lib/calculations.ts](file:///G:/main-projects/grade-calc-2/lib/calculations.ts).

### 3. 🎯 Diagnostic Matrix Panel
For every course, the [app/components/DiagnosticMatrix.tsx](file:///G:/main-projects/grade-calc-2/app/components/DiagnosticMatrix.tsx) offers deep analytical metrics:
* **Current Average**: Live-calculated score based on graded coursework.
* **Remaining Weight Box**: Percentage of course weight yet to be evaluated.
* **Target Grade Planner**: Enter a desired final grade to dynamically calculate the exact average required on remaining components.
* **Maximum Potential Mark**: Real-time projection of the highest possible grade if you score 100% on all outstanding assessments.
* **Forced Grade Overrides**: Override automated calculations to simulate specific final grade outcomes.

### 4. 📈 Dynamic Visualization Charts
Interactive graphics powered by **Recharts** populate the dashboard:
* **Grade Distribution**: A custom-themed pie chart highlighting your course standing count.
* **Performance Timeline**: A timeline charting your historical term-by-term GPA trends.
* Implemented in [app/components/DashboardMetrics.tsx](file:///G:/main-projects/grade-calc-2/app/components/DashboardMetrics.tsx).

### 5. 🔍 Multi-Tiered Filtering
Search through courses dynamically or apply persistent filters based on:
* Semester (Fall, Winter, Summer, etc.)
* Academic Year / Calendar Year
* Custom course department categories (e.g., `LE/EECS`, `SC/MATH`)
* Course Status (In-Progress vs. Archived)
* Filters are stored in browser localStorage. See [app/components/CourseFilters.tsx](file:///G:/main-projects/grade-calc-2/app/components/CourseFilters.tsx).

---

## 🛠️ Technology Stack

* **Frontend Framework**: Next.js 16 (App Router) & React 19
* **Styling & UI**: Tailwind CSS v4, Lucide React icons, and Framer Motion for smooth micro-animations
* **Data Visualization**: Recharts (fully responsive charts)
* **Backend Database & Auth**: Supabase (utilizing postgres tables, row-level security, and authentication)
* **Artificial Intelligence**: Google Gemini API via `@google/generative-ai`

---

## 🚀 Getting Started

### Prerequisites
* Node.js v18+ or later
* A Supabase project with Database Tables
* A Google Gemini API Key

### Installation

1. **Clone the repository and install dependencies**:
   ```bash
   git clone <repository-url>
   cd grade-calc-2
   npm install
   ```

2. **Configure Environment Variables**:
   Create a [`.env.local`](file:///G:/main-projects/grade-calc-2/.env.local) file in the root directory and add the following keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   NEXT_PUBLIC_SITE_URL="http://localhost:3000"
   GEMINI_API_KEY="your-gemini-api-key"
   ```

3. **Database Tables Setup**:
   Configure two tables in your Supabase database:
   
   * **`courses`**:
     * `id`: uuid (Primary Key)
     * `user_id`: uuid (Foreign Key referencing auth.users)
     * `name`: text
     * `prof_name`: text (optional)
     * `credits`: numeric (default 3.0)
     * `mark`: numeric (optional, used for overrides)
     * `in_progress`: boolean (default true)
     * `year`: integer
     * `semester`: text
     * `category`: text (optional)
   
   * **`assignments`**:
     * `id`: uuid (Primary Key)
     * `course_id`: uuid (Foreign Key referencing courses.id, cascade delete)
     * `name`: text
     * `mark`: numeric (optional)
     * `weight`: numeric

4. **Launch the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

5. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```

---

## 📂 Project Architecture

```
grade-calc-2/
├── app/                      # Next.js App Router root
│   ├── api/
│   │   └── parse-syllabus/   # API route for PDF parsing via Gemini LLM
│   │       └── route.ts      # [route.ts](file:///G:/main-projects/grade-calc-2/app/api/parse-syllabus/route.ts)
│   ├── components/           # Core dashboard and analytics UI components
│   │   ├── AddCourseForm.tsx
│   │   ├── AssignmentForm.tsx
│   │   ├── CourseCard.tsx
│   │   ├── CourseFilters.tsx # [CourseFilters.tsx](file:///G:/main-projects/grade-calc-2/app/components/CourseFilters.tsx)
│   │   ├── DashboardMetrics.tsx
│   │   ├── DiagnosticMatrix.tsx # [DiagnosticMatrix.tsx](file:///G:/main-projects/grade-calc-2/app/components/DiagnosticMatrix.tsx)
│   │   ├── SyllabusImport.tsx# [SyllabusImport.tsx](file:///G:/main-projects/grade-calc-2/app/components/SyllabusImport.tsx)
│   │   └── ...
│   ├── course/
│   │   └── [id]/             # Dynamic course detail dashboard
│   │       └── page.tsx      # [page.tsx](file:///G:/main-projects/grade-calc-2/app/course/%5Bid%5D/page.tsx)
│   ├── globals.css           # Global theme styles
│   ├── layout.tsx            # Main layout wrapper
│   ├── page.tsx              # Main dashboard index [page.tsx](file:///G:/main-projects/grade-calc-2/app/page.tsx)
│   └── types.ts              # Core types definition [types.ts](file:///G:/main-projects/grade-calc-2/app/types.ts)
├── components/               # Global layout providers
│   ├── AuthProvider.tsx      # Supabase Auth Provider [AuthProvider.tsx](file:///G:/main-projects/grade-calc-2/components/AuthProvider.tsx)
│   └── ThemeProvider.tsx     # Light/Dark Theme management [ThemeProvider.tsx](file:///G:/main-projects/grade-calc-2/components/ThemeProvider.tsx)
├── lib/                      # Core helpers
│   ├── calculations.ts       # Grade math helper [calculations.ts](file:///G:/main-projects/grade-calc-2/lib/calculations.ts)
│   └── supabase.ts           # Supabase Client initialization [supabase.ts](file:///G:/main-projects/grade-calc-2/lib/supabase.ts)
└── package.json              # Dependencies and scripts [package.json](file:///G:/main-projects/grade-calc-2/package.json)
```

---

## 💻 Code Walkthrough & Logic

### Grade Calculations
The project utilizes helper functions defined in [lib/calculations.ts](file:///G:/main-projects/grade-calc-2/lib/calculations.ts):
* `[calculateGrades](file:///G:/main-projects/grade-calc-2/lib/calculations.ts#L36)` takes an array of course assignments alongside a target grade. It evaluates the current average, remaining weight, required scores on future evaluations to meet the target, and York University scale conversions.
* `[calculateCumulativeGPA4_0](file:///G:/main-projects/grade-calc-2/lib/calculations.ts#L167)` aggregates final grades weighted by course credit hours and computes standard 4.0 cumulative GPA.

### Data Types
Refer to [app/types.ts](file:///G:/main-projects/grade-calc-2/app/types.ts) for:
* `[Course](file:///G:/main-projects/grade-calc-2/app/types.ts#L11)`: Stores name, credits, semester, year, category, and override marks.
* `[Assignment](file:///G:/main-projects/grade-calc-2/app/types.ts#L1)`: Stores individual names, marks, and relative weight percentages.
* `[BackendMetrics](file:///G:/main-projects/grade-calc-2/app/types.ts#L24)`: Outlines standard output of target calculations.
