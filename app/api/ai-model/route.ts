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

    const stream = response.data;

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let buffer = "";

        try {
          for await (const chunk of stream) {
            buffer += chunk.toString();

            const lines = buffer.split("\n");

            // keep incomplete line in buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmedLine = line.trim();

              if (!trimmedLine) continue;

              // skip comments or invalid lines
              if (!trimmedLine.startsWith("data:")) continue;

              const message = trimmedLine.replace(/^data:\s*/, "");

              if (message === "[DONE]") {
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(message);

                const content = parsed.choices?.[0]?.delta?.content || "";

                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch (err) {
                console.log("JSON Parse Error:", err);
              }
            }
          }

          controller.close();
        } catch (err) {
          console.log("Streaming error:", err);
          controller.error(err);
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.log("API ERROR:", error?.response?.data || error.message);

    return NextResponse.json(
      {
        error: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
