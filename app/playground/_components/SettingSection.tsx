"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { toast } from "sonner";

type Props = {
  selectedEl: HTMLElement | null;
  clearSelection: () => void;
  setGeneratedCode: React.Dispatch<React.SetStateAction<string>>;
};

function SettingSection({
  selectedEl,
  clearSelection,
  setGeneratedCode,
}: Props) {
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

  // ==========================================
  // COMPREHENSIVE MASTER SYNCHRONIZATION WORKER
  // ==========================================
  const syncCanvasCodeBlock = useCallback(() => {
    if (!selectedEl) return;

    // 1. Trace the precise tree topology index pathway of the selected element inside its Iframe DOM context
    const previewDocument = selectedEl.ownerDocument;
    const allElements = Array.from(previewDocument.querySelectorAll("*"));
    const elementIndex = allElements.indexOf(selectedEl);

    if (elementIndex === -1) return;

    // 2. Safely reconstruct the string source code block by mirroring modifications onto a virtual tree match
    setGeneratedCode((prevCode) => {
      if (!prevCode) return prevCode;

      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(prevCode, "text/html");
        const targetedDomNodes = Array.from(doc.querySelectorAll("*"));

        if (targetedDomNodes[elementIndex]) {
          const targetNode = targetedDomNodes[elementIndex] as HTMLElement;

          // Sync text modifications & class lists safely
          targetNode.className = selectedEl.className;

          if (selectedEl.getAttribute("style")) {
            targetNode.setAttribute(
              "style",
              selectedEl.getAttribute("style") || "",
            );
          } else {
            targetNode.removeAttribute("style");
          }

          return doc.documentElement.outerHTML;
        }
      } catch (err) {
        console.error(
          "HTML production generation synchronization failure:",
          err,
        );
      }
      return prevCode;
    });
  }, [selectedEl, setGeneratedCode]);

  // =========================================
  // INITIALIZE FROM WORKSPACE PREVIEW
  // =========================================
  useEffect(() => {
    if (!selectedEl) return;

    // Use window.getComputedStyle to extract inherited property snapshots if inline fields are blank
    const computed =
      selectedEl.ownerDocument?.defaultView?.getComputedStyle(selectedEl);

    setStyles({
      fontSize: selectedEl.style.fontSize || computed?.fontSize || "16px",
      color: selectedEl.style.color || computed?.color || "#000000",
      backgroundColor:
        selectedEl.style.backgroundColor ||
        computed?.backgroundColor ||
        "#ffffff",
      padding: selectedEl.style.padding || "",
      margin: selectedEl.style.margin || "",
      borderRadius:
        selectedEl.style.borderRadius || computed?.borderRadius || "",
      width: styles.width || selectedEl.style.width || "", // Preserved fallback reference integrity
      height: selectedEl.style.height || "",
      fontWeight: selectedEl.style.fontWeight || computed?.fontWeight || "400",
      textAlign: selectedEl.style.textAlign || computed?.textAlign || "left",
      border: selectedEl.style.border || "",
      boxShadow: selectedEl.style.boxShadow || computed?.boxShadow || "",
    });

    // Cleanly normalize multi-spaced class parameters to avoid layout bugs
    const currentClasses = selectedEl.className.split(/\s+/).filter(Boolean);
    setClasses(currentClasses);
  }, [selectedEl, styles.width]);

  // =========================================
  // APPLY STYLE CHANGES CLEANLY
  // =========================================
  const applyStyle = (property: string, value: string) => {
    if (!selectedEl) return;

    // Trigger visual reflows safely
    selectedEl.style[property as any] = value;

    setStyles((prev) => ({
      ...prev,
      [property]: value,
    }));

    syncCanvasCodeBlock();
  };

  // =========================================
  // MODIFIERS (CLASSES / STRINGS)
  // =========================================
  const removeClass = (cls: string) => {
    if (!selectedEl) return;
    const updated = classes.filter((c) => c !== cls);
    setClasses(updated);
    selectedEl.className = updated.join(" ");
    syncCanvasCodeBlock();
  };

  const addClass = () => {
    if (!selectedEl) return;
    const trimmed = newClass.trim();
    if (!trimmed) return;

    if (!classes.includes(trimmed)) {
      const updated = [...classes, trimmed];
      setClasses(updated);
      selectedEl.className = updated.join(" ");
      syncCanvasCodeBlock();
    }
    setNewClass("");
  };

  const deleteElement = () => {
    if (!selectedEl) return;

    // Cache standard removal layout maps before tearing down parameters
    setGeneratedCode((prevCode) => {
      if (!prevCode) return prevCode;
      const parser = new DOMParser();
      const doc = parser.parseFromString(prevCode, "text/html");
      const allElements = Array.from(doc.querySelectorAll("*"));
      const elementIndex = Array.from(
        selectedEl.ownerDocument.querySelectorAll("*"),
      ).indexOf(selectedEl);

      if (allElements[elementIndex]) {
        allElements[elementIndex].remove();
        return doc.documentElement.outerHTML;
      }
      return prevCode;
    });

    selectedEl.remove();
    clearSelection();
    toast.success("Element removed from canvas architecture.");
  };

  const resetStyles = () => {
    if (!selectedEl) return;
    selectedEl.removeAttribute("style");
    syncCanvasCodeBlock();

    // Clear state triggers smoothly without triggering a window context refresh
    setStyles({
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
    toast.success("Styles reverted successfully!");
  };

  if (!selectedEl) {
    return (
      <div className="w-96 border-l bg-white h-screen p-6 flex flex-col items-center justify-center text-center text-muted-foreground shadow-xl">
        <SwatchBook className="h-8 w-8 mb-2 text-muted-foreground/50" />
        <p className="text-sm font-medium">
          Select any element on the website workspace canvas to configure styles
          or class properties.
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-96 overflow-y-auto border-l bg-white p-5 shadow-xl pb-12">
      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <SwatchBook className="h-5 w-5 text-primary" /> Element Settings
        </h2>
        <Button
          size="icon"
          variant="destructive"
          onClick={deleteElement}
          title="Delete Element"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* FONT SIZE */}
      <div className="mb-5">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Font Size
        </label>
        <Select
          value={styles.fontSize}
          onValueChange={(value) => applyStyle("fontSize", value ?? "")}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select dimension" />
          </SelectTrigger>
          <SelectContent>
            {[...Array(80)].map((_, index) => {
              const size = `${index + 10}px`;
              return (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* COLORS */}
      <div className="mb-5 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Palette className="h-3.5 w-3.5 text-muted-foreground/70" /> Text
            Color
          </label>
          <input
            type="color"
            value={styles.color.startsWith("#") ? styles.color : "#000000"}
            onChange={(e) => applyStyle("color", e.target.value)}
            className="h-9 w-full cursor-pointer rounded-lg border p-0.5 bg-background"
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Brush className="h-3.5 w-3.5 text-muted-foreground/70" />{" "}
            Background
          </label>
          <input
            type="color"
            value={
              styles.backgroundColor.startsWith("#")
                ? styles.backgroundColor
                : "#ffffff"
            }
            onChange={(e) => applyStyle("backgroundColor", e.target.value)}
            className="h-9 w-full cursor-pointer rounded-lg border p-0.5 bg-background"
          />
        </div>
      </div>

      {/* ALIGNMENT */}
      {/* ALIGNMENT */}
      <div className="mb-5">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Text Alignment
        </label>
        <div className="flex rounded-lg border p-1 bg-muted/20 gap-1 w-fit">
          <button
            type="button"
            onClick={() => applyStyle("textAlign", "left")}
            className={`h-8 w-10 flex items-center justify-center rounded-md transition-all ${
              styles.textAlign === "left"
                ? "bg-white text-foreground shadow-sm font-semibold border"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <AlignLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => applyStyle("textAlign", "center")}
            className={`h-8 w-10 flex items-center justify-center rounded-md transition-all ${
              styles.textAlign === "center"
                ? "bg-white text-foreground shadow-sm font-semibold border"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <AlignCenter className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => applyStyle("textAlign", "right")}
            className={`h-8 w-10 flex items-center justify-center rounded-md transition-all ${
              styles.textAlign === "right"
                ? "bg-white text-foreground shadow-sm font-semibold border"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <AlignRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* FONT WEIGHT */}
      <div className="mb-5">
        <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Bold className="h-3.5 w-3.5" /> Font Weight
        </label>
        <Select
          value={styles.fontWeight}
          onValueChange={(value) => applyStyle("fontWeight", value)}
        >
          <SelectTrigger className="h-9">
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
      <div className="mb-5 grid grid-cols-2 gap-4 border-t pt-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Width
          </label>
          <Input
            value={styles.width}
            placeholder="e.g., 100%, 250px"
            className="h-9 text-sm"
            onChange={(e) => applyStyle("width", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Height
          </label>
          <Input
            value={styles.height}
            placeholder="e.g., auto, 300px"
            className="h-9 text-sm"
            onChange={(e) => applyStyle("height", e.target.value)}
          />
        </div>
      </div>

      {/* SPACING & BOX STRUCTURE */}
      <div className="space-y-4 border-t pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Padding
            </label>
            <Input
              value={styles.padding}
              placeholder="e.g., 12px 24px"
              className="h-9 text-sm"
              onChange={(e) => applyStyle("padding", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Margin
            </label>
            <Input
              value={styles.margin}
              placeholder="e.g., 0 auto, 10px"
              className="h-9 text-sm"
              onChange={(e) => applyStyle("margin", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground/70" />{" "}
            Border Radius
          </label>
          <Input
            value={styles.borderRadius}
            placeholder="e.g., 8px, 50%"
            className="h-9 text-sm"
            onChange={(e) => applyStyle("borderRadius", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Border Outline
          </label>
          <Input
            value={styles.border}
            placeholder="e.g., 1px solid dashed #e2e8f0"
            className="h-9 text-sm"
            onChange={(e) => applyStyle("border", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Box Shadow
          </label>
          <Input
            value={styles.boxShadow}
            placeholder="e.g., 0 4px 12px rgba(0,0,0,0.05)"
            className="h-9 text-sm"
            onChange={(e) => applyStyle("boxShadow", e.target.value)}
          />
        </div>
      </div>

      {/* TAILWIND UTILITY CLASSES MANAGER */}
      <div className="mt-6 border-t pt-4">
        <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tailwind Utility Classes
        </label>
        <div className="mb-3 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border rounded-lg bg-muted/10">
          {classes.length > 0 ? (
            classes.map((cls) => (
              <span
                key={cls}
                className="flex items-center gap-1.5 rounded-md border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground select-all"
              >
                {cls}
                <button
                  onClick={() => removeClass(cls)}
                  className="text-muted-foreground hover:text-destructive font-bold transition-colors text-xs"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground/60 p-1 italic">
              No classes applied
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={newClass}
            placeholder="e.g., shadow-md, rounded-none"
            className="h-9 text-sm"
            onChange={(e) => setNewClass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addClass()}
          />
          <Button size="sm" className="h-9 px-3" onClick={addClass}>
            Add
          </Button>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="mt-8 border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground"
          onClick={resetStyles}
        >
          Reset Inline Styles
        </Button>
      </div>
    </div>
  );
}

export default SettingSection;
