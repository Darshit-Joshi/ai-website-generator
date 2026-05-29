"use client";

import React, { useEffect, useState } from "react";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Brush,
  CornerDownRight,
  Palette,
  SwatchBook,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  selectedEl: HTMLElement;

  clearSelection: () => void;
};

function SettingSection({ selectedEl, clearSelection }: Props) {
  const [classes, setClasses] = useState<string[]>([]);

  const [newClass, setNewClass] = useState("");

  const [styles, setStyles] = useState({
    fontSize: "16px",
    color: "#000000",
    backgroundColor: "#ffffff",
    padding: "",
    margin: "",
    borderRadius: "",
    width: "",
    height: "",
    fontWeight: "400",
    textAlign: "left",
    border: "",
    boxShadow: "",
  });

  // =========================================
  // INITIALIZE
  // =========================================

  useEffect(() => {
    if (!selectedEl) return;

    setStyles({
      fontSize: selectedEl.style.fontSize || "16px",

      color: selectedEl.style.color || "#000000",

      backgroundColor: selectedEl.style.backgroundColor || "#ffffff",

      padding: selectedEl.style.padding || "",

      margin: selectedEl.style.margin || "",

      borderRadius: selectedEl.style.borderRadius || "",

      width: selectedEl.style.width || "",

      height: selectedEl.style.height || "",

      fontWeight: selectedEl.style.fontWeight || "400",

      textAlign: selectedEl.style.textAlign || "left",

      border: selectedEl.style.border || "",

      boxShadow: selectedEl.style.boxShadow || "",
    });

    const currentClasses = selectedEl.className.split(" ").filter(Boolean);

    setClasses(currentClasses);
  }, [selectedEl]);

  // =========================================
  // APPLY STYLE
  // =========================================

  const applyStyle = (property: string, value: string) => {
    if (!selectedEl) return;

    selectedEl.style[property as any] = value;

    setStyles((prev) => ({
      ...prev,
      [property]: value,
    }));
  };

  // =========================================
  // REMOVE CLASS
  // =========================================

  const removeClass = (cls: string) => {
    const updated = classes.filter((c) => c !== cls);

    setClasses(updated);

    selectedEl.className = updated.join(" ");
  };

  // =========================================
  // ADD CLASS
  // =========================================

  const addClass = () => {
    const trimmed = newClass.trim();

    if (!trimmed) return;

    if (!classes.includes(trimmed)) {
      const updated = [...classes, trimmed];

      setClasses(updated);

      selectedEl.className = updated.join(" ");
    }

    setNewClass("");
  };

  // =========================================
  // DELETE ELEMENT
  // =========================================

  const deleteElement = () => {
    selectedEl.remove();

    clearSelection();
  };

  // =========================================
  // RESET STYLES
  // =========================================

  const resetStyles = () => {
    selectedEl.removeAttribute("style");

    window.location.reload();
  };

  return (
    <div className="h-screen w-96 overflow-y-auto border-l bg-white p-5 shadow-xl">
      {/* HEADER */}

      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <SwatchBook className="h-5 w-5" />
          Settings
        </h2>

        <Button size="icon" variant="destructive" onClick={deleteElement}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* FONT SIZE */}

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium">Font Size</label>

        <Select
          value={styles.fontSize}
          onValueChange={(value) => applyStyle("fontSize", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Font Size" />
          </SelectTrigger>

          <SelectContent>
            {[...Array(80)].map((_, index) => (
              <SelectItem key={index} value={`${index + 10}px`}>
                {index + 10}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* COLORS */}

      <div className="mb-5 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 flex items-center gap-1 text-sm font-medium">
            <Palette className="h-4 w-4" />
            Text
          </label>

          <input
            type="color"
            value={styles.color}
            onChange={(e) => applyStyle("color", e.target.value)}
            className="h-10 w-full cursor-pointer rounded-lg border"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-1 text-sm font-medium">
            <Brush className="h-4 w-4" />
            Background
          </label>

          <input
            type="color"
            value={styles.backgroundColor}
            onChange={(e) => applyStyle("backgroundColor", e.target.value)}
            className="h-10 w-full cursor-pointer rounded-lg border"
          />
        </div>
      </div>

      {/* ALIGNMENT */}

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium">Alignment</label>

        <ToggleGroup
          type="single"
          value={styles.textAlign}
          onValueChange={(value) => applyStyle("textAlign", value)}
          className="grid grid-cols-3 rounded-xl border p-1"
        >
          <ToggleGroupItem value="left">
            <AlignLeft className="h-4 w-4" />
          </ToggleGroupItem>

          <ToggleGroupItem value="center">
            <AlignCenter className="h-4 w-4" />
          </ToggleGroupItem>

          <ToggleGroupItem value="right">
            <AlignRight className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* FONT WEIGHT */}

      <div className="mb-5">
        <label className="mb-2 flex items-center gap-1 text-sm font-medium">
          <Bold className="h-4 w-4" />
          Font Weight
        </label>

        <Select
          value={styles.fontWeight}
          onValueChange={(value) => applyStyle("fontWeight", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="300">Light</SelectItem>

            <SelectItem value="400">Normal</SelectItem>

            <SelectItem value="500">Medium</SelectItem>

            <SelectItem value="700">Bold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* DIMENSIONS */}

      <div className="mb-5 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Width</label>

          <Input
            value={styles.width}
            placeholder="100%"
            onChange={(e) => applyStyle("width", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Height</label>

          <Input
            value={styles.height}
            placeholder="300px"
            onChange={(e) => applyStyle("height", e.target.value)}
          />
        </div>
      </div>

      {/* SPACING */}

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">Padding</label>

          <Input
            value={styles.padding}
            placeholder="10px 20px"
            onChange={(e) => applyStyle("padding", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Margin</label>

          <Input
            value={styles.margin}
            placeholder="20px auto"
            onChange={(e) => applyStyle("margin", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-1 text-sm font-medium">
            <CornerDownRight className="h-4 w-4" />
            Border Radius
          </label>

          <Input
            value={styles.borderRadius}
            placeholder="12px"
            onChange={(e) => applyStyle("borderRadius", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Border</label>

          <Input
            value={styles.border}
            placeholder="1px solid #000"
            onChange={(e) => applyStyle("border", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Box Shadow</label>

          <Input
            value={styles.boxShadow}
            placeholder="0 4px 20px rgba(0,0,0,0.1)"
            onChange={(e) => applyStyle("boxShadow", e.target.value)}
          />
        </div>
      </div>

      {/* CLASSES */}

      <div className="mt-8">
        <label className="mb-3 block text-sm font-semibold">
          Tailwind Classes
        </label>

        <div className="mb-4 flex flex-wrap gap-2">
          {classes.length > 0 ? (
            classes.map((cls) => (
              <span
                key={cls}
                className="flex items-center gap-2 rounded-full border bg-gray-100 px-3 py-1 text-xs"
              >
                {cls}

                <button
                  onClick={() => removeClass(cls)}
                  className="text-red-500"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">No classes</span>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={newClass}
            placeholder="Add class"
            onChange={(e) => setNewClass(e.target.value)}
          />

          <Button onClick={addClass}>Add</Button>
        </div>
      </div>

      {/* FOOTER */}

      <div className="mt-10">
        <Button variant="outline" className="w-full" onClick={resetStyles}>
          Reset Styles
        </Button>
      </div>
    </div>
  );
}

export default SettingSection;
