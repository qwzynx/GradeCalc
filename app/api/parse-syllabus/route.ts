import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read the file as bytes
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Determine MIME type
    const mimeType = file.type || "application/pdf";

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a university syllabus parser. Analyze this document and extract the course information and ALL graded components.

Return ONLY valid JSON (no markdown formatting, no code blocks) in this exact structure:
{
  "course": {
    "name": "Course code and name (e.g. EECS 2030 - Advanced OOP)",
    "prof_name": "Professor's full name",
    "semester": "Fall" or "Winter" or "Full Summer" or "Summer 1" or "Summer 2",
    "year": 2026,
    "credits": 3,
    "category": "LE/EECS" or "SC/MATH" or "SC/CHEM" or "LE/ENG" or "SC/PHYS" or null
  },
  "assignments": [
    { "name": "Component Name", "weight": 10 },
    { "name": "Midterm Exam", "weight": 25 }
  ]
}

CRITICAL SPLITTING RULES — follow these precisely:

1. QUIZZES & TESTS: If there are multiple quizzes or tests (e.g. "Quizzes 20%, 2 quizzes"), split them into INDIVIDUAL entries:
   - "Quiz 1" weight 10, "Quiz 2" weight 10
   - Divide the total weight equally among the count

2. PROJECTS: If a project has sub-parts or phases with divided marks (e.g. "Project: Proposal 5%, Implementation 15%, Presentation 5%"), split them into separate entries for each sub-part. If the project is NOT subdivided, keep it as one entry.

3. EXAMS: If there are multiple midterms (e.g. "2 Midterms worth 30%"), split them:
   - "Midterm 1" weight 15, "Midterm 2" weight 15
   - Final exams are always a single entry.

4. LABS & ASSIGNMENTS: Keep these as ONE combined entry with the total weight. Do NOT split individual labs or assignments.
   - e.g. "10 labs worth 1% each" → "Labs" weight 10
   - e.g. "5 assignments worth 4% each" → "Assignments" weight 20

5. PARTICIPATION, ATTENDANCE, TUTORIALS: Keep as single entries.

Other rules:
- Weights must be numbers representing percentages (no % sign)
- The total weights should ideally sum to 100%
- For "category", try to match the course department to one of the given options, or use null if unsure
- For "semester", infer from dates or term info in the syllabus. Default to "Fall" if unclear
- For "year", extract from the syllabus. Default to current year if unclear
- For "credits", extract credit hours. Default to 3 if unclear
- Do NOT include any grades or marks — only names and weights
- Return ONLY the JSON object, nothing else`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ]);

    const responseText = result.response.text();

    // Clean up the response — strip markdown code fences if present
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "").trim();
    }

    const parsed = JSON.parse(cleanedText);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Syllabus parse error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse syllabus" },
      { status: 500 }
    );
  }
}
