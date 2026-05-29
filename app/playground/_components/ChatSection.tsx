"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2 } from "lucide-react";

// Explicit internal typing decoupling brittle cross-folder page imports
export type Messages = {
  role: string;
  content: string;
};

type Props = {
  messages: Messages[];
  loading: boolean;
  onSend: (input: string) => void;
};

function ChatSection({ messages, loading, onSend }: Props) {
  const [input, setInput] = useState<string>("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Automatically anchors layout to the latest conversational line during active AI streaming
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="w-96 shadow h-[calc(100vh-73px)] p-4 flex flex-col bg-white border-r">
      {/* CHAT AREA WITH VIEWPORT REFERENCE */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto p-2 space-y-4 flex flex-col scroll-smooth"
      >
        {messages?.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <p className="text-sm font-medium text-muted-foreground">
              No Messages yet. Describe your layout vision to initialize
              generation!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === "user";
            // Combine role and structural criteria to create a stable rendering descriptor identity key
            const uniqueKey = `${msg.role}-${index}`;

            // Prevent blank message bubbles if placeholder containers render prematurely
            if (!msg.content && msg.role === "assistant" && !loading)
              return null;

            return (
              <div
                key={uniqueKey}
                className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3 rounded-xl max-w-[85%] text-sm leading-relaxed shadow-sm whitespace-pre-wrap select-text break-words ${
                    isUser
                      ? "bg-primary text-primary-foreground font-medium rounded-tr-none"
                      : "bg-muted text-muted-foreground border rounded-tl-none"
                  }`}
                >
                  {msg.content || (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
                      Analyzing structure...
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* LOADING ANIMATION CONTAINER */}
        {loading && (
          <div className="flex justify-start w-full">
            <div className="bg-muted text-muted-foreground border p-3 rounded-xl rounded-tl-none shadow-sm flex items-center justify-center">
              <Loader2 className="animate-spin h-4 w-4 text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="pt-3 border-t flex items-end gap-2 bg-white">
        <textarea
          value={input}
          rows={2}
          disabled={loading}
          className="flex-1 resize-none border rounded-xl px-3 py-2 text-sm bg-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Describe changes or a website design idea..."
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <Button
          disabled={loading || !input.trim()}
          onClick={handleSend}
          size="icon"
          className="rounded-xl h-9 w-9 shrink-0"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default ChatSection;
