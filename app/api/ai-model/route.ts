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

    // --- HARMONIZED SYSTEM INSTRUCTION MATCHING XML COMPILATION SPEC ---
    const dynamicRoutingSystemPrompt = {
      role: "system",
      content: `You are an elite, award-winning Full-Stack Web Architect and UI/UX Engineer specialized in standard web workspace generation.
      Analyze the user's requirements to determine whether they need a single landing module or a structural multi-page website system.

      CRITICAL WORKSPACE TAG ARCHITECTURE RULES:
      1. If the intent is basic, focus strictly on generating one file layout named "index.html".
      2. If the prompt implies multi-page structures (e.g., "SaaS engine with pricing tab", "E-commerce directory with a product info detail page"), architect an interconnected environment workspace.
      3. Every page layout generated MUST be entirely self-contained and explicitly wrapped inside custom XML tags exactly like this:
         <file name="index.html">
           </file>
         <file name="pricing.html">
           </file>

      HIGH-END VISUAL DESIGN SPECIFICATIONS (Tailwind CSS):
      - Typography & Spacing: Enforce bold visual hierarchy, using large clear headers and generous padding tokens (e.g. 'py-24 px-8').
      - Visual Assets: Use mesh gradients, background text clips ('bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'), glassmorphic containers ('backdrop-blur-md bg-white/10 border border-white/20'), and subtle pattern patterns.
      - Interactive Elements: Apply rich interactive standard transition states (e.g. 'hover:scale-[1.02] active:scale-98 transition-all duration-300 ease-out').

      CROSS-PAGE ROUTING INTERACTION (Only for multi-file workspace scopes):
      - Do NOT use standard anchor layout href attributes like '<a href="/about.html">'.
      - Instead, use explicit functional click triggers calling the workspace environment page management runtime handler: onclick="window.navigatePage('pageName.html')".
      - Example multi-page link layout: <button onclick="window.navigatePage('about.html')" class="hover:text-indigo-500 transition-colors">About Us</button>

      ASSET RULES:
      - Icons: Write direct Lucide or FontAwesome native class strings (e.g. <i class="fas fa-cookie-bite"></i>) that resolve safely inside raw browser DOM windows.
      - Images: Use highly descriptive, context-specific Unsplash production strings: <img src="https://images.unsplash.com/photo-[id]?auto=format&fit=crop&w=800&q=80" alt="Detailed Description" />.

      Do NOT return markdown code blocks blocks (e.g. \`\`\`html) or base template boilerplate wrapping tags like <html>, <head>, or <body>. 
      Output ONLY clean, functional, componentized inner child structures mapped within the requested <file name="..."> tags.`,
    };

    const structuredMessages = [dynamicRoutingSystemPrompt, ...messages];

    const response = await axios({
      method: "post",
      url: "https://openrouter.ai/api/v1/chat/completions",
      data: {
        model: "openai/gpt-4o-mini",
        messages: structuredMessages,
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
              // Ignore partial chunk boundaries
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
              // Ignore boundary errors
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
        "X-Accel-Buffering": "no",
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
