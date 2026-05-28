import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import SyntaxHighlighter from "react-syntax-highlighter";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

function ViewCodeBlock({ children, code }: any) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };
  return (
    <div>
      <Dialog>
        <DialogTrigger>{children}</DialogTrigger>
        <DialogContent className=" min-w-5xl max-h-[600px] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Source Code
              <Button onClick={handleCopy}>
                <Copy />{" "}
              </Button>
            </DialogTitle>
            <DialogDescription>
              <div>
                <SyntaxHighlighter>{code}</SyntaxHighlighter>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ViewCodeBlock;
