import React, { useState } from "react";
import { Messages } from "../[projectId]/page";
import { Button } from "@/components/ui/button";
import { ArrowUp, Loader2 } from "lucide-react";

type Props = {
  messages: Messages[];
  loading: boolean;
  onSend: (input: string) => void;
};

function ChatSection({ messages, loading, onSend }: Props) {
  const [input, setInput] = useState<string>("");

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="w-96 shadow h-[calc(100vh-73px)] p-4 flex flex-col bg-white">
      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
        {messages?.length === 0 ? (
          <p className="text-gray-500 text-center">No Messages</p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-lg max-w-[80%] whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-white border text-black"
                    : "bg-gray-200 text-black"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 p-3 rounded-lg">
              <Loader2 className="animate-spin h-4 w-4" />
            </div>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="p-3 border-t flex items-end gap-2">
        <textarea
          value={input}
          rows={2}
          disabled={loading}
          className="flex-1 resize-none border rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
          placeholder="Describe your website design idea..."
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <Button disabled={loading} onClick={handleSend}>
          <ArrowUp />
        </Button>
      </div>
    </div>
  );
}

export default ChatSection;
