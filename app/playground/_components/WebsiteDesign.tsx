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
import { FileCode, Layers } from "lucide-react";

import WebpageTools from "./WebpageTools";
import ImageSettingSection from "./ImageSettingSection";
import SettingSection from "./SettingSection";
import { OnSaveContext } from "@/context/OnSaveContext";

type Props = {
  code: string;
};

interface VirtualProjectWorkspace {
  [fileName: string]: string;
}

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

  const [virtualWorkspace, setVirtualWorkspace] =
    useState<VirtualProjectWorkspace>({ "index.html": "" });
  const [activeTab, setActiveTab] = useState<string>("index.html");
  const [generatedCode, setGeneratedCode] = useState("");
  const [selectedScreenSize, setSelectedScreenSize] = useState("web");
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);

  const { projectId } = useParams();
  const searchParams = useSearchParams();
  const frameId = searchParams.get("frameId");
  const context = useContext(OnSaveContext);

  // Parse custom tags safely
  const parseProjectFiles = useCallback(
    (rawText: string): VirtualProjectWorkspace => {
      const workspace: VirtualProjectWorkspace = {};
      const fileRegex = /<file\s+name="([^"]+)"\s*>([\s\S]*?)(?:<\/file>|$)/gi;
      let match;
      let foundAny = false;

      while ((match = fileRegex.exec(rawText)) !== null) {
        const fileName = match[1].trim();
        let fileContent = match[2];
        fileContent = fileContent.replace(/<\/file>$/i, "").trim();
        workspace[fileName] = fileContent;
        foundAny = true;
      }

      if (!foundAny) {
        const cleanFallback = rawText
          .replace(/```html/g, "")
          .replace(/```/g, "")
          .trim();
        workspace["index.html"] = cleanFallback;
      }

      return workspace;
    },
    [],
  );

  // ==========================================
  // FIXED: ONE-WAY ATOMIC SYNC LAYER
  // ==========================================
  const syncFromIframe = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const root = doc?.getElementById("root");

    if (root) {
      const clone = root.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("contenteditable");
        if ((el as HTMLElement).style.outline === "2px solid red") {
          (el as HTMLElement).style.outline = "";
        }
      });

      const cleanHtmlString = clone.innerHTML.trim();

      // Update both variables together natively without intermediate state intercept loops
      setGeneratedCode(cleanHtmlString);
      setVirtualWorkspace((prev) => {
        if (prev[activeTab] === cleanHtmlString) return prev;
        return {
          ...prev,
          [activeTab]: cleanHtmlString,
        };
      });
    }
  }, [activeTab]);

  // Intercepting updates from sidebars explicitly by overwriting the dispatch pass-down hook
  const handleSidebarCodeMutation = useCallback(
    (updaterOrValue: string | ((prev: string) => string)) => {
      setGeneratedCode((prevValue) => {
        const computedValue =
          typeof updaterOrValue === "function"
            ? updaterOrValue(prevValue)
            : updaterOrValue;

        setVirtualWorkspace((prevWorkspace) => {
          if (prevWorkspace[activeTab] === computedValue) return prevWorkspace;
          return {
            ...prevWorkspace,
            [activeTab]: computedValue,
          };
        });

        return computedValue;
      });
    },
    [activeTab],
  );

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

      if (internalSelectedNode) {
        internalSelectedNode.style.outline = "";
        internalSelectedNode.removeAttribute("contenteditable");
      }

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
  // MULTI-FILE WORKSPACE PARSING BOUNDARY
  // ==========================================
  useEffect(() => {
    if (!code) return;
    const parsedFiles = parseProjectFiles(code);

    setVirtualWorkspace((prevWorkspace) => {
      // Deep verification blocks unneeded state rerenders while streaming data chunks
      const stringifiedNew = JSON.stringify(parsedFiles);
      const stringifiedOld = JSON.stringify(prevWorkspace);
      if (stringifiedNew === stringifiedOld) return prevWorkspace;
      return parsedFiles;
    });

    if (!Object.keys(parsedFiles).includes(activeTab)) {
      const primaryKey = Object.keys(parsedFiles)[0] || "index.html";
      setActiveTab(primaryKey);
    }
  }, [code, parseProjectFiles, activeTab]);

  // ==========================================
  // INITIAL & ACTIVE CODE INJECTION BOUNDARY
  // ==========================================
  useEffect(() => {
    const activeTargetCode = virtualWorkspace[activeTab] || "";

    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const root = doc?.getElementById("root");
    if (!root || !doc) return;

    if (root.innerHTML.trim() !== activeTargetCode) {
      root.innerHTML = activeTargetCode;
      setGeneratedCode(activeTargetCode);

      const win = iframe.contentWindow as any;
      win?.lucide?.createIcons?.();
    }
  }, [activeTab, virtualWorkspace[activeTab]]); // Specific dependency match breaks recursive loops!

  // ==========================================
  // PRODUCTION DATA STORAGE PERSISTENCE SAVER
  // ==========================================
  const lastSaveRef = useRef(false);
  const executeSavePipeline = useCallback(async () => {
    if (!generatedCode) return;

    try {
      await axios.put("/api/frames", {
        designCode: JSON.stringify(virtualWorkspace),
        frameId,
        projectId,
      });
      toast.success("Workspace layout persisted successfully!");
    } catch (err) {
      console.error("Save processing aborted:", err);
    }
  }, [generatedCode, virtualWorkspace, frameId, projectId]);

  useEffect(() => {
    if (context?.onSaveData && !lastSaveRef.current) {
      lastSaveRef.current = true;
      executeSavePipeline();
    } else if (!context?.onSaveData) {
      lastSaveRef.current = false;
    }
  }, [context?.onSaveData, executeSavePipeline]);

  const workspaceFiles = Object.keys(virtualWorkspace);

  return (
    <div className="flex w-full h-full bg-muted/10 select-none">
      <div className="flex flex-col flex-1 h-full p-4 min-w-0">
        {/* TAB NAVIGATION BAR */}
        {workspaceFiles.length > 0 && (
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-white px-4 py-2 mb-3 rounded-xl shadow-md overflow-x-auto">
            <div className="flex items-center gap-1 text-xs text-zinc-400 font-medium font-mono mr-2 border-r border-zinc-800 pr-3 shrink-0">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Project Pages ({workspaceFiles.length}):</span>
            </div>
            {workspaceFiles.map((name) => (
              <button
                key={name}
                onClick={() => {
                  setSelectedEl(null);
                  setActiveTab(name);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium rounded-md transition-all duration-200 shrink-0 ${
                  activeTab === name
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                <FileCode className="w-3 h-3 shrink-0" />
                {name}
              </button>
            ))}
          </div>
        )}

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

        <div className="shrink-0 pt-2">
          <WebpageTools
            selectedScreenSize={selectedScreenSize}
            setSelectedScreenSize={setSelectedScreenSize}
            generatedCode={generatedCode}
          />
        </div>
      </div>

      {/* SIDEBAR WRAPPERS */}
      {selectedEl && (
        <div className="w-[380px] shrink-0 border-l bg-white h-full relative shadow-xl animate-in slide-in-from-right duration-200">
          {selectedEl.tagName === "IMG" ? (
            <ImageSettingSection
              selectedEl={selectedEl as HTMLImageElement}
              setGeneratedCode={handleSidebarCodeMutation as any}
            />
          ) : (
            <SettingSection
              selectedEl={selectedEl}
              clearSelection={() => setSelectedEl(null)}
              setGeneratedCode={handleSidebarCodeMutation as any}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default WebsiteDesign;
