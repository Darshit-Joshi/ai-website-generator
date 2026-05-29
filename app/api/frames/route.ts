import { chatTable, frameTable } from "@/config/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/config/db";

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

    // frame query
    const frameResult = await db
      .select()
      .from(frameTable)
      .where(
        and(
          eq(frameTable.frameId, frameId),
          eq(frameTable.projectId, projectId),
        ),
      );

    if (frameResult.length === 0) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    // chat query
    const chatResult = await db
      .select()
      .from(chatTable)
      .where(eq(chatTable.frameId, frameId));

    return NextResponse.json({
      ...frameResult[0],
      chats: chatResult,
    });
  } catch (error) {
    console.error("GET ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { designCode, frameId, projectId } = await req.json();

    if (!frameId || !projectId) {
      return NextResponse.json(
        { error: "frameId and projectId required" },
        { status: 400 },
      );
    }

    await db
      .update(frameTable)
      .set({ designCode })
      .where(
        and(
          eq(frameTable.frameId, frameId),
          eq(frameTable.projectId, projectId),
        ),
      );

    return NextResponse.json({ result: "Updated" });
  } catch (error) {
    console.error("PUT ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
