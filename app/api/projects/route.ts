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
  const { projectId, frameId, messages, credits } = await req.json();

  const user = await currentUser();
  const projectResult = await db.insert(projectTable).values({
    projectId: projectId,
    createdBy: user?.primaryEmailAddress?.emailAddress,
  });
  const frameResult = await db
    .insert(frameTable)
    .values({ frameId: frameId, projectId: projectId });

  const chatResult = await db.insert(chatTable).values({
    chatMessage: messages,
    createdBy: user?.primaryEmailAddress?.emailAddress,
    frameId: frameId,
  });

  const userResult = await db
    .update(usersTable)
    .set({
      credits: credits - 1,
    })
    .where(eq(usersTable.email, user?.primaryEmailAddress?.emailAddress));

  return NextResponse.json({
    projectId,
    frameId,
    messages,
    credits,
  });
}
