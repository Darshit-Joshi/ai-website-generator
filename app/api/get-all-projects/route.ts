import { db } from "@/config/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq, inArray, desc } from "drizzle-orm";
import { chatTable, frameTable, projectTable } from "@/config/schema";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!user || !email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get projects
    const projects = await db
      .select()
      .from(projectTable)
      .where(eq(projectTable.createdBy, email))
      .orderBy(desc(projectTable.id));

    const projectIds = projects.map((p) => p.projectId);

    if (projectIds.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Get all frames in one query
    const frames = await db
      .select()
      .from(frameTable)
      .where(inArray(frameTable.projectId, projectIds));

    const frameIds = frames.map((f) => f.frameId);

    // 3. Get all chats in one query
    const chats =
      frameIds.length > 0
        ? await db
            .select()
            .from(chatTable)
            .where(inArray(chatTable.frameId, frameIds))
        : [];

    // 4. Build map for fast lookup
    const chatMap = new Map<string, any[]>();

    for (const chat of chats) {
      if (!chatMap.has(chat.frameId)) {
        chatMap.set(chat.frameId, []);
      }
      chatMap.get(chat.frameId)!.push(chat);
    }

    const frameMap = new Map<string, any[]>();

    for (const frame of frames) {
      if (!frameMap.has(frame.projectId)) {
        frameMap.set(frame.projectId, []);
      }

      frameMap.get(frame.projectId)!.push({
        frameId: frame.frameId,
        chats: chatMap.get(frame.frameId) || [],
      });
    }

    // 5. Final structure
    const results = projects.map((project) => ({
      projectId: project.projectId,
      frames: frameMap.get(project.projectId) || [],
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
