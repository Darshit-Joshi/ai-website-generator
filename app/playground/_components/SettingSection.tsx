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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  setGeneratedCode: (updater: (prev: string) => string) => void;
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

  // FIXED: Must scan using the exact same selection scope as the parent frame container (#root *)
  const getSelectedElementDOMIndex = useCallback(() => {
    const doc = selectedEl.ownerDocument;
    if (!doc) return -1;
    return Array.from(doc.querySelectorAll("#root *")).indexOf(selectedEl);
  }, [selectedEl]);

  useEffect(() => {
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
      width: selectedEl.style.width || "",
      height: selectedEl.style.height || "",
      fontWeight: selectedEl.style.fontWeight || computed?.fontWeight || "400",
      textAlign: selectedEl.style.textAlign || computed?.textAlign || "left",
      border: selectedEl.style.border || "",
      boxShadow: selectedEl.style.boxShadow || computed?.boxShadow || "",
    });

    const cleanClasses = selectedEl.className
      .replace("canvas-selected-element", "")
      .split(/\s+/)
      .filter(Boolean);
    setClasses(cleanClasses);
  }, [selectedEl]);

  // FIXED: Reconstruct raw text using the precise scoped query mapping layout mirror
  const runAtomicWorkspaceMutation = useCallback(
    (mutationWorker: (node: HTMLElement) => void) => {
      const targetIndex = getSelectedElementDOMIndex();
      if (targetIndex === -1) return;

      setGeneratedCode((prevCode) => {
        if (!prevCode) return prevCode;
        try {
          const parser = new DOMParser();
          // Since code inside your workspace array maps purely to content INSIDE #root,
          // we isolate body-level element indexes cleanly
          const doc = parser.parseFromString(
            `<div>${prevCode}</div>`,
            "text/html",
          );
          const workspaceNodes = Array.from(doc.querySelectorAll("div *"));
          const targetNode = workspaceNodes[targetIndex] as HTMLElement;

          if (targetNode) {
            mutationWorker(targetNode);
            // Return clean inner markup content back to our parent state layout map
            return doc.querySelector("div")?.innerHTML || prevCode;
          }
        } catch (err) {
          console.error("Mutation Sync Error:", err);
        }
        return prevCode;
      });
    },
    [getSelectedElementDOMIndex, setGeneratedCode],
  );

  const applyStyle = (property: string, value: string) => {
    selectedEl.style[property as any] = value;
    setStyles((prev) => ({ ...prev, [property]: value }));

    runAtomicWorkspaceMutation((targetNode) => {
      targetNode.style[property as any] = value;
    });
  };

  const removeClass = (cls: string) => {
    const updated = classes.filter((c) => c !== cls);
    setClasses(updated);

    selectedEl.className = [...updated, "canvas-selected-element"].join(" ");
    runAtomicWorkspaceMutation((targetNode) => {
      targetNode.className = updated.join(" ");
    });
  };

  const addClass = () => {
    const trimmed = newClass.trim();
    if (!trimmed || classes.includes(trimmed)) return;

    const updated = [...classes, trimmed];
    setClasses(updated);

    selectedEl.className = [...updated, "canvas-selected-element"].join(" ");
    runAtomicWorkspaceMutation((targetNode) => {
      targetNode.className = updated.join(" ");
    });
    setNewClass("");
  };

  const deleteElement = () => {
    const targetIndex = getSelectedElementDOMIndex();
    clearSelection();

    setGeneratedCode((prevCode) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${prevCode}</div>`, "text/html");
      const workspaceNodes = Array.from(doc.querySelectorAll("div *"));
      if (workspaceNodes[targetIndex]) workspaceNodes[targetIndex].remove();
      return doc.querySelector("div")?.innerHTML || prevCode;
    });
    selectedEl.remove();
  };

  return (
    <div className="h-screen w-96 overflow-y-auto border-l bg-white p-5 shadow-xl pb-12 transition-all">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <SwatchBook className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">
            Element Settings
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
            onClick={clearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8"
            onClick={deleteElement}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* FONT SIZE */}
      <div className="mb-5">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Font Size
        </label>
        <Select
          value={styles.fontSize}
          onValueChange={(val) => applyStyle("fontSize", val ?? "")}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[...Array(60)].map((_, i) => {
              const sz = `${i + 12}px`;
              return (
                <SelectItem key={sz} value={sz}>
                  {sz}
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
            <Palette className="h-3.5 w-3.5" /> Text
          </label>
          <input
            type="color"
            value={styles.color.startsWith("#") ? styles.color : "#000000"}
            onChange={(e) => applyStyle("color", e.target.value)}
            className="h-9 w-full cursor-pointer rounded-lg border p-0.5"
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Brush className="h-3.5 w-3.5" /> BG
          </label>
          <input
            type="color"
            value={
              styles.backgroundColor.startsWith("#")
                ? styles.backgroundColor
                : "#ffffff"
            }
            onChange={(e) => applyStyle("backgroundColor", e.target.value)}
            className="h-9 w-full cursor-pointer rounded-lg border p-0.5"
          />
        </div>
      </div>

      {/* ALIGNMENT */}
      <div className="mb-5">
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Text Alignment
        </label>
        <div className="flex rounded-lg border p-1 bg-muted/20 gap-1 w-fit">
          {["left", "center", "right"].map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => applyStyle("textAlign", align)}
              className={`h-8 w-10 flex items-center justify-center rounded-md transition-all ${styles.textAlign === align ? "bg-white border shadow-sm" : "text-muted-foreground"}`}
            >
              {align === "left" && <AlignLeft className="h-4 w-4" />}
              {align === "center" && <AlignCenter className="h-4 w-4" />}
              {align === "right" && <AlignRight className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* DIMENSIONS */}
      <div className="mb-5 grid grid-cols-2 gap-4 border-t pt-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Width
          </label>
          <Input
            value={styles.width}
            placeholder="e.g. 100%"
            onChange={(e) => applyStyle("width", e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Height
          </label>
          <Input
            value={styles.height}
            placeholder="e.g. auto"
            onChange={(e) => applyStyle("height", e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* SPACING */}
      <div className="space-y-4 border-t pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Padding
            </label>
            <Input
              value={styles.padding}
              placeholder="12px"
              onChange={(e) => applyStyle("padding", e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Margin
            </label>
            <Input
              value={styles.margin}
              placeholder="0 auto"
              onChange={(e) => applyStyle("margin", e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <CornerDownRight className="h-3.5 w-3.5" /> Border Radius
          </label>
          <Input
            value={styles.borderRadius}
            placeholder="8px"
            onChange={(e) => applyStyle("borderRadius", e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* UTILITY CLASSES */}
      <div className="mt-6 border-t pt-4">
        <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tailwind Classes
        </label>
        <div className="mb-3 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border rounded-lg bg-muted/10">
          {classes.map((cls) => (
            <span
              key={cls}
              className="flex items-center gap-1.5 rounded-md border bg-muted px-2 py-0.5 text-[11px] font-medium"
            >
              {cls}
              <button
                onClick={() => removeClass(cls)}
                className="text-muted-foreground hover:text-destructive font-bold text-xs"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newClass}
            placeholder="e.g. shadow-lg"
            onChange={(e) => setNewClass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addClass()}
            className="h-9 text-sm"
          />
          <Button size="sm" className="h-9 px-3" onClick={addClass}>
            Add
          </Button>
          <button
        onClick={clearSelection}
        className="w-full mt-4 py-2 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium font-mono rounded-lg transition-colors border border-zinc-200"
      >
        Deselect & Finish Editing
      </button>
        </div>
      </div>
    </div>
  );
}

export default SettingSection;
