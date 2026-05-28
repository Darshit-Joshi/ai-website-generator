import React, { useState } from "react";
import { Messages } from "../[projectId]/page";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

type Props = {
  messages: Messages[];
  onSend: any;
};

function ChatSection({ messages, onSend }: Props) {
  const [input, setInput] = useState<string>();
  const handleSend = () => {
    if (!input?.trim()) return;
    onSend(input);
    setInput("");
  };
  return (
    <div className="w-96 shadow h-[91-vh] p-4 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
        {messages?.length === 0 ? (
          <p className="text-gray-500 text-center">No Messages</p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role == "user" ? "justify-end" : " justify-start"}`}
            >
              <div
                className={`p-2 rounded-lg max-w-[80%] ${msg.role === "user" ? "bg-white text-black" : "bg-gray-300 text-black "}`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t flex items-center gap-2">
        <textarea
          value={input}
          className="flex-1 resize-none border rounded-lg px-2 py-3 focus:outline-none focus:ring-2"
          placeholder="Describe your website Design idea"
          onChange={(event) => setInput(event.target.value)}
        />
        <Button onClick={handleSend}>
          <ArrowUp />
        </Button>
      </div>
    </div>
  );
}

export default ChatSection;
