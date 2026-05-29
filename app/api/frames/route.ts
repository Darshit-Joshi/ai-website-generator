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

    const frameResult = await db
      .select()
      .from(frameTable)
      .where(
        and(
          eq(frameTable.frameId, frameId),
          eq(frameTable.projectId, projectId as string | null),
        ),
      );

    const chatResult = await db
      .select()
      .from(chatTable)
      .where(eq(chatTable.frameId, frameId));

    if (!frameResult.length) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    const finalResult = {
      ...frameResult[0],
      chatMessage: chatResult[0]?.chatMessage || [],
    };

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error(error);
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
        { error: "frameId and projectId are required" },
        { status: 400 },
      );
    }

    const result = await db
      .update(frameTable)
      .set({
        designCode: designCode,
      })
      .where(
        and(
          eq(frameTable.frameId, frameId as string),
          // 👇 This explicitly satisfies the "string | null" overload required by Drizzle
          eq(frameTable.projectId, projectId as string | null),
        ),
      );

    return NextResponse.json({ result: "Updated" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
