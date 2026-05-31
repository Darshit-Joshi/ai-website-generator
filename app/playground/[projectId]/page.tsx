"use client";

import React, { useEffect, useState, useCallback, use } from "react";
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

// Re-aligned with a single source of truth format instructions matching the system prompt handler
const baseSystemInstructions = `You are an elite, award-winning Full-Stack Web Architect and UI/UX Engineer. Your goal is to analyze the user's input and generate an exceptionally high-fidelity, professional website layout.

CRITICAL ARCHITECTURAL RULES:
1. Evaluate the user's intent. If they request a simple concept (e.g., "a single landing page", "a portfolio"), focus purely on one master file: "index.html".
2. If they request or imply distinct layout scopes (e.g., "SaaS platform with pricing", "E-commerce with an about page"), architect a cohesive multi-page workspace structure.
3. Every page layout generated MUST be entirely self-contained and wrapped inside an explicit custom XML tag format exactly like this:
   <file name="index.html">
   </file>
   <file name="pricing.html">
   </file>

HIGH-END VISUAL DESIGN REQUIREMENTS (Tailwind CSS):
- Typography & Spacing: Enforce dramatic visual hierarchy. Use oversized, bold headings, meticulous element padding (e.g., 'py-24 px-8'), and high contrast.
- Visual Assets: Do NOT use plain solid background blocks. Use modern styling patterns like mesh gradients, text clips ('bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'), glassmorphism surfaces ('backdrop-blur-md bg-white/10 border border-white/20'), and subtle noise/grid background designs.
- Interactions: Add premium fluid micro-interactions onto every clickable item using Tailwind transitions (e.g., 'hover:scale-[1.02] active:scale-98 transition-all duration-300 ease-out').

ASSET INTEGRATION & SANDBOX COMPATIBILITY RULES:
- Icons: You have full access to FontAwesome or Lucide icon class mappings. Instead of using React component imports, write them as modern decorative elements or direct FontAwesome native classes (e.g., <i class="fas fa-cookie-bite"></i>) where applicable, ensuring they evaluate correctly in a pure web environment.
- Images: Never leave standard empty grey boxes. Always use high-quality descriptive Unsplash image tags structured like: <img src="https://images.unsplash.com/photo-[id]?auto=format&fit=crop&w=800&q=80" alt="Detailed Description" /> using contextually relevant photos.
- CODE RESTRAINT: Do NOT output markdown code blocks (e.g., \`\`\`html) or raw wrapping boilerplate like <html>, <head>, or <body> tags. Output ONLY the clean, ready-to-render inner functional DOM structures inside your respective <file name="..."> tags. Ensure every component block feels complete, polished, and ready for deployment.`;

export const dynamic = "force-dynamic";

export default function PlaygroundPage() {
  const rawParams = useParams();
  const rawSearchParams = useSearchParams();

  const unwrappedParams =
    rawParams instanceof Promise ? use(rawParams) : rawParams;
  const unwrappedSearchParams =
    rawSearchParams instanceof Promise ? use(rawSearchParams) : rawSearchParams;

  const projectId =
    typeof unwrappedParams?.projectId === "string"
      ? unwrappedParams.projectId
      : Array.isArray(unwrappedParams?.projectId)
        ? unwrappedParams.projectId[0]
        : undefined;

  const frameId = unwrappedSearchParams?.get("frameId") || undefined;

  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Messages[]>([]);
  const [generatedCode, setGeneratedCode] = useState("");
  const [frameDetail, setFrameDetail] = useState<Frame | null>(null);
  const [initialPromptSent, setInitialPromptSent] = useState(false);

  const SaveGeneratedCode = useCallback(
    async (code: string) => {
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
    },
    [frameId, projectId],
  );

  const SendMessage = useCallback(
    async (userInput: string) => {
      if (!frameId || !projectId) return;

      try {
        setLoading(true);
        let currentHistory: Messages[] = [];

        setMessages((prev) => {
          const updated = [...prev, { role: "user", content: userInput }];
          currentHistory = updated;
          return updated;
        });

        const completeSystemPrompt = `${baseSystemInstructions}\n\nUser Context and Requirements:\n${userInput}`;

        const response = await fetch("/api/ai-model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: completeSystemPrompt },
              ...currentHistory,
            ],
          }),
        });

        if (!response.ok) throw new Error("AI request failed");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No stream available");

        const decoder = new TextDecoder();
        let aiResponse = "";

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚡ Analyzing website architecture requirements and building canvas layout tabs...",
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          aiResponse += decoder.decode(value, { stream: true });
          setGeneratedCode(aiResponse);
        }

        const finalMessages: Messages[] = [
          ...currentHistory,
          {
            role: "assistant",
            content:
              "✨ Architecture assembly complete! Use the selector tabs on the preview window to explore and modify your workspace layout design.",
          },
        ];

        setMessages(finalMessages);

        await axios.put("/api/chats", {
          messages: finalMessages,
          frameId,
        });

        await SaveGeneratedCode(aiResponse);
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong processing your message");
      } finally {
        setLoading(false);
      }
    },
    [frameId, projectId, SaveGeneratedCode],
  );

  const GetFrameDetails = useCallback(async () => {
    if (!frameId || !projectId) return;

    try {
      setLoading(true);
      const result = await axios.get(
        `/api/frames?frameId=${frameId}&projectId=${projectId}`,
      );
      const data = result.data as Frame;
      setFrameDetail(data);
      setMessages(data?.chatMessage || []);
      setGeneratedCode((data?.designCode || "").trim());
    } catch (err) {
      console.error(err);
      toast.error("Failed to load layout context frame");
    } finally {
      setLoading(false);
    }
  }, [frameId, projectId]);

  useEffect(() => {
    GetFrameDetails();
  }, [GetFrameDetails]);

  useEffect(() => {
    if (
      frameDetail &&
      frameDetail.chatMessage?.length === 1 &&
      !frameDetail.designCode &&
      !initialPromptSent
    ) {
      const firstPromptText = frameDetail.chatMessage[0]?.content;
      if (firstPromptText) {
        setInitialPromptSent(true);
        SendMessage(firstPromptText);
      }
    }
  }, [frameDetail, initialPromptSent, SendMessage]);

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
