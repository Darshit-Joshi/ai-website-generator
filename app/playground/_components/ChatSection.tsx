"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";

interface Messages {
  role: string;
  content: string;
}

interface ChatSectionProps {
  messages: Messages[];
  loading: boolean;
  onSend: (userInput: string) => void;
}

export default function ChatSection({
  messages,
  loading,
  onSend,
}: ChatSectionProps) {
  const [prompt, setPrompt] = useState("");

  const handleSendPrompt = () => {
    if (!prompt.trim() || loading) return;

    // Trigger the master coordinator's streaming pipeline directly
    onSend(prompt.trim());
    setPrompt(""); // Clear the input field for the next instructions
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-900 w-[360px] text-zinc-100 shrink-0">
      {/* CHAT MESSAGES DISPLAY RAIL */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
        {messages.map((msg, index) => {
          // Bypassing system instructions from rendering in the visible chat UI list
          if (msg.role === "system") return null;

          return (
            <div
              key={index}
              className={`flex flex-col gap-1 p-3 rounded-xl max-w-[85%] text-sm animate-in fade-in-50 duration-200 ${
                msg.role === "user"
                  ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 ml-auto"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-300"
              }`}
            >
              <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase select-none">
                {msg.role === "user" ? "You" : "Architect Engine"}
              </span>
              <div className="whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT CONTROLS SYSTEM PANEL */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/50 backdrop-blur-md">
        <div className="relative border border-zinc-800 rounded-xl bg-zinc-900/40 overflow-hidden focus-within:border-zinc-700 transition-all">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe adjustments, add features, or new pages..."
            disabled={loading}
            className="w-full bg-transparent border-0 resize-none px-4 py-3 min-h-[80px] text-sm text-zinc-200 placeholder-zinc-500 focus-visible:ring-0 disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt();
              }
            }}
          />
          <div className="flex items-center justify-between px-4 pb-2 pt-1 text-xs text-zinc-500 select-none">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Multi-page active
            </span>
            <Button
              size="icon"
              disabled={loading || !prompt.trim()}
              onClick={handleSendPrompt}
              className="bg-indigo-600 hover:bg-indigo-500 text-white w-7 h-7 rounded-lg transition-colors disabled:bg-zinc-800 disabled:text-zinc-600"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
