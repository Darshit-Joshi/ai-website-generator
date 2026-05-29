import { NextResponse } from "next/server";
import ImageKit from "imagekit";

export const runtime = "nodejs";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Invalid file payload structure detected" },
        { status: 400 },
      );
    }

    // 1. Process array binary representations cleanly protecting buffer channels
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Convert raw buffer explicitly into a safe Base64 string format.
    // This provides robust data streaming compatibility across Next.js 16 API endpoints.
    const base64File = buffer.toString("base64");

    // 3. Commit secure media file tracking records cleanly into ImageKit cloud buckets
    const uploadResponse = await imagekit.upload({
      file: base64File, // Passing a Base64 string is natively accepted across all cloud platform configurations
      fileName: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`, // Clean up non-standard names
      folder: "/ai-images",
      useUniqueFileName: true,
    });

    return NextResponse.json({
      url: uploadResponse.url,
      success: true,
    });
  } catch (err: any) {
    console.error("IMAGEKIT CORE UPLOAD PIPELINE ERROR:", err?.message || err);

    return NextResponse.json(
      {
        error: "Upload execution pipeline failed",
        details: err?.message || "Internal server exception",
      },
      { status: 500 },
    );
  }
}
