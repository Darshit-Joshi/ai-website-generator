import React, { useEffect, useRef, useState } from "react";
import WebpageTools from "./WebpageTools";
import SettingSection from "./SettingSection";
import ImageSettingSection from "./ImageSettingSection";
import { OnSaveContext } from "@/context/OnSaveContext";
import { useContext } from "react";
import { log } from "node:console";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import axios from "axios";
import { useParams, useSearchParams } from "next/navigation";
type Props = {
  code: string;
};

const HTML_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="AI Website Builder - Modern TailwindCSS + Flowbite Template">
    <title>AI Website Builder</title>

    <script src="https://cdn.tailwindcss.com"></script>

    <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.3.0/flowbite.min.js"></script>

    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <link href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.11.2/lottie.min.js"></script>

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.js"></script>

    <link rel="stylesheet" href="https://unpkg.com/tippy.js@6/dist/tippy.css" />
    <script src="https://unpkg.com/@popperjs/core@2"></script>
    <script src="https://unpkg.com/tippy.js@6"></script>
</head>
<body id="root"></body>
</html>
    `;
function WebsiteDesign({ code }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [selectedScreenSize, setSelectedScreenSize] = useState("web");
  const { onSaveData, setOnSaveData } = useContext(OnSaveContext);
  const [selectedEl, setSelectedEl] = useState<HTMLElement | null>();
  const { projectId } = useParams();

  const searchParams = useSearchParams();

  const frameId = searchParams.get("frameId");

  // Initialize iframe shell once

  useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(HTML_CODE);
    doc.close();

    let hoverEl: HTMLElement | null = null;
    let selectedEl: HTMLElement | null = null;

    const handleMouseOver = (e: MouseEvent) => {
      if (selectedEl) return;
      const target = e.target as HTMLElement;
      if (hoverEl && hoverEl !== target) {
        hoverEl.style.outline = "";
      }
      hoverEl = target;
      hoverEl.style.outline = "2px dotted blue";
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (selectedEl) return;
      if (hoverEl) {
        hoverEl.style.outline = "";
        hoverEl = null;
      }
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;

      if (selectedEl && selectedEl !== target) {
        selectedEl.style.outline = "";
        selectedEl.removeAttribute("contenteditable");
      }

      selectedEl = target;
      selectedEl.style.outline = "2px solid red";
      selectedEl.setAttribute("contenteditable", "true");
      selectedEl.focus();
      console.log("Selected element:", selectedEl);
      setSelectedEl(selectedEl);
    };

    const handleBlur = () => {
      if (selectedEl) {
        console.log("Final edited element:", selectedEl.outerHTML);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedEl) {
        selectedEl.style.outline = "";
        selectedEl.removeAttribute("contenteditable");
        selectedEl.removeEventListener("blur", handleBlur);
        selectedEl = null;
      }
    };

    doc.body?.addEventListener("mouseover", handleMouseOver);
    doc.body?.addEventListener("mouseout", handleMouseOut);
    doc.body?.addEventListener("click", handleClick);
    doc?.addEventListener("keydown", handleKeyDown);

    // Cleanup on unmount
    return () => {
      doc.body?.removeEventListener("mouseover", handleMouseOver);
      doc.body?.removeEventListener("mouseout", handleMouseOut);
      doc.body?.removeEventListener("click", handleClick);
      doc?.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Update body only when code changes
  useEffect(() => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    const root = doc.getElementById("root");
    if (root) {
      root.innerHTML =
        code
          ?.replaceAll("\`\`\`html", "")
          .replaceAll("\`\`\`", "")
          .replace("html", "") ?? "";
    }
  }, [code]);

  useEffect(() => {
    onSaveData;
  }, [onSaveData]);

  const onSaveCode = async () => {
    if (iframeRef.current) {
      try {
        const iframeDoc =
          iframeRef.current.contentDocument ||
          iframeRef.current.contentWindow?.document;
        if (iframeDoc) {
          const cloneDoc = iframeDoc.documentElement.cloneNode(
            true,
          ) as Document;
          const AllEls = cloneDoc.querySelectorAll<HTMLElement>("*");
          AllEls.forEach((el) => {
            el.style.outline = "";
            el.style.cursor = "";
          });

          const html = cloneDoc.outerHTML;

          const result = await axios.put("/api/frames", {
            designCode: code,
            frameId: frameId,
            projectId: projectId,
          });

          toast.success("Website is ready");
        }
      } catch (error) {
        console.log(error);
      }
    }
  };
  return (
    <div className="flex gap-2 w-full">
      <div className="p-5 w-full flex flex-col items-center">
        <iframe
          ref={iframeRef}
          className={`${selectedScreenSize === "web" ? "w-full" : "w-400"} h-[600px]`}
          sandbox="allow-scripts allow-same-origin"
        />
        <WebpageTools
          selectedScreenSize={selectedScreenSize}
          setSelectedScreenSize={(v: string) => setSelectedScreenSize(v)}
          generatedcode={code}
        />
      </div>
      <div>
        {/*setting section */}

        {selectedEl?.tagName == "IMG " ? (
          <ImageSettingSection selectedEl={selectedEl} />
        ) : selectedEl ? (
          <SettingSection selectedEl={selectedEl} clearSelection={() => null} />
        ) : null}
      </div>
    </div>
  );
}

export default WebsiteDesign;
