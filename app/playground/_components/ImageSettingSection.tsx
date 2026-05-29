"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Props = {
  selectedEl: HTMLImageElement | null;
  setGeneratedCode: React.Dispatch<React.SetStateAction<string>>;
};

function ImageSettingSection({ selectedEl, setGeneratedCode }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [altText, setAltText] = useState("");
  const [width, setWidth] = useState<number>(300);
  const [height, setHeight] = useState<number>(200);
  const [borderRadius, setBorderRadius] = useState("0px");
  const [preview, setPreview] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // COMPREHENSIVE CANVAS SYNCHRONIZATION WORKER
  // ==========================================
  const syncCanvasCodeAndDOM = useCallback(
    (updatedProperties: { src?: string; alt?: string; styleStr?: string }) => {
      if (!selectedEl) return;

      // 1. Trace exact unique node index identification pathway within the preview iframe DOM
      const previewDocument = selectedEl.ownerDocument;
      const allImages = Array.from(previewDocument.querySelectorAll("img"));
      const elementIndex = allImages.indexOf(selectedEl);

      if (elementIndex === -1) return;

      // 2. Perform smooth asynchronous canvas painting
      requestAnimationFrame(() => {
        if (updatedProperties.src !== undefined)
          selectedEl.src = updatedProperties.src;
        if (updatedProperties.alt !== undefined)
          selectedEl.alt = updatedProperties.alt;
      });

      // 3. Rebuild raw template text safely using index-targeted document mapping
      setGeneratedCode((prevCode) => {
        if (!prevCode) return prevCode;

        try {
          // Parse the existing source string block into a secure sandbox layout engine
          const parser = new DOMParser();
          const doc = parser.parseFromString(prevCode, "text/html");
          const targetedDomElements = doc.querySelectorAll("img");

          if (targetedDomElements[elementIndex]) {
            const targetNode = targetedDomElements[elementIndex];

            if (updatedProperties.src !== undefined)
              targetNode.setAttribute("src", updatedProperties.src);
            if (updatedProperties.alt !== undefined)
              targetNode.setAttribute("alt", updatedProperties.alt);

            // Process inline dimensional attributes
            targetNode.style.width = `${selectedEl.style.width}`;
            targetNode.style.height = `${selectedEl.style.height}`;
            targetNode.style.borderRadius = selectedEl.style.borderRadius;

            return doc.documentElement.outerHTML;
          }
        } catch (err) {
          console.error("HTML structural compilation failure:", err);
        }
        return prevCode;
      });
    },
    [selectedEl, setGeneratedCode],
  );

  // Sync state cleanly when user clicks a different image
  useEffect(() => {
    if (!selectedEl) {
      setPreview("");
      setSelectedImage(null);
      return;
    }

    setAltText(selectedEl.alt || "");
    setPreview(selectedEl.src || "");
    setWidth(parseInt(selectedEl.style.width) || selectedEl.clientWidth || 300);
    setHeight(
      parseInt(selectedEl.style.height) || selectedEl.clientHeight || 200,
    );
    setBorderRadius(selectedEl.style.borderRadius || "0px");
    setSelectedImage(null); // Reset staged file reference to prevent cross-node pollution
  }, [selectedEl]);

  // Safe dimensional/style synchronization method
  const applyStyleMutation = (
    key: "width" | "height" | "borderRadius",
    value: string,
  ) => {
    if (!selectedEl) return;

    selectedEl.style[key] = value;
    syncCanvasCodeAndDOM({});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEl) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      syncCanvasCodeAndDOM({ src: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const saveUploadedFile = async () => {
    if (!selectedImage || !selectedEl) {
      toast.error("Please choose or verify asset source first");
      return;
    }

    try {
      setLoading(true);

      // Revert back to using standard high-performance multipart boundary forms
      const formData = new FormData();
      formData.append("file", selectedImage);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        // Do NOT pass custom Content-Type headers here; the browser needs to set its own form boundaries!
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Image Upload Processing Rejected");
      }

      setPreview(data.url);
      syncCanvasCodeAndDOM({ src: data.url });
      setSelectedImage(null); // Clear local staged binary handle
      toast.success("Production asset mapped successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Upload operation aborted");
    } finally {
      setLoading(false);
    }
  };

  const generateAIImage = async () => {
    if (!selectedEl) return;

    if (!altText.trim()) {
      toast.error(
        "Please enter a descriptive prompt in the Alt Text field first!",
      );
      return;
    }

    try {
      setLoading(true);

      // Request the authenticated signed URL from your own backend route
      const response = await fetch("/api/generate-ai-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: altText }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Generation engine timeout");

      // Update the local preview canvas view
      setPreview(data.url);

      // Update the live iframe element and master HTML code blocks
      syncCanvasCodeAndDOM({ src: data.url });

      toast.success("AI Image Context generated and synchronized!");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.message || "AI Image Generation failed. Check backend credentials.",
      );
    } finally {
      setLoading(false);
    }
  };
  if (!selectedEl) {
    return (
      <div className="w-96 shadow p-6 border-l bg-white h-[calc(100vh-73px)] flex flex-col items-center justify-center text-center text-muted-foreground">
        <ImageIcon className="h-8 w-8 mb-2 text-muted-foreground/60" />
        <p className="text-sm font-medium">
          Select an image element inside the live website preview to modify its
          properties.
        </p>
      </div>
    );
  }

  return (
    <div className="w-96 shadow p-4 space-y-5 bg-white border-l h-[calc(100vh-73px)] overflow-y-auto">
      <h2 className="flex gap-2 items-center font-bold text-lg border-b pb-3">
        <ImageIcon className="text-primary h-5 w-5" /> Image Settings
      </h2>

      {/* Interactive Preview Frame */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Asset Preview
        </Label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative h-40 w-full flex items-center justify-center border-2 border-dashed rounded-xl overflow-hidden cursor-pointer bg-muted/30 hover:bg-muted/60 transition-colors group"
        >
          {preview ? (
            <img
              src={preview}
              alt={altText}
              className="h-full w-full object-contain transition-transform group-hover:scale-95"
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              Click to upload or swap file
            </span>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {selectedImage && (
        <Button
          className="w-full font-semibold shadow-sm"
          onClick={saveUploadedFile}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
          Commit Local Changes to Cloud Storage
        </Button>
      )}

      {/* Alt Text Setting */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">
          Alt (Description Prompt)
        </Label>
        <Input
          value={altText}
          onChange={(e) => {
            setAltText(e.target.value);
            syncCanvasCodeAndDOM({ alt: e.target.value });
          }}
          placeholder="Describe asset contents for accessibility..."
        />
      </div>

      {/* AI Synthesis Trigger */}
      <Button
        className="w-full font-medium"
        variant="secondary"
        onClick={generateAIImage}
        disabled={loading || !altText.trim()}
      >
        Generate AI Image from Prompt
      </Button>

      {/* Sizing Boundaries Section */}
      <div className="space-y-2 border-t pt-4">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Dimensions (px)
        </Label>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground/70">
              Width
            </span>
            <Input
              type="number"
              value={width}
              onChange={(e) => {
                const val = Number(e.target.value);
                setWidth(val);
                applyStyleMutation("width", `${val}px`);
              }}
            />
          </div>

          <div className="flex-1 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground/70">
              Height
            </span>
            <Input
              type="number"
              value={height}
              onChange={(e) => {
                const val = Number(e.target.value);
                setHeight(val);
                applyStyleMutation("height", `${val}px`);
              }}
            />
          </div>
        </div>
      </div>

      {/* Border Customizer */}
      <div className="space-y-1.5 border-t pt-4">
        <Label className="text-xs font-semibold text-muted-foreground">
          Border Radius (CSS format)
        </Label>
        <Input
          value={borderRadius}
          onChange={(e) => {
            setBorderRadius(e.target.value);
            applyStyleMutation("borderRadius", e.target.value);
          }}
          placeholder="e.g., 8px, 50%, 1rem"
        />
      </div>
    </div>
  );
}

export default ImageSettingSection;
