import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/config/db";
import { chatTable, frameTable } from "@/config/schema";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const frameId = searchParams.get("frameId");
    const projectId = searchParams.get("projectId");

    if (!frameId || !projectId) {
      return NextResponse.json(
        { error: "frameId and projectId are required" },
        { status: 400 },
      );
    }

    // Querying the frame details securely using table references
    const frameResult = await db
      .select()
      .from(frameTable)
      .where(
        and(
          eq(frameTable.frameId, frameId),
          eq(frameTable.projectId, projectId),
        ),
      );

    if (!frameResult.length) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    // Querying associated chat conversation history for this frame
    const chatResult = await db
      .select()
      .from(chatTable)
      .where(eq(chatTable.frameId, frameId));

    // Combining structural frame properties with historical chat arrays
    const finalResult = {
      ...frameResult[0],
      chatMessage: chatResult[0]?.chatMessage || [],
    };

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error("Frames GET API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { designCode, frameId, projectId } = body;

    if (!frameId || !projectId) {
      return NextResponse.json(
        { error: "frameId and projectId are required" },
        { status: 400 },
      );
    }

    // Direct updating targeting precise index combinations safely
    await db
      .update(frameTable)
      .set({
        designCode: designCode,
      })
      .where(
        and(
          eq(frameTable.frameId, frameId),
          eq(frameTable.projectId, projectId),
        ),
      );

    return NextResponse.json({ result: "Updated" });
  } catch (error) {
    console.error("Frames PUT API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
