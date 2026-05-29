import { db } from "@/config/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    const email = user?.primaryEmailAddress?.emailAddress;

    if (!user || !email) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    const userResult = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (userResult.length === 0) {
      const newUser = {
        name: user.fullName ?? "NA",
        email,
        credits: 2,
      };

      await db.insert(usersTable).values(newUser);

      return NextResponse.json({ user: newUser });
    }

    return NextResponse.json({ user: userResult[0] });
  } catch (error) {
    console.error("USER API ERROR:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
