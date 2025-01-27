import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (userId !== user.id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 403 });
    }

    // Create a unique filename
    const fileExtension = path.extname(file.name);
    const fileName = `${user.id}-${Date.now()}${fileExtension}`;
    const filePath = path.join(process.cwd(), "public", "avatars", fileName);

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to public/avatars directory
    await writeFile(filePath, buffer);

    // Return the public URL
    const avatarUrl = `/avatars/${fileName}`;
    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
