import { db } from "@/config/db";
import { chatTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const { messages, frameId } = await req.json();

    if (!frameId || !messages) {
      return NextResponse.json(
        { error: "frameId and messages are required" },
        { status: 400 },
      );
    }

    const result = await db
      .update(chatTable)
      .set({
        chatMessage: messages,
      })
      .where(eq(chatTable.frameId, frameId));

    return NextResponse.json({
      result: "updated",
      rowsAffected: result?.rowCount ?? null,
    });
  } catch (error) {
    console.error("PUT ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
