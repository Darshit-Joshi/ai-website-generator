"use client";

import React, { useEffect, useState } from "react";
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

// =========================================
// MASTER AI PROMPT
// =========================================

const prompt = `
Prompt:

userInput: {userInput}

Instructions:

1. If the user input is explicitly asking to generate code, design, or HTML/CSS/JS output (e.g., "Create a landing page", "Build a dashboard", "Generate HTML Tailwind CSS code"), then:

    - Generate a complete HTML Tailwind CSS code using Flowbite UI components.
    - Use a modern design with blue as the primary color theme.
    - Only include the <body> content (do not add <head> or <title>).
    - Make it fully responsive for all screen sizes.
    - All primary components must match the theme color.
    - Add proper padding and margin for each element.
    - Components should be independent; do not connect them.
    - Use placeholders for all images:
        - Light mode: https://community.softr.io/uploads/db9113/original/2X/7/74e0e7e302d0ff5d7773ca9a07e6f6f8817a68a6.jpeg
        - Dark mode: https://www.albaky.com/wp-content/uploads/2015/12/placeholder-3.jpg
        - Add alt tag describing the image prompt.
    - Use the following libraries/components where appropriate:
        - FontAwesome icons (fa fa-)
        - Flowbite UI components
        - Chart.js
        - Swiper.js
        - Tippy.js
    - Include interactive components like modals, dropdowns, and accordions.
    - Ensure proper spacing, alignment, hierarchy, and theme consistency.
    - Ensure charts are visually appealing and match the theme color.
    - Header menu options should be spread out and not connected.
    - Do not include broken links.
    - Return ONLY html code inside triple backticks like:

\`\`\`html
<div>...</div>
\`\`\`

    - Do not add explanations.

2. If the user input is general text or greetings (e.g., "Hi", "Hello", "How are you?") or does not explicitly ask to generate code:

    - Respond with a simple friendly message.
`;

function PlaygroundPage() {
  const { projectId } = useParams();
  const searchParams = useSearchParams();
  const frameId = searchParams.get("frameId");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Messages[]>([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [frameDetail, setFrameDetail] = useState<Frame>();
  const [initialPromptSent, setInitialPromptSent] = useState(false);

  // =========================================
  // GET FRAME DETAILS
  // =========================================

  const GetFrameDetails = async () => {
    try {
      setLoading(true);
      const result = await axios.get(
        `/api/frames?frameId=${frameId}&projectId=${projectId}`,
      );
      const data = result.data;
      setFrameDetail(data);
      // =========================
      // SET CHAT
      // =========================
      setMessages(data?.chatMessage || []);
      // =========================
      // HANDLE DESIGN CODE
      // =========================
      const designCode = data?.designCode;
      if (!designCode) {
        setGeneratedCode("");
        return;
      }
      // markdown html block
      if (designCode.includes("```html")) {
        const startIndex = designCode.indexOf("```html") + 7;
        const endIndex = designCode.lastIndexOf("```");
        const cleanCode = designCode.slice(startIndex, endIndex).trim();
        setGeneratedCode(cleanCode);
      } else {
        // raw html
        setGeneratedCode(designCode);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load frame");
    } finally {
      setLoading(false);
    }
  };
  // =========================================
  // SAVE GENERATED CODE
  // =========================================

  const SaveGeneratedCode = async (code: string) => {
    try {
      await axios.put("/api/frames", { designCode: code, frameId, projectId });
      toast.success("Website Ready!");
    } catch (error) {
      console.log(error);
      toast.error("Failed to save code");
    }
  };

  // =========================================
  // SEND MESSAGE
  // =========================================

  const SendMessage = async (userInput: string) => {
    try {
      setLoading(true);

      // =========================
      // CHAT HISTORY (ONLY USER)
      // =========================
      const updatedMessages: Messages[] = [
        ...messages,
        {
          role: "user",
          content: userInput,
        },
      ];

      setMessages(updatedMessages);

      // =========================
      // SYSTEM PROMPT (ONLY ONCE)
      // =========================
      const systemPrompt = prompt.replace("{userInput}", userInput);

      // =========================
      // AI REQUEST
      // =========================
      const response = await fetch("/api/ai-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            ...updatedMessages,
          ],
        }),
      });

      if (!response.ok) throw new Error("AI request failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let aiResponse = "";

      // =========================
      // STREAM
      // =========================
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        aiResponse += chunk;

        // OPTIONAL: live update UI
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: aiResponse,
          };
          return copy;
        });
      }

      // =========================
      // EXTRACT HTML
      // =========================
      const match = aiResponse.match(/```html([\s\S]*?)```/);

      if (!match) {
        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            content: aiResponse,
          },
        ]);
        return;
      }

      const cleanCode = match[1].trim();

      setGeneratedCode(cleanCode);

      const finalMessages: Messages[] = [
        ...updatedMessages,
        {
          role: "assistant",
          content: "Website generated successfully",
        },
      ];

      setMessages(finalMessages);

      await axios.put("/api/chats", { messages: finalMessages, frameId });

      await SaveGeneratedCode(cleanCode);
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // INITIAL FETCH
  // =========================================

  useEffect(() => {
    if (frameId && projectId) {
      GetFrameDetails();
    }
  }, [frameId, projectId]);

  // =========================================
  // AUTO GENERATE FIRST MESSAGE
  // =========================================

  useEffect(() => {
    if (
      frameDetail?.chatMessage?.length === 1 &&
      !frameDetail?.designCode &&
      !initialPromptSent
    ) {
      const firstMsg = frameDetail.chatMessage[0]?.content;
      if (firstMsg) {
        setInitialPromptSent(true);
        SendMessage(firstMsg);
      }
    }
  }, [frameDetail]);

  return (
    <div className="h-screen overflow-hidden">
      {/* HEADER */}
      <PlaygroundHeader />
      {/* MAIN */}
      <div className="flex h-[calc(100vh-73px)] bg-gray-100">
        {/* CHAT */}
        <ChatSection
          messages={messages}
          loading={loading}
          onSend={SendMessage}
        />

        {/* WEBSITE */}
        <WebsiteDesign code={generatedCode} />
      </div>
    </div>
  );
}

export default PlaygroundPage;
