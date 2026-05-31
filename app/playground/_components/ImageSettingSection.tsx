"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Image as ImageIcon, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Props = {
  selectedEl: HTMLImageElement;
  clearSelection: () => void;
  setGeneratedCode: (updater: (prev: string) => string) => void;
};

function ImageSettingSection({
  selectedEl,
  clearSelection,
  setGeneratedCode,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [altText, setAltText] = useState("");
  const [width, setWidth] = useState<number>(300);
  const [height, setHeight] = useState<number>(200);
  const [borderRadius, setBorderRadius] = useState("0px");
  const [preview, setPreview] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // FIXED: Standardize scanning to parse matching position boundaries
  const getSelectedImageDOMIndex = useCallback(() => {
    const doc = selectedEl.ownerDocument;
    if (!doc) return -1;
    return Array.from(doc.querySelectorAll("#root *")).indexOf(selectedEl);
  }, [selectedEl]);

  useEffect(() => {
    setAltText(selectedEl.alt || "");
    setPreview(selectedEl.src || "");
    setWidth(parseInt(selectedEl.style.width) || selectedEl.clientWidth || 300);
    setHeight(
      parseInt(selectedEl.style.height) || selectedEl.clientHeight || 200,
    );
    setBorderRadius(selectedEl.style.borderRadius || "0px");
    setSelectedImage(null);
  }, [selectedEl]);

  // FIXED: Mutator wrap adjusted to handle pure structural inner contents safely
  const runAtomicImageMutation = useCallback(
    (mutationWorker: (node: HTMLImageElement) => void) => {
      const targetIndex = getSelectedImageDOMIndex();
      if (targetIndex === -1) return;

      setGeneratedCode((prevCode) => {
        if (!prevCode) return prevCode;
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(
            `<div>${prevCode}</div>`,
            "text/html",
          );
          const workspaceNodes = Array.from(doc.querySelectorAll("div *"));
          const targetNode = workspaceNodes[targetIndex] as HTMLImageElement;

          if (targetNode) {
            mutationWorker(targetNode);
            return doc.querySelector("div")?.innerHTML || prevCode;
          }
        } catch (err) {
          console.error("Image code compilation failure:", err);
        }
        return prevCode;
      });
    },
    [getSelectedImageDOMIndex, setGeneratedCode],
  );

  const applyStyleMutation = (
    key: "width" | "height" | "borderRadius",
    value: string,
  ) => {
    selectedEl.style[key] = value;

    runAtomicImageMutation((targetNode) => {
      targetNode.style[key] = value;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      selectedEl.src = dataUrl;

      runAtomicImageMutation((targetNode) => {
        targetNode.setAttribute("src", dataUrl);
      });
    };
    reader.readAsDataURL(file);
  };

  const saveUploadedFile = async () => {
    if (!selectedImage) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", selectedImage);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Image Upload Processing Rejected");

      setPreview(data.url);
      selectedEl.src = data.url;

      runAtomicImageMutation((targetNode) => {
        targetNode.setAttribute("src", data.url);
      });

      setSelectedImage(null);
      toast.success("Production asset mapped successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Upload operation aborted");
    } finally {
      setLoading(false);
    }
  };

  const generateAIImage = async () => {
    if (!altText.trim()) {
      toast.error(
        "Please enter a descriptive prompt in the Alt Text field first!",
      );
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/generate-ai-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: altText }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Generation engine timeout");

      setPreview(data.url);
      selectedEl.src = data.url;

      runAtomicImageMutation((targetNode) => {
        targetNode.setAttribute("src", data.url);
      });

      toast.success("AI Image Context generated and synchronized!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "AI Image Generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-96 overflow-y-auto border-l bg-white p-5 shadow-xl pb-12 transition-all">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="text-primary h-5 w-5" />
          <h2 className="text-base font-bold text-foreground">
            Image Settings
          </h2>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted"
          onClick={clearSelection}
          title="Close Panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

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

      <div className="space-y-1.5 pt-2">
        <Label className="text-xs font-semibold text-muted-foreground">
          Alt (Description Prompt)
        </Label>
        <Input
          value={altText}
          onChange={(e) => {
            setAltText(e.target.value);
            runAtomicImageMutation((targetNode) => {
              targetNode.setAttribute("alt", e.target.value);
            });
          }}
          placeholder="Describe asset contents for accessibility..."
        />
      </div>

      <Button
        className="w-full font-medium"
        variant="secondary"
        onClick={generateAIImage}
        disabled={loading || !altText.trim()}
      >
        Generate AI Image from Prompt
      </Button>

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
