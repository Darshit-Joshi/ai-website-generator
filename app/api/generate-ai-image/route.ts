import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";
import { currentUser } from "@clerk/nextjs/server";

export const runtime = "nodejs";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function POST(req: NextRequest) {
  try {
    // 1. Guard against unauthorized API hits
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json(
        { error: "A prompt description is required" },
        { status: 400 },
      );
    }

    // 2. Build a valid, signed ImageKit Generative prompt URL path
    // Format required: /ik-genimg-prompt-[text]/filename.png
    const sanitizedPrompt = encodeURIComponent(prompt.trim());

    const generatedUrl = imagekit.url({
      path: `/ik-genimg-prompt-${sanitizedPrompt}/generated-ui-asset-${Date.now()}.png`,
      signed: true, // Bypasses endpoint protection restrictions
      expiresIn: 600, // Link remains active to fetch for 10 minutes
    });

    return NextResponse.json({ url: generatedUrl });
  } catch (error: any) {
    console.error("ImageKit Generation Route Error:", error);
    return NextResponse.json(
      { error: "ImageKit generation engine rejected the prompt context" },
      { status: 500 },
    );
  }
}
