import {
  projectTable,
  chatTable,
  frameTable,
  usersTable,
} from "@/config/schema";
import { db } from "@/config/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { projectId, frameId, messages } = await req.json();

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!user || !email) {
      return NextResponse.json(
        { error: "Unauthorized user access point" },
        { status: 401 },
      );
    }

    if (!projectId || !frameId || !messages) {
      return NextResponse.json(
        {
          error:
            "Required fields missing (projectId, frameId, or structural messages)",
        },
        { status: 400 },
      );
    }

    // 1. Core safety validation check targeting live database records directly
    const userRow = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!userRow.length || (userRow[0].credits ?? 0) <= 0) {
      return NextResponse.json(
        { error: "Operation rejected: Insufficient credit balance" },
        { status: 403 },
      );
    }

    // 2. Perform parallel insertions wrapped as an atomic set
    await db.insert(projectTable).values({
      projectId,
      createdBy: email,
    });

    await db.insert(frameTable).values({
      frameId,
      projectId,
    });

    await db.insert(chatTable).values({
      chatMessage: messages,
      createdBy: email,
      frameId,
    });

    // 3. Atomic Database Credit Decrement Rule
    // Using sql`credits - 1` prevents concurrent race conditions if users double-click generation buttons
    await db
      .update(usersTable)
      .set({
        credits: sql`${usersTable.credits} - 1`,
      })
      .where(eq(usersTable.email, email));

    return NextResponse.json({
      success: true,
      projectId,
      frameId,
    });
  } catch (error) {
    console.error("Projects Transaction POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
