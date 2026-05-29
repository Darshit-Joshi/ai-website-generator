"use client";

import React, { useEffect, useRef, useState, useContext } from "react";
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
</head>

<body>
  <div id="root"></div>
</body>
</html>
`;

function WebsiteDesign({ code }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [generatedCode, setGeneratedCode] = useState(code);
  const [selectedScreenSize, setSelectedScreenSize] = useState("web");
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>(null);

  const { onSaveData } = useContext(OnSaveContext);
  const { projectId } = useParams();
  const searchParams = useSearchParams();
  const frameId = searchParams.get("frameId");

  // ================= INIT IFRAME =================
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(HTML_CODE);
    doc.close();

    let activeEl: HTMLElement | null = null;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.tagName === "BODY" || target.tagName === "HTML")
        return;

      e.preventDefault();

      if (activeEl) {
        activeEl.style.outline = "";
        activeEl.removeAttribute("contenteditable");
      }

      activeEl = target;
      activeEl.style.outline = "2px solid red";

      if (!["IMG", "BUTTON", "SVG"].includes(target.tagName)) {
        activeEl.setAttribute("contenteditable", "true");
      }

      setSelectedEl(target);
    };

    const waitForBody = () => {
      if (!doc.body) return requestAnimationFrame(waitForBody);
      doc.body.addEventListener("click", handleClick);
    };

    waitForBody();

    return () => {
      doc.body?.removeEventListener("click", handleClick);
    };
  }, []);

  // ================= INJECT / SYNC CODE =================
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    const root = doc.getElementById("root");
    if (!root) return;

    const clean =
      code
        ?.replace(/```html/g, "")
        .replace(/```/g, "")
        .trim() || "";

    root.innerHTML = clean;

    setGeneratedCode(clean); // 🔥 IMPORTANT: sync state with iframe

    const win = iframe.contentWindow as any;
    win?.lucide?.createIcons?.();
  }, [code]);

  // ================= LIVE DOM → STATE SYNC =================
  const syncFromIframe = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    const root = doc.getElementById("root");
    if (!root) return;

    setGeneratedCode(root.innerHTML); // 🔥 SOURCE OF TRUTH
  };

  // ================= SAVE =================
  const save = async () => {
    try {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const doc = iframe.contentDocument;
      if (!doc) return;

      const clone = doc.documentElement.cloneNode(true) as HTMLElement;

      clone.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("contenteditable");
        (el as HTMLElement).style.outline = "";
      });

      await axios.put("/api/frames", {
        designCode: clone.outerHTML,
        frameId,
        projectId,
      });

      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    }
  };

  useEffect(() => {
    if (onSaveData) save();
  }, [onSaveData]);

  // ================= UI =================
  return (
    <div className="flex w-full h-full">
      {/* LEFT */}
      <div className="flex flex-col flex-1 h-full p-4">
        {/* PREVIEW */}
        <div className="flex-1 flex justify-center bg-gray-100 p-4">
          <div
            className="h-full border bg-white transition-all duration-300"
            style={{
              width: selectedScreenSize === "web" ? "100%" : "375px",
            }}
          >
            <iframe
              ref={iframeRef}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border bg-white"
              onInput={syncFromIframe} // 🔥 live sync hook
              onBlur={syncFromIframe}
            />
          </div>
        </div>

        {/* TOOLS */}
        <div className="shrink-0">
          <WebpageTools
            selectedScreenSize={selectedScreenSize}
            setSelectedScreenSize={setSelectedScreenSize}
            generatedCode={generatedCode} // 🔥 NOW REAL SOURCE
          />
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      {selectedEl && (
        <div className="w-[380px] border-l bg-white overflow-y-auto h-full">
          {selectedEl.tagName === "IMG" ? (
            <ImageSettingSection
              selectedEl={selectedEl as HTMLImageElement}
              setGeneratedCode={setGeneratedCode}
            />
          ) : (
            <SettingSection
              selectedEl={selectedEl}
              clearSelection={() => setSelectedEl(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default WebsiteDesign;
