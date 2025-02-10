import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only images are allowed." },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 },
      );
    }

    // Ensure the user directory exists
    const userDir = path.join(process.cwd(), ".cursordone", "user");
    await fs.mkdir(userDir, { recursive: true });

    // Create a unique filename with proper extension
    const ext = path.extname(file.name).toLowerCase();
    const validExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const fileExt = validExts.includes(ext) ? ext : ".jpg";
    const avatarFilename = `avatar-${user.id}${fileExt}`;
    const avatarPath = path.join(userDir, avatarFilename);

    // Convert File to Buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate buffer
    if (buffer.length === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    // Write file
    try {
      await fs.writeFile(avatarPath, buffer);

      // Verify file was written
      const stats = await fs.stat(avatarPath);
      if (stats.size === 0) {
        throw new Error("File was written but is empty");
      }
    } catch (error) {
      console.error("Error writing avatar file:", error);
      return NextResponse.json(
        { error: "Failed to save avatar file" },
        { status: 500 },
      );
    }

    return NextResponse.json({ avatarPath: avatarFilename });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 },
    );
  }
}
