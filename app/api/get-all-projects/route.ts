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

    // 1. Fetch user-owned projects ordered by recency
    const projects = await db
      .select()
      .from(projectTable)
      .where(eq(projectTable.createdBy, email))
      .orderBy(desc(projectTable.id));

    if (projects.length === 0) {
      return NextResponse.json([]);
    }

    const projectIds = projects.map((p) => p.projectId);

    // 2. Aggregate all frames tied to the project set
    const frames = await db
      .select()
      .from(frameTable)
      .where(inArray(frameTable.projectId, projectIds));

    if (frames.length === 0) {
      return NextResponse.json(
        projects.map((p) => ({
          projectId: p.projectId,
          frameId: "",
          chats: [],
        })),
      );
    }

    const frameIds = frames.map((f) => f.frameId);

    // 3. Collect conversation arrays mapping to collected indices
    const chats = await db
      .select()
      .from(chatTable)
      .where(inArray(chatTable.frameId, frameIds));

    // 4. Index chat maps tracking contextual relationship links
    const chatMap = new Map<string, any[]>();
    for (const chat of chats) {
      if (!chatMap.has(chat.frameId)) {
        chatMap.set(chat.frameId, []);
      }
      chatMap.get(chat.frameId)!.push(chat);
    }

    // 5. Build lookup records perfectly structured to satisfy AppSidebar.tsx requirements
    const projectLookupMap = new Map<string, any>();
    for (const frame of frames) {
      if (!projectLookupMap.has(frame.projectId)) {
        projectLookupMap.set(frame.projectId, {
          projectId: frame.projectId,
          frameId: frame.frameId,
          // Re-map frame data keys straight to chats array targets used by your layout loops
          chats: chatMap.get(frame.frameId) || [],
        });
      }
    }

    // 6. Map baseline schemas returning stable defaults to safeguard React 19 rendering threads
    const results = projects.map((project) => {
      return (
        projectLookupMap.get(project.projectId) || {
          projectId: project.projectId,
          frameId: "",
          chats: [],
        }
      );
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET Projects List Processing Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
