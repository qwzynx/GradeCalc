import { NextResponse } from "next/server";
import { parseSyllabusDocument } from "@/lib/syllabus";
import { getRequestUser, unauthorized } from "@/lib/api-auth";

export async function POST(req: Request) {
  try {
    const user = await getRequestUser(req);
    if (!user) return unauthorized();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "application/pdf";

    const parsed = await parseSyllabusDocument(base64, mimeType);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Syllabus parse error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse syllabus" },
      { status: 500 }
    );
  }
}
