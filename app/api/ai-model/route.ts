import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const response = await axios({
      method: "post",
      url: "https://openrouter.ai/api/v1/chat/completions",
      data: {
        model: "openai/gpt-4o-mini",
        messages,
        stream: true,
      },
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Website Builder",
      },
      responseType: "stream",
    });

    const encoder = new TextEncoder();
    const stream = response.data;

    const readable = new ReadableStream({
      start(controller) {
        let buffer = "";

        stream.on("data", (chunk: Buffer) => {
          buffer += chunk.toString();

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const data = trimmed.replace("data: ", "");

            if (data === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const json = JSON.parse(data);
              const content = json?.choices?.[0]?.delta?.content;

              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch (err) {
              // ignore broken chunks safely
            }
          }
        });

        stream.on("end", () => controller.close());
        stream.on("error", (err: any) => controller.error(err));
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.log("API ERROR:", error?.response?.data || error.message);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
