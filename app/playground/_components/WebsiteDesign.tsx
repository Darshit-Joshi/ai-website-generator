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
import { FileCode, Layers, X } from "lucide-react";

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
    .canvas-selected-element {
      outline: 2px solid red !important;
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { projectId } = useParams();
  const searchParams = useSearchParams();
  const frameId = searchParams.get("frameId");
  const context = useContext(OnSaveContext);

  const getActiveElementByTrackedIndex = useCallback((): HTMLElement | null => {
    if (selectedIndex === null) return null;
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return null;
    const allElements = Array.from(doc.querySelectorAll("#root *"));
    return (allElements[selectedIndex] as HTMLElement) || null;
  }, [selectedIndex]);

  const handleClearSelection = useCallback(() => {
    const activeEl = getActiveElementByTrackedIndex();
    if (activeEl) {
      activeEl.classList.remove("canvas-selected-element");
      activeEl.removeAttribute("contenteditable");
    }
    setSelectedIndex(null);
  }, [getActiveElementByTrackedIndex]);

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

  const syncFromIframe = useCallback(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const root = doc?.getElementById("root");

    if (root) {
      const clone = root.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("contenteditable");
        el.classList.remove("canvas-selected-element");
      });

      const cleanHtmlString = clone.innerHTML.trim();
      setGeneratedCode(cleanHtmlString);
      setVirtualWorkspace((prev) => {
        if (prev[activeTab] === cleanHtmlString) return prev;
        return { ...prev, [activeTab]: cleanHtmlString };
      });
    }
  }, [activeTab]);

  const handleSidebarCodeMutation = useCallback(
    (updaterOrValue: string | ((prev: string) => string)) => {
      setGeneratedCode((prevValue) => {
        const computedValue =
          typeof updaterOrValue === "function"
            ? updaterOrValue(prevValue)
            : updaterOrValue;

        setVirtualWorkspace((prevWorkspace) => {
          if (prevWorkspace[activeTab] === computedValue) return prevWorkspace;
          return { ...prevWorkspace, [activeTab]: computedValue };
        });

        return computedValue;
      });
    },
    [activeTab],
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(HTML_CODE);
    doc.close();

    const handleCanvasRefreshSignal = () => {
      if (iframe.contentWindow) iframe.contentWindow.location.reload();
    };
    window.addEventListener(
      "generator-preview-reload",
      handleCanvasRefreshSignal,
    );

    return () => {
      window.removeEventListener(
        "generator-preview-reload",
        handleCanvasRefreshSignal,
      );
    };
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;

    const handleDblClick = (e: MouseEvent) => {
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

      const allElements = Array.from(doc.querySelectorAll("#root *"));
      const elementIndex = allElements.indexOf(target);
      if (elementIndex === -1) return;

      allElements.forEach((el) => {
        el.classList.remove("canvas-selected-element");
        el.removeAttribute("contenteditable");
      });

      target.classList.add("canvas-selected-element");
      if (!["IMG", "BUTTON", "SVG", "A"].includes(target.tagName)) {
        target.setAttribute("contenteditable", "true");
      }

      setSelectedIndex(elementIndex);
    };

    const handleInputEvent = () => {
      syncFromIframe();
    };

    const attachListeners = () => {
      if (!doc.body) return requestAnimationFrame(attachListeners);
      doc.body.addEventListener("dblclick", handleDblClick);
      doc.body.addEventListener("input", handleInputEvent);
      doc.body.addEventListener("blur", handleInputEvent, true);
    };

    attachListeners();

    return () => {
      doc.body?.removeEventListener("dblclick", handleDblClick);
      doc.body?.removeEventListener("input", handleInputEvent);
      doc.body?.removeEventListener("blur", handleInputEvent, true);
    };
  }, [syncFromIframe]);

  useEffect(() => {
    if (!code) return;
    const parsedFiles = parseProjectFiles(code);

    setVirtualWorkspace((prevWorkspace) => {
      if (JSON.stringify(parsedFiles) === JSON.stringify(prevWorkspace))
        return prevWorkspace;
      return parsedFiles;
    });

    if (!Object.keys(parsedFiles).includes(activeTab)) {
      setActiveTab(Object.keys(parsedFiles)[0] || "index.html");
    }
  }, [code, parseProjectFiles, activeTab]);

  useEffect(() => {
    const activeTargetCode = virtualWorkspace[activeTab] || "";
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    const root = doc?.getElementById("root");
    if (!root || !doc) return;

    if (root.innerHTML.trim() !== activeTargetCode.trim()) {
      root.innerHTML = activeTargetCode;
      setGeneratedCode(activeTargetCode);

      const win = iframe.contentWindow as any;
      win?.lucide?.createIcons?.();

      if (win && !win.navigatePage) {
        win.navigatePage = (pageName: string) => {
          const expectedTabName = pageName.endsWith(".html")
            ? pageName
            : `${pageName}.html`;

          window.dispatchEvent(
            new CustomEvent("sandbox-navigate-tab", {
              detail: expectedTabName,
            }),
          );
        };
      }

      if (selectedIndex !== null) {
        const allElements = Array.from(doc.querySelectorAll("#root *"));
        const targetEl = allElements[selectedIndex] as HTMLElement;
        if (targetEl) {
          targetEl.classList.add("canvas-selected-element");
          if (!["IMG", "BUTTON", "SVG", "A"].includes(targetEl.tagName)) {
            targetEl.setAttribute("contenteditable", "true");
          }
        }
      }
    }
  }, [activeTab, virtualWorkspace, selectedIndex]);

  useEffect(() => {
    const handleGlobalRoutingSignal = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const targetPageName = customEvent.detail;
      if (Object.keys(virtualWorkspace).includes(targetPageName)) {
        handleClearSelection();
        setActiveTab(targetPageName);
      }
    };

    window.addEventListener("sandbox-navigate-tab", handleGlobalRoutingSignal);
    return () => {
      window.removeEventListener(
        "sandbox-navigate-tab",
        handleGlobalRoutingSignal,
      );
    };
  }, [virtualWorkspace, handleClearSelection]);

  const lastSaveRef = useRef(false);
  useEffect(() => {
    const executeSavePipeline = async () => {
      if (!generatedCode) return;
      try {
        await axios.put("/api/frames", {
          designCode: JSON.stringify(virtualWorkspace),
          frameId,
          projectId,
        });
      } catch (err) {
        console.error("Save error:", err);
      }
    };

    if (context?.onSaveData && !lastSaveRef.current) {
      lastSaveRef.current = true;
      executeSavePipeline();
    } else if (!context?.onSaveData) {
      lastSaveRef.current = false;
    }
  }, [
    context?.onSaveData,
    generatedCode,
    virtualWorkspace,
    frameId,
    projectId,
  ]);

  const workspaceFiles = Object.keys(virtualWorkspace);
  const currentSelectedEl = getActiveElementByTrackedIndex();

  return (
    <div className="flex w-full h-full bg-muted/10 select-none">
      <div className="flex flex-col flex-1 h-full p-4 min-w-0">
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
                  handleClearSelection();
                  setActiveTab(name);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium rounded-md transition-all ${
                  activeTab === name
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <FileCode className="w-3 h-3" />
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 flex justify-center items-center bg-gray-100 p-2 rounded-xl border shadow-inner overflow-hidden relative">
          <div
            className="h-full bg-white border shadow-md transition-all duration-300 rounded-lg overflow-hidden"
            style={{ width: selectedScreenSize === "web" ? "100%" : "375px" }}
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

      {/* SIDEBAR DESIGN PANEL SECTION WITH INTEGRATED CLOSE ENGINE */}
      {selectedIndex !== null && currentSelectedEl && (
        <div className="w-[380px] shrink-0 border-l bg-white h-full relative shadow-xl animate-in slide-in-from-right duration-200 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b bg-gray-50 shrink-0">
            <div className="flex flex-col">
              <span className="text-xs font-mono text-indigo-600 font-semibold uppercase tracking-wider">
                Visual Studio Editor
              </span>
              <span className="text-sm font-bold text-zinc-800 font-mono">
                &lt;{currentSelectedEl.tagName.toLowerCase()}&gt; Element Node
              </span>
            </div>
            <button
              onClick={handleClearSelection}
              className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition-all border border-zinc-200 shadow-sm"
              title="Close panel and unlock canvas element selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {currentSelectedEl.tagName === "IMG" ? (
              <ImageSettingSection
                selectedEl={currentSelectedEl as HTMLImageElement}
                setGeneratedCode={handleSidebarCodeMutation}
                clearSelection={handleClearSelection}
              />
            ) : (
              <SettingSection
                selectedEl={currentSelectedEl}
                setGeneratedCode={handleSidebarCodeMutation}
                clearSelection={handleClearSelection}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WebsiteDesign;
