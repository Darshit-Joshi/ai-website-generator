"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Image as ImageIcon,
  Crop,
  Expand,
  Image as ImageUpscale,
  ImageMinus,
  Upload,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ImageKit from "imagekit";

type Props = {
  selectedEl: HTMLImageElement;
};

const transformOptions = [
  {
    label: "Smart Crop",
    value: "smartcrop",
    icon: <Crop className="h-4 w-4" />,
    transformation: "e-smartcrop",
  },
  {
    label: "Resize",
    value: "resize",
    icon: <Expand className="h-4 w-4" />,
    transformation: "e-resize",
  },
  {
    label: "Upscale",
    value: "upscale",
    icon: <ImageUpscale className="h-4 w-4" />,
    transformation: "e-upscale",
  },
  {
    label: "BG Remove",
    value: "bgremove",
    icon: <ImageMinus className="h-4 w-4" />,
    transformation: "e-bgremove",
  },
];

// Initialize ImageKit
// Note: Exposing your privateKey on the client-side is insecure for production.
// Consider using an authentication endpoint instead.
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,

  privateKey: process.env.NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY!,

  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

function ImageSettingSection({ selectedEl }: Props) {
  const [altText, setAltText] = useState(selectedEl?.alt || "");
  const [width, setWidth] = useState<string | number>(
    selectedEl?.style?.width ? parseFloat(selectedEl.style.width) : 300,
  );
  const [height, setHeight] = useState<string | number>(
    selectedEl?.style?.height ? parseFloat(selectedEl.style.height) : 200,
  );
  const [borderRadius, setBorderRadius] = useState(
    selectedEl?.style?.borderRadius || "0px",
  );
  const [preview, setPreview] = useState(selectedEl?.src || "");
  const [activeTransforms, setActiveTransforms] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!selectedEl) return;
    setPreview(selectedEl.src || "");
    setAltText(selectedEl.alt || "");
    setWidth(selectedEl.style.width ? parseFloat(selectedEl.style.width) : 300);
    setHeight(
      selectedEl.style.height ? parseFloat(selectedEl.style.height) : 200,
    );
    setBorderRadius(selectedEl.style.borderRadius || "0px");
  }, [selectedEl]);

  const toggleTransform = (value: string) => {
    setActiveTransforms((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultString = reader.result as string;
        setPreview(resultString);
        if (selectedEl) {
          selectedEl.src = resultString;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const ApplyTransformation = (trValue: string) => {
    setLoading(true);
    if (!preview.includes(trValue)) {
      const url = preview + trValue + ",";
      setPreview(url);
      selectedEl.setAttribute("src", url);
    } else {
      const url = preview.replaceAll(trValue + ",", "");
      setPreview(url);
      selectedEl.setAttribute("src", url);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const saveUploadedFile = async () => {
    if (!selectedImage) return;
    try {
      // Basic implementation wrapper matching your SDK schema
      const response = await imagekit.upload({
        file: selectedImage,
        fileName: `${Date.now()}.png`,
      });
      if (response && response.url && selectedEl) {
        selectedEl.setAttribute("src", response.url + "?tr=");
        setPreview(response.url);
      }
    } catch (error) {
      console.error("ImageKit Upload Error:", error);
    }
  };

  const handleAIAction = () => {
    // Generate AI Image logic
    setLoading(true);
    const url = `https://ik.imagekit.io/darshit2023/ik-genimg-prompt-${altText}/${Date.now()}.png?tr=`;
    setPreview(url);
    selectedEl.setAttribute("src", url);
  };

  return (
    <div className="w-96 shadow p-4 space-y-4 overflow-auto h-[98vh] rounded-xl mt-2 mr-2">
      <h2 className="flex gap-2 items-center font-bold">
        <ImageIcon className="h-5 w-5" /> Image Settings
      </h2>

      {/* Preview (clickable) */}
      <div className="flex justify-center">
        <img
          src={preview}
          alt={altText}
          className="max-h-44 object-contain border rounded cursor-pointer hover:opacity-80 w-full"
          onClick={openFileDialog}
          onLoad={() => setLoading(false)}
        />
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Sync/Upload Action Controls */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={openFileDialog}
        >
          <Upload size={16} className="mr-2" />
          Select Image
        </Button>
        {selectedImage && (
          <Button type="button" className="w-full" onClick={saveUploadedFile}>
            Save to Cloud
          </Button>
        )}
      </div>

      {/* Alt text / Prompt input */}
      <div>
        <label className="text-sm font-medium">Prompt / Alt Text</label>
        <Input
          type="text"
          value={altText}
          onChange={(e) => {
            setAltText(e.target.value);
            if (selectedEl) selectedEl.alt = e.target.value;
          }}
          placeholder="Enter alt text"
          className="mt-1"
        />
      </div>

      <Button type="button" className="w-full" onClick={handleAIAction}>
        <Sparkles className="mr-2 h-4 w-4" /> Generate AI Image
      </Button>

      {/* Transform Buttons */}
      <div>
        <label className="text-sm mb-1 block font-medium">AI Transform</label>
        <div className="flex gap-2 flex-wrap">
          <TooltipProvider>
            {transformOptions.map((opt) => {
              const applied = activeTransforms.includes(opt.value);
              return (
                <Tooltip key={opt.value}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={
                        preview.includes(opt.transformation)
                          ? "default"
                          : "outline"
                      }
                      className="flex items-center justify-center p-2 flex-1"
                      onClick={() => ApplyTransformation(opt.transformation)}
                    >
                      {opt.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {opt.label} {applied && "(Applied)"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </div>

      {/* Conditional Resize Inputs */}
      {activeTransforms.includes("resize") && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-sm font-medium">Width (px)</label>
            <Input
              type="number"
              value={width}
              onChange={(e) => {
                const val = Number(e.target.value);
                setWidth(val);
                if (selectedEl) selectedEl.style.width = `${val}px`;
              }}
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium">Height (px)</label>
            <Input
              type="number"
              value={height}
              onChange={(e) => {
                const val = Number(e.target.value);
                setHeight(val);
                if (selectedEl) selectedEl.style.height = `${val}px`;
              }}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Border Radius */}
      <div>
        <label className="text-sm font-medium">Border Radius</label>
        <Input
          type="text"
          value={borderRadius}
          onChange={(e) => {
            setBorderRadius(e.target.value);
            if (selectedEl) selectedEl.style.borderRadius = e.target.value;
          }}
          placeholder="e.g. 8px or 50%"
          className="mt-1"
        />
      </div>
    </div>
  );
}

export default ImageSettingSection;
