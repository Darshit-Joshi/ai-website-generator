"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
} from "react";
import axios from "axios";
import { toast } from "sonner";
import { useParams, useSearchParams } from "next/navigation";

import WebpageTools from "./WebpageTools";
import ImageSettingSection from "./ImageSettingSection";
import SettingSection from "./SettingSection";
import { OnSaveContext } from "@/context/OnSaveContext";

type Props = {
  code: string;
};

const HTML_CODE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    [contenteditable="true"]:focus {
      outline: 3px dashed #3b82f6 !important;
      outline-offset: 2px;
    }
  </style>
</head>
<body class="bg-transparent m-0 p-0">
  <div id="root"></div>
</body>
</html>
`;

function WebsiteDesign({ code }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [generatedCode, setGeneratedCode] = useState("");
  const [selectedScreenSize, setSelectedScreenSize] = useState("web");
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);

  const { projectId } = useParams();
  const searchParams = useSearchParams();
  const frameId = searchParams.get("frameId");
  const context = useContext(OnSaveContext);

  // ==========================================
  // LIVE IFRAME SOURCE TO STATE SYNCHRONIZER
  // ==========================================
  const syncFromIframe = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const root = doc?.getElementById("root");

    if (root) {
      // Rebuild clean canvas HTML source blocks safely removing editor states
      const clone = root.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("contenteditable");
        if ((el as HTMLElement).style.outline === "2px solid red") {
          (el as HTMLElement).style.outline = "";
        }
      });
      setGeneratedCode(clone.innerHTML.trim());
    }
  }, []);

  // ==========================================
  // CORE IFRAME INTERACTIVE MOUNT ENGINE
  // ==========================================
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(HTML_CODE);
    doc.close();

    // Use a state-independent variable inside the execution boundary to manage node tracking safely
    let internalSelectedNode: HTMLElement | null = null;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target ||
        target.tagName === "BODY" ||
        target.tagName === "HTML" ||
        target.id === "root"
      )
        return;

      e.preventDefault();
      e.stopPropagation();

      // Clean up previously selected items
      if (internalSelectedNode) {
        internalSelectedNode.style.outline = "";
        internalSelectedNode.removeAttribute("contenteditable");
      }

      // Context-anchor target element selection state references
      internalSelectedNode = target;
      internalSelectedNode.style.outline = "2px solid red";

      if (!["IMG", "BUTTON", "SVG", "A"].includes(target.tagName)) {
        internalSelectedNode.setAttribute("contenteditable", "true");
      }

      setSelectedEl(internalSelectedNode);
      syncFromIframe();
    };

    const handleInputEvent = () => {
      syncFromIframe();
    };

    const attachEditorListeners = () => {
      if (!doc.body) return requestAnimationFrame(attachEditorListeners);

      doc.body.addEventListener("click", handleClick);
      doc.body.addEventListener("input", handleInputEvent);
      doc.body.addEventListener("blur", handleInputEvent, true);
    };

    attachEditorListeners();

    // ==========================================
    // PREVIEW DECOUPLED RELOAD EVENT LISTENER
    // ==========================================
    const handleCanvasRefreshSignal = () => {
      if (iframe.contentWindow) {
        iframe.contentWindow.location.reload();
      }
    };
    window.addEventListener(
      "generator-preview-reload",
      handleCanvasRefreshSignal,
    );

    return () => {
      doc.body?.removeEventListener("click", handleClick);
      doc.body?.removeEventListener("input", handleInputEvent);
      doc.body?.removeEventListener("blur", handleInputEvent, true);
      window.removeEventListener(
        "generator-preview-reload",
        handleCanvasRefreshSignal,
      );
    };
  }, [syncFromIframe]);

  // ==========================================
  // INITIAL CODE INJECTION BOUNDARY
  // ==========================================
  useEffect(() => {
    if (!code) return;

    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const root = doc?.getElementById("root");
    if (!root || !doc) return;

    const cleanHTML = code
      .replace(/```html/g, "")
      .replace(/```/g, "")
      .trim();

    // Only overwrite internal HTML markup nodes if state caches show discrepancies
    // This blocks dangerous text cursor jumping loops when typing in contenteditables
    if (root.innerHTML.trim() !== cleanHTML) {
      root.innerHTML = cleanHTML;
      setGeneratedCode(cleanHTML);

      const win = iframe.contentWindow as any;
      win?.lucide?.createIcons?.();
    }
  }, [code]);

  // ==========================================
  // PRODUCTION DATA STORAGE PERSISTENCE SAVER
  // ==========================================
  const executeSavePipeline = useCallback(async () => {
    if (!generatedCode) return;

    try {
      // Reconstruct and save only clean layout templates, avoiding configuration context leaks
      await axios.put("/api/frames", {
        designCode: generatedCode,
        frameId,
        projectId,
      });
      toast.success("Workspace layout persisted successfully!");
    } catch (err) {
      console.error("Save processing aborted:", err);
      toast.error("Cloud architecture rejected save context state payload");
    }
  }, [generatedCode, frameId, projectId]);

  useEffect(() => {
    if (context?.onSaveData) {
      executeSavePipeline();
    }
  }, [context?.onSaveData, executeSavePipeline]);

  return (
    <div className="flex w-full h-full bg-muted/10 select-none">
      {/* PREVIEW FRAME SPACE BLOCK */}
      <div className="flex flex-col flex-1 h-full p-4 min-w-0">
        <div className="flex-1 flex justify-center items-center bg-gray-100 p-2 rounded-xl border shadow-inner overflow-hidden relative">
          <div
            className="h-full bg-white border shadow-md transition-all duration-300 rounded-lg overflow-hidden"
            style={{
              width: selectedScreenSize === "web" ? "100%" : "375px",
            }}
          >
            <iframe
              ref={iframeRef}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full m-0 p-0 border-none bg-white select-text"
            />
          </div>
        </div>

        {/* WEB DESIGN UTILITY FOOTER COMPONENT */}
        <div className="shrink-0 pt-2">
          <WebpageTools
            selectedScreenSize={selectedScreenSize}
            setSelectedScreenSize={setSelectedScreenSize}
            generatedCode={generatedCode}
          />
        </div>
      </div>

      {/* RIGHT WORKSPACE CONTEXT FIELD SIDEBARS */}
      {selectedEl && (
        <div className="w-[380px] shrink-0 border-l bg-white h-full relative shadow-xl animate-in slide-in-from-right duration-200">
          {selectedEl.tagName === "IMG" ? (
            <ImageSettingSection
              selectedEl={selectedEl as HTMLImageElement}
              setGeneratedCode={setGeneratedCode}
            />
          ) : (
            <SettingSection
              selectedEl={selectedEl}
              clearSelection={() => setSelectedEl(null)}
              setGeneratedCode={setGeneratedCode}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default WebsiteDesign;
