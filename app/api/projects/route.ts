import {
  projectTable,
  chatTable,
  frameTable,
  usersTable,
} from "@/config/schema";
import { db } from "@/config/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { projectId, frameId, messages, credits } = await req.json();

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!user || !email) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    if (!projectId || !frameId) {
      return NextResponse.json(
        { error: "projectId or frameId missing" },
        { status: 400 },
      );
    }

    // 1. Project insert
    await db.insert(projectTable).values({
      projectId,
      createdBy: email,
    });

    // 2. Frame insert
    await db.insert(frameTable).values({
      frameId,
      projectId,
    });

    // 3. Chat insert
    await db.insert(chatTable).values({
      chatMessage: messages,
      createdBy: email,
      frameId,
    });

    // 4. Credit update (safe decrement)
    await db
      .update(usersTable)
      .set({
        credits: Number(credits || 0) - 1,
      })
      .where(eq(usersTable.email, email));

    return NextResponse.json({
      success: true,
      projectId,
      frameId,
    });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
