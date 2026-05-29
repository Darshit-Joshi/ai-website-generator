"use client";

import React, { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Crop, Expand, ImageMinus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

type Props = {
  selectedEl: HTMLImageElement;
  setGeneratedCode: React.Dispatch<React.SetStateAction<string>>;
};

const transformOptions = [
  { label: "Smart Crop", value: "smartcrop", icon: <Crop /> },
  { label: "Resize", value: "resize", icon: <Expand /> },
  { label: "BG Remove", value: "bgremove", icon: <ImageMinus /> },
];

function ImageSettingSection({ selectedEl, setGeneratedCode }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [altText, setAltText] = useState("");
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(200);
  const [borderRadius, setBorderRadius] = useState("0px");
  const [preview, setPreview] = useState("");
  const [selectedImage, setSelectedImage] = useState<File>();
  const [loading, setLoading] = useState(false);

  // =========================
  // SAFE UPDATE (DOM + STATE)
  // =========================
  const updateImage = (url: string) => {
    setPreview(url);

    if (selectedEl) {
      requestAnimationFrame(() => {
        selectedEl.src = url;
      });

      // 🔥 IMPORTANT: sync export WITHOUT regex
      setGeneratedCode((prev) => {
        if (!prev) return prev;

        // safest generic replace strategy:
        // replace ALL img src only if it matches previous selected src
        const oldSrc =
          selectedEl.getAttribute("data-old-src") || selectedEl.src;

        const updated = prev.replaceAll(oldSrc, url);

        // store new reference
        selectedEl.setAttribute("data-old-src", url);

        return updated;
      });
    }
  };

  // =========================
  // SYNC FROM ELEMENT
  // =========================
  useEffect(() => {
    if (!selectedEl) return;

    setAltText(selectedEl.alt || "");
    setPreview(selectedEl.src || "");

    setWidth(parseInt(selectedEl.style.width) || 300);
    setHeight(parseInt(selectedEl.style.height) || 200);
    setBorderRadius(selectedEl.style.borderRadius || "0px");

    // store initial src reference
    selectedEl.setAttribute("data-old-src", selectedEl.src);
  }, [selectedEl]);

  // =========================
  // STYLE APPLY
  // =========================
  const applyStyle = (key: keyof CSSStyleDeclaration, value: string) => {
    if (!selectedEl) return;
    (selectedEl.style as any)[key] = value;
  };

  // =========================
  // FILE UPLOAD (LOCAL)
  // =========================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEl) return;

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = reader.result as string;
      updateImage(img);
    };

    reader.readAsDataURL(file);
  };

  // =========================
  // SERVER UPLOAD
  // =========================
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

      if (!res.ok) throw new Error(data.error);

      updateImage(data.url);

      toast.success("Uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const openFileDialog = () => fileInputRef.current?.click();

  // =========================
  // TRANSFORMS
  // =========================
  const toggleTransform = () => {};

  // =========================
  // AI IMAGE
  // =========================
  const generateAIImage = async () => {
    try {
      setLoading(true);

      const url = `https://ik.imagekit.io/darshit2023/ik-genimg-${altText}-${Date.now()}.png`;

      updateImage(url);

      toast.success("Generated");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-96 shadow p-4 space-y-4">
      <h2 className="flex gap-2 items-center font-bold">
        <ImageIcon /> Image Settings
      </h2>

      {/* Preview */}
      {preview ? (
        <img
          src={preview}
          alt={altText}
          className="max-h-40 object-contain border rounded cursor-pointer hover:opacity-80"
          onClick={openFileDialog}
        />
      ) : (
        <div className="h-40 flex items-center justify-center border rounded text-sm text-gray-400">
          No image selected
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {!loading ? (
        <Button className="w-full" variant="ghost" onClick={saveUploadedFile}>
          Upload Image
        </Button>
      ) : (
        <p>loading..</p>
      )}

      {/* ALT */}
      <Input
        value={altText}
        onChange={(e) => {
          setAltText(e.target.value);
          if (selectedEl) selectedEl.alt = e.target.value;
        }}
        placeholder="Alt text"
      />

      {/* AI */}
      <Button className="w-full" onClick={generateAIImage}>
        Generate AI Image
      </Button>

      {/* SIZE */}
      <div className="flex gap-2">
        <Input
          type="number"
          value={width}
          onChange={(e) => {
            setWidth(Number(e.target.value));
            applyStyle("width", `${e.target.value}px`);
          }}
        />

        <Input
          type="number"
          value={height}
          onChange={(e) => {
            setHeight(Number(e.target.value));
            applyStyle("height", `${e.target.value}px`);
          }}
        />
      </div>

      {/* BORDER */}
      <Input
        value={borderRadius}
        onChange={(e) => {
          setBorderRadius(e.target.value);
          applyStyle("borderRadius", e.target.value);
        }}
        placeholder="border radius"
      />
    </div>
  );
}

export default ImageSettingSection;
