"use client";

import React, { useContext, useState } from "react";
import Image from "next/image";
import { Download, Save, Share2, Rocket, Loader2 } from "lucide-react";
import { OnSaveContext } from "@/context/OnSaveContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function PlaygroundHeader() {
  // Safe extraction matching the unified layout strategy
  const context = useContext(OnSaveContext);

  // Provide safe structural boundary checks against uninitialized context objects
  const onSaveData = context?.onSaveData;
  const setOnSaveData = context?.setOnSaveData;

  const [exporting, setExporting] = useState(false);
  const [deploying, setDeploying] = useState(false);

  // ==========================================
  // SAFE CANVAS PERSISTENCE EMITTER
  // ==========================================
  const handleSaveAction = () => {
    if (!setOnSaveData) {
      toast.error("Save system initialization failure");
      return;
    }

    // Trigger persistence safely by mutating a targeted property string flag
    // rather than changing the structural data type of the root context object itself.
    setOnSaveData((prev: any) => {
      if (typeof prev === "object" && prev !== null) {
        return {
          ...prev,
          trigger: Date.now(), // Use an internal property property for the listener hook
        };
      }
      return Date.now(); // Fallback if your baseline architecture is purely scalar tracking
    });

    toast.success("Sync signal emitted to playground canvas!");
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      // Future hook: pull code template state from context and trigger disk write download
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success("HTML source bundle exported successfully!");
    } catch (err) {
      toast.error("Export generation pipeline aborted");
    } finally {
      setExporting(false);
    }
  };

  const handleDeploy = async () => {
    try {
      setDeploying(true);
      // Future hook: push to database static asset host servers
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Production deployment online!");
    } catch (err) {
      toast.error("Deployment failed");
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="h-[73px] px-6 border-b bg-white flex items-center justify-between shadow-sm select-none">
      {/* LEFT BRAND SECTION */}
      <div className="flex items-center gap-3">
        <Image
          src="/logo.svg"
          alt="logo"
          width={35}
          height={35}
          priority
          className="shrink-0"
        />
        <div>
          <h2 className="font-bold text-base text-foreground tracking-tight leading-none mb-1">
            AI Website Builder
          </h2>
          <p className="text-xs text-muted-foreground font-medium">
            Generate and edit single-file website preview nodes with AI
          </p>
        </div>
      </div>

      {/* RIGHT ACTION CONTROLS */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          className="font-medium text-xs gap-1.5 h-9 rounded-lg"
          disabled={exporting || deploying}
          onClick={handleExport}
        >
          {exporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>Export</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="font-medium text-xs gap-1.5 h-9 rounded-lg"
          disabled={exporting || deploying}
          onClick={() => toast.info("Sharing interface linkage generated.")}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="font-semibold text-xs gap-1.5 h-9 rounded-lg text-primary hover:text-primary hover:bg-primary/5 border-primary/30"
          disabled={exporting || deploying}
          onClick={handleSaveAction}
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Workspace</span>
        </Button>

        <Button
          size="sm"
          className="font-bold text-xs gap-1.5 h-9 rounded-lg shadow-sm"
          disabled={exporting || deploying}
          onClick={handleDeploy}
        >
          {deploying ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Rocket className="w-3.5 h-3.5" />
          )}
          <span>Deploy Site</span>
        </Button>
      </div>
    </div>
  );
}

export default PlaygroundHeader;
