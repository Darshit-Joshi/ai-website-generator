import { db } from "@/config/db";
import { chatTable } from "@/config/schema";
import { eq, and } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const { messages, frameId } = await req.json();

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!user || !email) {
      return NextResponse.json(
        { error: "Unauthorized user access point" },
        { status: 401 },
      );
    }

    if (!frameId || !messages) {
      return NextResponse.json(
        { error: "frameId and messages history array are required properties" },
        { status: 400 },
      );
    }

    // Direct updating targeting precise combinations securely validating row ownership
    const result = await db
      .update(chatTable)
      .set({
        chatMessage: messages,
      })
      .where(
        and(eq(chatTable.frameId, frameId), eq(chatTable.createdBy, email)),
      );

    return NextResponse.json({
      result: "updated",
      success: true,
    });
  } catch (error) {
    console.error("Chats Persistence PUT API Operational Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
