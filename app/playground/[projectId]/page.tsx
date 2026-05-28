"use client";

import React, { useEffect, useState } from "react";
import PlaygroundHeader from "../_components/PlaygroundHeader";
import ChatSection from "../_components/ChatSection";
import WebsiteDesign from "../_components/WebsiteDesign";
import { useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

export type Frame = {
  projectId: string;
  frameId: string;
  designCode: string;
  chatMessages: Messages[];
};

export type Messages = {
  role: string;
  content: string;
};

function Playground() {
  const { projectId } = useParams();

  const searchParams = useSearchParams();

  const frameId = searchParams.get("frameId");

  const [frameDetail, setFrameDetail] = useState<Frame>();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Messages[]>([]);
  const [generatedCode, setGeneratedCode] = useState("");

  useEffect(() => {
    if (frameId) {
      GetFrameDetails();
    }
  }, [frameId]);

  const GetFrameDetails = async () => {
    try {
      const result = await axios.get(
        `/api/frames?frameId=${frameId}&projectId=${projectId}`,
      );

      console.log(result.data);

      setFrameDetail(result.data);
      const designCode = result.data?.designCode;
      const index = designCode.indexOf("```html") + 7;

      const formatedCode = designCode.slice(index);
      setGeneratedCode(formatedCode);
      if (result.data?.chatMessages?.length === 1) {
        // fixed typo: hatMessages -> chatMessages
        const userMsg = result.data?.chatMessages[0].content;

        SendMessage(userMsg);
      } else {
        setMessages(result.data?.chatMessages || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const SendMessage = async (userInput: string) => {
    try {
      setLoading(true);

      const updatedMessages = [
        ...messages,
        {
          role: "user",
          content: userInput,
        },
      ];

      setMessages(updatedMessages);

      const result = await fetch("/api/ai-model", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: userInput }],
        }),
      });

      const reader = result.body?.getReader();

      if (!reader) return;

      const decoder = new TextDecoder();

      let aiResponse = "";
      let isCode = false;
      let finalCode = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        aiResponse += chunk;

        if (!isCode && aiResponse.includes("```html")) {
          isCode = true;

          const index = aiResponse.indexOf("```html") + 7;

          const initialCode = aiResponse.slice(index);

          finalCode += initialCode;

          setGeneratedCode((prev) => prev + initialCode);
        } else if (isCode) {
          finalCode += chunk;

          setGeneratedCode((prev) => prev + chunk);
        }
      }

      let finalMessages: Messages[] = [];

      if (!isCode) {
        finalMessages = [
          ...updatedMessages,
          {
            role: "assistant",
            content: aiResponse,
          },
        ];
      } else {
        finalMessages = [
          ...updatedMessages,
          {
            role: "assistant",
            content: "Your code is ready!",
          },
        ];
      }

      setMessages(finalMessages);

      await axios.put("/api/chats", {
        messages: finalMessages,
        frameId,
      });

      if (isCode) {
        await SaveGeneratedCode(finalCode);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const SaveMessages = async () => {
    try {
      await axios.put("/api/chats", {
        messages: messages,
        frameId: frameId,
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      SaveMessages();
    }
  }, [messages]);

  const SaveGeneratedCode = async (code: string) => {
    try {
      const result = await axios.put("/api/frames", {
        designCode: code,
        frameId: frameId,
        projectId: projectId,
      });

      console.log(result.data);

      toast.success("Website is Ready!!");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      <PlaygroundHeader />

      <div className="flex bg-gray-50 h-[calc(100vh-73px)]">
        <ChatSection
          messages={messages ?? []}
          onSend={(input: string) => SendMessage(input)}
        />

        <WebsiteDesign code={generatedCode.replace(/```/g, "")} />
      </div>
    </div>
  );
}

export default Playground;
