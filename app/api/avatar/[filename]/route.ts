import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } },
) {
  try {
    // Sanitize the filename to prevent directory traversal
    const filename = path.basename(params.filename);
    const userDir = path.join(process.cwd(), ".cursordone", "user");
    const avatarPath = path.join(userDir, filename);

    // Ensure user directory exists
    try {
      await fs.mkdir(userDir, { recursive: true });
    } catch (error) {
      console.error("Error creating user directory:", error);
      return NextResponse.json(
        { error: "Failed to access user directory" },
        { status: 500 },
      );
    }

    // Check if file exists
    try {
      await fs.access(avatarPath);
    } catch {
      console.error("Avatar not found:", avatarPath);
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    // Read the file
    const file = await fs.readFile(avatarPath);
    if (!file || file.length === 0) {
      console.error("Avatar file is empty:", avatarPath);
      return NextResponse.json(
        { error: "Avatar file is empty" },
        { status: 404 },
      );
    }

    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase();
    const contentType =
      {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
      }[ext] || "application/octet-stream";

    // Return the file with appropriate headers
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
        "Content-Length": file.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error serving avatar:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
