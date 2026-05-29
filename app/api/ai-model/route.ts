import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages payload array is required" },
        { status: 400 },
      );
    }

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
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AI Website Builder",
      },
      responseType: "stream",
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8", { fatal: false });
    const stream = response.data;

    const readable = new ReadableStream({
      start(controller) {
        let buffer = "";

        stream.on("data", (chunk: Buffer) => {
          // Decode incoming fragments into unified safe string patterns
          buffer += decoder.decode(chunk, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const dataContent = trimmed.replace(/^data:\s*/, "");

            if (dataContent === "[DONE]") {
              controller.close();
              return;
            }

            try {
              const json = JSON.parse(dataContent);
              const content = json?.choices?.[0]?.delta?.content;

              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch (err) {
              // Gracefully bypass structural anomalies within rapid streaming updates
            }
          }
        });

        stream.on("end", () => {
          if (buffer.trim().startsWith("data:")) {
            try {
              const dataContent = buffer.trim().replace(/^data:\s*/, "");
              if (dataContent !== "[DONE]") {
                const json = JSON.parse(dataContent);
                const content = json?.choices?.[0]?.delta?.content;
                if (content) controller.enqueue(encoder.encode(content));
              }
            } catch (e) {
              // Ignore boundary string remainders
            }
          }
          controller.close();
        });

        stream.on("error", (err: any) => controller.error(err));
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disables compression layer throttling on Vercel/Nginx networks
      },
    });
  } catch (error: any) {
    console.error(
      "OpenRouter Stream Router Error:",
      error?.response?.data || error.message,
    );
    return NextResponse.json(
      { error: "Something went wrong processing your AI model stream request" },
      { status: 500 },
    );
  }
}
