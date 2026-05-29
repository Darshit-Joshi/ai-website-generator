"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  Copy,
  Download,
  Monitor,
  RefreshCcw,
  Smartphone,
  SquareArrowOutUpRight,
} from "lucide-react";
import { toast } from "sonner";
import ViewCodeBlock from "./ViewCodeBlock";

type Props = {
  selectedScreenSize: string;
  setSelectedScreenSize: (value: string) => void;
  generatedCode: string;
};

function WebpageTools({
  selectedScreenSize,
  setSelectedScreenSize,
  generatedCode,
}: Props) {
  const [copied, setCopied] = useState(false);

  // Normalize raw template input blocks cleanly protecting downstream file formats
  const cleanCodePayload = generatedCode?.trim() || "";

  // ==========================================
  // VIEW IN NEW TAB (BLOB GENERATION)
  // ==========================================
  const ViewInNewTab = () => {
    if (!cleanCodePayload) {
      toast.error("No website source code available to preview yet.");
      return;
    }

    const blob = new Blob([cleanCodePayload], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    // Revoke object URLs cleanly inside a background thread loop to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // ==========================================
  // FILE BUNDLE STREAM WRITER
  // ==========================================
  const downloadCode = () => {
    if (!cleanCodePayload) {
      toast.error("Cannot export an uninitialized canvas frame.");
      return;
    }

    const blob = new Blob([cleanCodePayload], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const anchorNode = document.createElement("a");
    anchorNode.href = url;
    anchorNode.download = "index.html";
    document.body.appendChild(anchorNode);
    anchorNode.click();

    // Clean up DOM references immediately after trigger
    document.body.removeChild(anchorNode);
    URL.revokeObjectURL(url);

    toast.success("Project index.html file saved successfully!");
  };

  // ==========================================
  // SAFE MEMORY SYSTEM CLIPBOARD WRITER
  // ==========================================
  const CopyCode = useCallback(async () => {
    if (!cleanCodePayload) {
      toast.error("No code text available to extract.");
      return;
    }

    try {
      await navigator.clipboard.writeText(cleanCodePayload);
      setCopied(true);
      toast.success("Source context copied to clipboard!");

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard capture failure:", err);
      toast.error("System configuration blocked clipboard write actions.");
    }
  }, [cleanCodePayload]);

  // ==========================================
  // ASYNC PREVIEW RE-RENDERING (EVENT SIGNAL)
  // ==========================================
  const RefreshPreview = () => {
    if (!cleanCodePayload) {
      toast.info("Canvas preview is already clean.");
      return;
    }

    // Instead of forcing a destructive window reload, dispatch a global event signal.
    // Your WebsiteDesign.tsx iframe component can listen for this to re-render its iframe source safely.
    const refreshSignalEvent = new CustomEvent("generator-preview-reload");
    window.dispatchEvent(refreshSignalEvent);

    toast.success("Canvas workspace view refreshed.");
  };

  return (
    <div className="mt-4 flex w-full items-center justify-between rounded-2xl border bg-white p-3 shadow-sm select-none">
      {/* SCREEN SIZE VIEWPORT SELECTORS */}
      <div className="flex items-center gap-1.5 bg-muted/20 p-1 rounded-xl border">
        <Button
          variant={selectedScreenSize === "web" ? "secondary" : "ghost"}
          size="sm"
          className={`h-8 w-10 rounded-lg transition-all p-0 ${
            selectedScreenSize === "web"
              ? "shadow-sm border font-semibold text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setSelectedScreenSize("web")}
          title="Switch to Desktop Mode"
        >
          <Monitor className="h-4 w-4" />
        </Button>

        <Button
          variant={selectedScreenSize === "mobile" ? "secondary" : "ghost"}
          size="sm"
          className={`h-8 w-10 rounded-lg transition-all p-0 ${
            selectedScreenSize === "mobile"
              ? "shadow-sm border font-semibold text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setSelectedScreenSize("mobile")}
          title="Switch to Mobile Responsive Mode"
        >
          <Smartphone className="h-4 w-4" />
        </Button>
      </div>

      {/* CORE INTERACTIVE LAYOUT ACTIONS */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={ViewInNewTab}
          className="rounded-xl text-xs font-medium h-9 gap-1.5"
          disabled={!cleanCodePayload}
        >
          <span>Live Preview</span>
          <SquareArrowOutUpRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>

        <ViewCodeBlock code={cleanCodePayload} />

        <Button
          variant="outline"
          size="sm"
          onClick={CopyCode}
          className="rounded-xl text-xs font-medium h-9 min-w-[5.5rem] gap-1.5"
          disabled={!cleanCodePayload}
        >
          {copied ? (
            <>
              <span>Copied</span>
              <Check className="h-3.5 w-3.5 text-green-500 stroke-[3]" />
            </>
          ) : (
            <>
              <span>Copy Code</span>
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            </>
          )}
        </Button>

        <Button
          size="sm"
          onClick={downloadCode}
          className="rounded-xl text-xs font-bold h-9 gap-1.5 shadow-sm"
          disabled={!cleanCodePayload}
        >
          <span>Export Source</span>
          <Download className="h-3.5 w-3.5" />
        </Button>

        <div className="border-l pl-2 ml-1 h-6 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={RefreshPreview}
            className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Refresh Viewport Sandbox"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WebpageTools;
