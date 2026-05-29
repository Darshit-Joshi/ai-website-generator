"use client";

import React, { useEffect, useState } from "react";
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

  // =========================
  // CLEAN CODE (SAFE ONLY)
  // =========================
  const finalCode = (() => {
    if (!generatedCode) return "<div>No content</div>";

    return generatedCode.trim();
  })();

  // =========================
  // VIEW
  // =========================
  const ViewInNewTab = () => {
    if (!finalCode) {
      toast.error("No code available");
      return;
    }

    const blob = new Blob([finalCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // =========================
  // DOWNLOAD
  // =========================
  const downloadCode = () => {
    if (!finalCode) {
      toast.error("No code available");
      return;
    }

    const blob = new Blob([finalCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    toast.success("Downloaded");
  };

  // =========================
  // COPY
  // =========================
  const CopyCode = async () => {
    try {
      await navigator.clipboard.writeText(finalCode);
      setCopied(true);
      toast.success("Copied");

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  // =========================
  // REFRESH
  // =========================
  const RefreshPreview = () => {
    window.location.reload();
  };

  return (
    <div className="mt-4 flex w-full items-center justify-between rounded-2xl border bg-white p-3 shadow-sm">
      {/* SCREEN SIZE */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className={`rounded-xl border transition-all ${
            selectedScreenSize === "web"
              ? "border-primary bg-primary/10"
              : "border-transparent"
          }`}
          onClick={() => setSelectedScreenSize("web")}
        >
          <Monitor className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          className={`rounded-xl border transition-all ${
            selectedScreenSize === "mobile"
              ? "border-primary bg-primary/10"
              : "border-transparent"
          }`}
          onClick={() => setSelectedScreenSize("mobile")}
        >
          <Smartphone className="h-4 w-4" />
        </Button>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={ViewInNewTab} className="rounded-xl">
          View
          <SquareArrowOutUpRight className="ml-2 h-4 w-4" />
        </Button>

        <ViewCodeBlock code={finalCode} />

        <Button variant="outline" onClick={CopyCode} className="rounded-xl">
          {copied ? (
            <>
              Copied <Check className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Copy <Copy className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>

        <Button onClick={downloadCode} className="rounded-xl">
          Download
          <Download className="ml-2 h-4 w-4" />
        </Button>

        <Button variant="ghost" onClick={RefreshPreview} className="rounded-xl">
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default WebpageTools;
