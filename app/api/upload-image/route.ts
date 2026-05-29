import { NextResponse } from "next/server";
import ImageKit from "imagekit";

export const runtime = "nodejs"; // IMPORTANT fix

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
        { error: "Invalid file upload" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResponse = await imagekit.upload({
      file: buffer, // ImageKit supports Buffer in Node runtime
      fileName: `${Date.now()}.png`,
      folder: "/ai-images",
    });

    return NextResponse.json({
      url: uploadResponse.url,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
