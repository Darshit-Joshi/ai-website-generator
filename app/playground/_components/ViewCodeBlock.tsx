"use client";

import React, { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { Code2Icon } from "lucide-react";

type Props = {
  code?: string;
};

function ViewCodeBlock({ code }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="rounded-xl">
        Code
        <Code2Icon className="ml-2 h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Generated Code</DialogTitle>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-auto rounded-xl bg-black p-4">
            <pre className="whitespace-pre-wrap break-words text-sm text-green-400">
              <code>{code}</code>
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ViewCodeBlock;
