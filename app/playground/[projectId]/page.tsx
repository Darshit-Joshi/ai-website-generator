"use client";

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useParams, useSearchParams } from "next/navigation";
import PlaygroundHeader from "../_components/PlaygroundHeader";
import ChatSection from "../_components/ChatSection";
import WebsiteDesign from "../_components/WebsiteDesign";

export type Messages = {
  role: string;
  content: string;
};

export type Frame = {
  projectId: string;
  frameId: string;
  designCode: string;
  chatMessage: Messages[];
};

// ===============================
// MASTER PROMPT
// ===============================
const prompt = `
You are a senior frontend engineer and UI designer.

userInput: {userInput}

========================
TASK RULES
========================

If the user asks to generate a website, UI, dashboard, landing page, or any design/code:

- Generate a COMPLETE SINGLE-FILE WEBSITE
- Include full HTML document structure:
  <!DOCTYPE html>, <html>, <head>, <body>

- Use Tailwind CSS via CDN:
  <script src="https://cdn.tailwindcss.com"></script>

- Add minimal but modern UI design (clean, startup style)
- Make it FULLY RESPONSIVE (mobile + tablet + desktop)
- Use modern layout patterns (grid, flex, cards, sections)
- Add basic interactivity using vanilla JavaScript when needed
- Use FontAwesome CDN if icons are required

- Use placeholder images when needed:
  https://community.softr.io/uploads/db9113/original/2X/7/74e0e7e302d0ff5d7773ca9a07e6f6f8817a68a6.jpeg

========================
OUTPUT RULES (VERY IMPORTANT)
========================

- Return ONLY ONE code block
- No explanation
- No text before or after
- Always wrap output like this:

\`\`\`html
<!DOCTYPE html>
<html>
...
</html>
\`\`\`

========================
NON-CODE REQUESTS
========================

If the user is not asking for code:
- respond normally in short helpful text
`;

function PlaygroundPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const projectId =
    typeof params?.projectId === "string"
      ? params.projectId
      : Array.isArray(params?.projectId)
        ? params.projectId[0]
        : undefined;

  const frameId = searchParams.get("frameId") || undefined;

  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Messages[]>([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [frameDetail, setFrameDetail] = useState<Frame | null>(null);
  const [initialPromptSent, setInitialPromptSent] = useState(false);

  // ===============================
  // GET FRAME
  // ===============================
  const GetFrameDetails = useCallback(async () => {
    if (!frameId || !projectId) return;

    try {
      setLoading(true);

      const result = await axios.get(
        `/api/frames?frameId=${frameId}&projectId=${projectId}`,
      );

      const data = result.data;
      setFrameDetail(data);

      setMessages(data?.chatMessage || []);

      const designCode = data?.designCode;

      if (!designCode) {
        setGeneratedCode("");
        return;
      }

      if (designCode.includes("```html")) {
        const start = designCode.indexOf("```html") + 7;
        const end = designCode.lastIndexOf("```");
        setGeneratedCode(designCode.slice(start, end).trim());
      } else {
        setGeneratedCode(designCode);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load frame");
    } finally {
      setLoading(false);
    }
  }, [frameId, projectId]);

  // ===============================
  // SAVE CODE
  // ===============================
  const SaveGeneratedCode = async (code: string) => {
    try {
      await axios.put("/api/frames", {
        designCode: code,
        frameId,
        projectId,
      });

      toast.success("Website Ready!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save code");
    }
  };

  // ===============================
  // SEND MESSAGE
  // ===============================
  const SendMessage = async (userInput: string) => {
    if (!frameId || !projectId) return;

    try {
      setLoading(true);

      const updatedMessages: Messages[] = [
        ...messages,
        { role: "user", content: userInput },
      ];

      setMessages(updatedMessages);

      const systemPrompt = prompt.replace("{userInput}", userInput);

      const response = await fetch("/api/ai-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...updatedMessages,
          ],
        }),
      });

      if (!response.ok) throw new Error("AI request failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();

      let aiResponse = "";

      // create assistant placeholder (IMPORTANT FIX)
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        aiResponse += decoder.decode(value, { stream: true });

        setMessages((prev) => {
          const copy = [...prev];
          const lastIndex = copy.length - 1;

          copy[lastIndex] = {
            role: "assistant",
            content: aiResponse,
          };

          return copy;
        });
      }

      // ===============================
      // EXTRACT HTML
      // ===============================
      const match = aiResponse.match(/```html\s*([\s\S]*?)```/i);

      const finalMessages: Messages[] = [
        ...updatedMessages,
        {
          role: "assistant",
          content: match ? "Website generated successfully" : aiResponse,
        },
      ];

      setMessages(finalMessages);

      await axios.put("/api/chats", {
        messages: finalMessages,
        frameId,
      });

      if (match) {
        const cleanCode = match[1].trim();
        setGeneratedCode(cleanCode);
        await SaveGeneratedCode(cleanCode);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // INITIAL LOAD
  // ===============================
  useEffect(() => {
    GetFrameDetails();
  }, [GetFrameDetails]);

  // ===============================
  // AUTO FIRST PROMPT
  // ===============================
  useEffect(() => {
    if (
      frameDetail?.chatMessage?.length === 1 &&
      !frameDetail?.designCode &&
      !initialPromptSent
    ) {
      const first = frameDetail.chatMessage[0]?.content;

      if (first) {
        setInitialPromptSent(true);
        SendMessage(first);
      }
    }
  }, [frameDetail, initialPromptSent]);

  return (
    <div className="h-screen overflow-hidden">
      <PlaygroundHeader />

      <div className="flex h-[calc(100vh-73px)] bg-gray-100">
        <ChatSection
          messages={messages}
          loading={loading}
          onSend={SendMessage}
        />

        <WebsiteDesign code={generatedCode} />
      </div>
    </div>
  );
}

export default PlaygroundPage;
