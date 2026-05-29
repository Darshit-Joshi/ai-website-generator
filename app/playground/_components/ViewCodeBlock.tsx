"use client";

import React, { useState, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// Performance optimization: import the minimalist vscDarkPlus style map to reduce production build footprint
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Code2Icon, Copy, Check, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  code?: string;
};

function ViewCodeBlock({ code }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Safely normalize raw dynamic string contents protecting React 19 rendering streams
  const safeCodePayload = code?.trim() || "";

  // ==========================================
  // SAFE PRODUCTION ASSET COPY WORKER
  // ==========================================
  const copyToClipboard = useCallback(async () => {
    if (!safeCodePayload) {
      toast.error("No code content available to copy yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(safeCodePayload);
      setCopied(true);
      toast.success("Source code copied to system clipboard!");

      // Revert icon display identity smoothly back to baseline reference
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard operational write failure:", err);
      toast.error("Failed to copy source content to clipboard");
    }
  }, [safeCodePayload]);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="rounded-xl font-medium text-xs gap-1.5 shadow-sm h-9"
        variant="outline"
      >
        <span>View Code</span>
        <Code2Icon className="h-4 w-4 text-muted-foreground" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col gap-4 bg-background p-6 rounded-xl shadow-2xl">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-3 shrink-0">
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                Generated Source Code
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review or copy production-ready single-file HTML5/Tailwind
                layout contexts.
              </p>
            </div>

            {/* INTEGRATED UTILITY ACTIONS SLAG */}
            {safeCodePayload && (
              <Button
                size="sm"
                variant="secondary"
                onClick={copyToClipboard}
                className="h-8 rounded-lg font-semibold text-xs gap-1.5 transition-all mr-6"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-500 stroke-[3]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </Button>
            )}
          </DialogHeader>

          {/* CODE INTERACTIVE ELEMENT DISPLAY CONTAINER */}
          <div className="flex-1 overflow-auto rounded-xl bg-[#1e1e1e] border shadow-inner min-h-0 relative group">
            {safeCodePayload ? (
              <SyntaxHighlighter
                language="html"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: "1.25rem",
                  fontSize: "0.85rem",
                  lineHeight: "1.5",
                  fontFamily: "var(--font-mono, monospace)",
                  background: "transparent",
                  width: "100%",
                  height: "100%",
                }}
                wrapLines={true}
                wrapLongLines={true}
              >
                {safeCodePayload}
              </SyntaxHighlighter>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-2">
                <Loader2 className="animate-spin h-5 w-5 text-primary/70" />
                <p className="text-sm font-medium text-muted-foreground">
                  Assembling visual workspace blocks...
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ViewCodeBlock;
